import os
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.db.models import Analysis, Report, Consent, ModelMetric
from backend.app.schemas.analysis import (
    AnalyzeRequest, AnalysisResponse,
    ReportCreateRequest, ReportResponse,
    SubmitReportResponse, ConsentRequest, ConsentResponse,
    StatsResponse
)
from backend.app.services.preprocessing import extract_entities, sanitize_for_privacy
from backend.app.services.rule_engine import analyze_rules
from backend.app.services.url_analyzer import analyze_urls
from backend.app.services.ml_service import ml_service
from backend.app.services.llm_service import analyze_with_llm
from backend.app.services.risk_engine import compute_risk
from backend.app.services.explanation_engine import generate_explanation
from backend.app.services.pdf_generator import generate_incident_report_pdf
from backend.app.services.ocr_service import validate_and_extract_image
from backend.app.adapters.reporting import get_reporting_adapter
from backend.app.adapters.whatsapp import get_whatsapp_adapter
from backend.app.core.config import settings

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(func.now())
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "database_connected": db_ok,
        "model_loaded": ml_service.is_loaded,
        "model_version": ml_service.metadata.get("model_version", "v2.0-tfidf-linear"),
        "ai_mode": "Live Provider" if settings.AI_API_KEY else "Deterministic Offline",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_message(req: AnalyzeRequest, db: Session = Depends(get_db)):
    raw_message = req.message or ""
    raw_url = req.url or ""
    combined_text = (raw_message + " " + raw_url).strip()

    # 1. Preprocessing & Entity Extraction
    extracted = extract_entities(combined_text)
    if raw_url and raw_url not in extracted["urls"]:
        extracted["urls"].append(raw_url)

    # 2. Rule Engine Analysis
    rule_res = analyze_rules(combined_text, extracted)

    # 3. SSRF-Safe URL Analysis
    url_res = analyze_urls(extracted["urls"], rule_res["brand_claimed"])

    # 4. ML Statistical Classifier Inference
    ml_res = ml_service.predict(combined_text)

    # 5. Optional LLM Deep Semantic Layer
    llm_res = await analyze_with_llm(combined_text, extracted["urls"], rule_res["brand_claimed"])

    # 6. Risk Engine Synthesis (Four Signals Aggregation)
    risk_score, risk_level, indicators, signal_breakdown = compute_risk(
        rule_res, url_res, ml_res, llm_res
    )

    # 7. Explanation & Multilingual Generation
    category = rule_res["category"]
    explanation = generate_explanation(
        risk_score, risk_level, category, rule_res["brand_claimed"], indicators, signal_breakdown
    )

    # 8. Persist Analysis Record
    analysis_record = Analysis(
        message=raw_message or raw_url,
        url=raw_url or (extracted["urls"][0] if extracted["urls"] else None),
        risk_score=risk_score,
        risk_level=risk_level,
        category=category,
        brand_claimed=rule_res["brand_claimed"],
        summary=explanation["summary"],
        indicators=indicators,
        signal_breakdown=signal_breakdown,
        ml_probability=ml_res["probability"],
        ml_model_version=ml_res["model_version"],
        recommended_action=explanation["recommended_action"],
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return AnalysisResponse(
        id=analysis_record.id,
        message=analysis_record.message,
        extracted_urls=extracted["urls"],
        brand_claimed=analysis_record.brand_claimed or "None",
        category=analysis_record.category,
        risk_score=analysis_record.risk_score,
        risk_level=analysis_record.risk_level,
        summary=analysis_record.summary,
        plain_reasons=explanation["plain_reasons"],
        recommended_action=analysis_record.recommended_action,
        ml_probability=analysis_record.ml_probability,
        ml_model_version=analysis_record.ml_model_version,
        indicators=indicators,
        signals=signal_breakdown,
        multilingual=explanation["multilingual"],
        created_at=analysis_record.created_at
    )

@router.get("/analyses", response_model=List[AnalysisResponse])
def list_analyses(limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(Analysis).order_by(desc(Analysis.created_at)).limit(limit).all()
    results = []
    for r in records:
        exp = generate_explanation(
            r.risk_score, r.risk_level, r.category, r.brand_claimed or "None", r.indicators or [], r.signal_breakdown or {}
        )
        extracted = extract_entities(r.message)
        results.append(AnalysisResponse(
            id=r.id,
            message=r.message,
            extracted_urls=extracted["urls"],
            brand_claimed=r.brand_claimed or "None",
            category=r.category,
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            summary=r.summary,
            plain_reasons=exp["plain_reasons"],
            recommended_action=r.recommended_action,
            ml_probability=r.ml_probability,
            ml_model_version=r.ml_model_version,
            indicators=r.indicators or [],
            signals=r.signal_breakdown or {},
            multilingual=exp["multilingual"],
            created_at=r.created_at
        ))
    return results

@router.get("/analyses/{id}", response_model=AnalysisResponse)
def get_analysis(id: int, db: Session = Depends(get_db)):
    r = db.query(Analysis).filter(Analysis.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    
    exp = generate_explanation(
        r.risk_score, r.risk_level, r.category, r.brand_claimed or "None", r.indicators or [], r.signal_breakdown or {}
    )
    extracted = extract_entities(r.message)
    return AnalysisResponse(
        id=r.id,
        message=r.message,
        extracted_urls=extracted["urls"],
        brand_claimed=r.brand_claimed or "None",
        category=r.category,
        risk_score=r.risk_score,
        risk_level=r.risk_level,
        summary=r.summary,
        plain_reasons=exp["plain_reasons"],
        recommended_action=r.recommended_action,
        ml_probability=r.ml_probability,
        ml_model_version=r.ml_model_version,
        indicators=r.indicators or [],
        signals=r.signal_breakdown or {},
        multilingual=exp["multilingual"],
        created_at=r.created_at
    )

@router.post("/reports", response_model=ReportResponse)
def create_report(req: ReportCreateRequest, db: Session = Depends(get_db)):
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == req.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Referenced analysis does not exist.")

    # Check if report already exists for this analysis
    existing = db.query(Report).filter(Report.analysis_id == req.analysis_id).first()
    if existing:
        return existing

    # Generate stable human-readable Report Code: PG-{year}-{sequence}
    year = datetime.datetime.now().year
    report_count = db.query(Report).count() + 1
    report_code = f"PG-{year}-{report_count:06d}"

    report = Report(
        analysis_id=analysis.id,
        report_code=report_code,
        message=analysis.message,
        url=analysis.url,
        category=analysis.category,
        risk_level=analysis.risk_level,
        risk_score=analysis.risk_score,
        brand_claimed=analysis.brand_claimed,
        status="DRAFT",
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(report)
    
    # Record consent event for audit
    consent_record = Consent(
        event_type="REPORT_CREATION_CONSENT",
        details={"report_code": report_code, "analysis_id": analysis.id},
        consented_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(consent_record)
    db.commit()
    db.refresh(report)

    return report

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(desc(Report.created_at)).all()

@router.get("/reports/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")
    return report

@router.get("/reports/{id}/pdf")
def get_report_pdf(id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    analysis = db.query(Analysis).filter(Analysis.id == report.analysis_id).first()
    exp = generate_explanation(
        report.risk_score, report.risk_level, report.category,
        report.brand_claimed or "None",
        analysis.indicators if analysis else [],
        analysis.signal_breakdown if analysis else {}
    )

    pdf_data = {
        "report_code": report.report_code,
        "message": report.message,
        "category": report.category,
        "risk_level": report.risk_level,
        "risk_score": report.risk_score,
        "brand_claimed": report.brand_claimed,
        "status": report.status,
        "ack_id": report.ack_id,
        "signals": analysis.signal_breakdown if analysis else {},
        "plain_reasons": exp["plain_reasons"],
        "recommended_action": exp["recommended_action"]
    }

    pdf_stream = generate_incident_report_pdf(pdf_data)
    filename = f"PhishGuard-Incident-{report.report_code}.pdf"
    
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/reports/{id}/submit", response_model=SubmitReportResponse)
async def submit_report_to_authorities(id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if report.status == "SUBMITTED":
        return SubmitReportResponse(
            report_id=report.id,
            report_code=report.report_code,
            status="SUBMITTED",
            submission_adapter=report.submission_adapter or "DemoReportingAdapter",
            ack_id=report.ack_id or "NCRP-PREVIOUSLY-SUBMITTED",
            submitted_at=report.submitted_at or report.created_at,
            message="Report was already submitted."
        )

    adapter_name, adapter = get_reporting_adapter()
    payload = {
        "report_code": report.report_code,
        "category": report.category,
        "message_body": report.message,
        "risk_score": report.risk_score,
        "brand_impersonated": report.brand_claimed,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    success, ack_id, msg = await adapter.submit_report(payload)
    if not success:
        raise HTTPException(status_code=500, detail=f"Submission failed: {msg}")

    report.status = "SUBMITTED"
    report.submitted_at = datetime.datetime.now(datetime.timezone.utc)
    report.submission_adapter = adapter_name
    report.ack_id = ack_id
    db.commit()
    db.refresh(report)

    return SubmitReportResponse(
        report_id=report.id,
        report_code=report.report_code,
        status=report.status,
        submission_adapter=adapter_name,
        ack_id=ack_id,
        submitted_at=report.submitted_at,
        message=msg
    )

@router.get("/stats", response_model=StatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Analysis).count()
    high_risk = db.query(Analysis).filter(Analysis.risk_level == "HIGH RISK").count()
    suspicious = db.query(Analysis).filter(Analysis.risk_level == "SUSPICIOUS").count()
    low_risk = db.query(Analysis).filter(Analysis.risk_level == "LOW").count()
    reports_submitted = db.query(Report).filter(Report.status == "SUBMITTED").count()
    
    # Count suspicious URLs found
    suspicious_urls = db.query(Analysis).filter(Analysis.url.isnot(None), Analysis.risk_score >= 31).count()

    # Category distribution
    categories = db.query(Analysis.category, func.count(Analysis.id)).group_by(Analysis.category).all()
    cat_dist = {c[0]: c[1] for c in categories} if categories else {"Bank / KYC Impersonation": 0}

    # Top Brands
    brands = db.query(Analysis.brand_claimed, func.count(Analysis.id))\
        .filter(Analysis.brand_claimed != "None")\
        .group_by(Analysis.brand_claimed)\
        .order_by(desc(func.count(Analysis.id)))\
        .limit(5).all()
    top_brands = [{"brand": b[0], "count": b[1]} for b in brands]

    # Recent Activity
    recent = db.query(Analysis).order_by(desc(Analysis.created_at)).limit(6).all()
    recent_activity = [
        {
            "id": r.id,
            "category": r.category,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "brand": r.brand_claimed or "None",
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in recent
    ]

    # Timeline (last 7 data points)
    timeline_records = db.query(
        func.date(Analysis.created_at).label("date"),
        func.count(Analysis.id).label("count"),
        func.avg(Analysis.risk_score).label("avg_risk")
    ).group_by(func.date(Analysis.created_at)).order_by("date").limit(7).all()

    timeline = [
        {"date": str(t[0]), "detections": t[1], "avg_risk": round(float(t[2]), 1) if t[2] else 0}
        for t in timeline_records
    ]

    return StatsResponse(
        total_analyses=total,
        high_risk_count=high_risk,
        suspicious_count=suspicious,
        low_risk_count=low_risk,
        reports_submitted=reports_submitted,
        suspicious_urls_found=suspicious_urls,
        risk_distribution={
            "HIGH RISK": high_risk,
            "SUSPICIOUS": suspicious,
            "LOW": low_risk
        },
        category_distribution=cat_dist,
        top_brands=top_brands,
        recent_activity=recent_activity,
        timeline=timeline
    )

@router.get("/model/metrics")
def get_model_metrics():
    """
    Returns the real, honest evaluation report of the trained ML classifier,
    including both overall test metrics and the financial_scams_detection subset metrics.
    """
    metrics = ml_service.evaluation_metrics
    if not metrics:
        # If not cached in memory, read directly from evaluation_report.json
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.abspath(os.path.join(base_dir, "..", "..", "ml", "evaluation_report.json"))
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                metrics = json.load(f)
        else:
            metrics = {
                "model_version": ml_service.metadata.get("model_version", "v2.0"),
                "status": "Artifact metrics loading"
            }
    return metrics

@router.post("/consent", response_model=ConsentResponse)
def record_consent(req: ConsentRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    import hashlib
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]

    consent = Consent(
        event_type=req.event_type,
        details=req.details,
        ip_hash=ip_hash,
        consented_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return ConsentResponse(id=consent.id, event_type=consent.event_type, consented_at=consent.consented_at)

@router.get("/privacy/export")
def export_user_data(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).all()
    reports = db.query(Report).all()
    consents = db.query(Consent).all()

    return {
        "export_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dpdpa_notice": "Data export produced in accordance with India Digital Personal Data Protection Act, 2023.",
        "analyses": [
            {
                "id": a.id,
                "message": sanitize_for_privacy(a.message),
                "url": a.url,
                "risk_score": a.risk_score,
                "risk_level": a.risk_level,
                "category": a.category,
                "brand_claimed": a.brand_claimed,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in analyses
        ],
        "reports": [
            {
                "id": r.id,
                "report_code": r.report_code,
                "category": r.category,
                "risk_level": r.risk_level,
                "status": r.status,
                "ack_id": r.ack_id,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reports
        ],
        "consents": [
            {
                "id": c.id,
                "event_type": c.event_type,
                "consented_at": c.consented_at.isoformat() if c.consented_at else None
            }
            for c in consents
        ]
    }

@router.delete("/privacy/data")
def delete_user_data(db: Session = Depends(get_db)):
    deleted_reports = db.query(Report).delete()
    deleted_analyses = db.query(Analysis).delete()
    deleted_consents = db.query(Consent).delete()
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "All user analyses, generated incident reports, and associated records have been permanently erased from the database.",
        "records_deleted": {
            "analyses": deleted_analyses,
            "reports": deleted_reports,
            "consents": deleted_consents
        },
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.post("/ocr")
async def process_ocr_upload(file: UploadFile = File(...)):
    # Validate magic bytes and enforce image allowlist
    file_bytes = await file.read()
    is_valid, extracted_text, error_msg = validate_and_extract_image(file_bytes)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    return {
        "success": True,
        "extracted_text": extracted_text,
        "filename": "screenshot_sanitized.png",
        "size_bytes": len(file_bytes)
    }

@router.get("/whatsapp/webhook")
def verify_whatsapp_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Invalid verification token")

@router.post("/whatsapp/webhook")
async def handle_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    # Process incoming message
    try:
        entry = body.get("entry", [])[0]
        change = entry.get("changes", [])[0]
        value = change.get("value", {})
        messages = value.get("messages", [])
        if messages:
            msg = messages[0]
            from_number = msg.get("from")
            text = msg.get("text", {}).get("body", "")
            if text:
                # Run full analysis
                req = AnalyzeRequest(message=text)
                res = await analyze_message(req, db)
                
                # Format response for WhatsApp
                reply_body = (
                    f"🛡️ *PhishGuard Verdict: {res.risk_level} ({res.risk_score}/100)*\n\n"
                    f"📂 *Category:* {res.category}\n"
                    f"⚠️ *Key Reason:* {res.plain_reasons[0] if res.plain_reasons else 'N/A'}\n\n"
                    f"💡 *Action:* {res.recommended_action}\n\n"
                    f"Report reference: #{res.id} | Call 1930 for Cyber Crime Helpline."
                )
                wa_adapter = get_whatsapp_adapter()
                await wa_adapter.send_message(from_number, reply_body)
    except Exception as e:
        pass

    return {"status": "EVENT_RECEIVED"}

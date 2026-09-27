import datetime
import json
import os
from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import Analysis, Report, Consent, ModelMetric
from backend.app.services.ml_service import ml_service
from backend.app.services.rule_engine import analyze_rules
from backend.app.services.url_analyzer import analyze_urls
from backend.app.services.risk_engine import compute_risk
from backend.app.services.explanation_engine import generate_explanation
from backend.app.services.preprocessing import extract_entities

DEMO_MESSAGES = [
    {
        "message": "Dear SBI User, your YONO account will be blocked today. Please update your KYC immediately at http://sbi-kyc.in to avoid service discontinuation.",
        "url": "http://sbi-kyc.in",
        "create_report": True,
        "submit": True
    },
    {
        "message": "Income Tax Department: Your tax refund of Rs 25,400 has been approved. Please verify your bank account details at http://incometax-refund.info immediately.",
        "url": "http://incometax-refund.info",
        "create_report": True,
        "submit": True
    },
    {
        "message": "URGENT: Electricity power supply to your premises will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer at 9876543210 to resolve.",
        "url": None,
        "create_report": True,
        "submit": False
    },
    {
        "message": "Congratulations! You have won Rs 50 Lakhs in the Maruti Suzuki Mega Lucky Draw. Click http://win-lottery-car.xyz to claim prize.",
        "url": "http://win-lottery-car.xyz",
        "create_report": True,
        "submit": False
    },
    {
        "message": "Hey bro, are we still meeting for dinner at 7 PM today?",
        "url": None,
        "create_report": False,
        "submit": False
    },
    {
        "message": "Your OTP for HDFC NetBanking login is 894120. Valid for 5 mins. Do not share with anyone.",
        "url": None,
        "create_report": False,
        "submit": False
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Analysis).count() > 0:
        print("[*] Database already contains records. Skipping seed.")
        db.close()
        return

    print("[*] Seeding demo analysis records and incident reports...")
    
    # Store model metrics in DB
    metrics_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "evaluation_report.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics_data = json.load(f)
            ver = metrics_data.get("model_version", "v2.0-tfidf-linear")
            if not db.query(ModelMetric).filter(ModelMetric.model_version == ver).first():
                model_metric = ModelMetric(
                    model_version=ver,
                    trained_at=datetime.datetime.now(datetime.timezone.utc),
                    metrics=metrics_data
                )
                db.add(model_metric)
                db.commit()

    report_idx = 1
    for item in DEMO_MESSAGES:
        msg = item["message"]
        url = item["url"]
        combined = (msg + (" " + url if url else "")).strip()

        extracted = extract_entities(combined)
        rule_res = analyze_rules(combined, extracted)
        url_res = analyze_urls(extracted["urls"], rule_res["brand_claimed"])
        ml_res = ml_service.predict(combined)
        llm_res = {
            "used": False,
            "provider": "Deterministic Layer",
            "score_delta": 0,
            "confidence": 0.0,
            "summary": "Offline analysis."
        }

        risk_score, risk_level, indicators, signal_breakdown = compute_risk(
            rule_res, url_res, ml_res, llm_res
        )
        category = rule_res["category"]
        exp = generate_explanation(
            risk_score, risk_level, category, rule_res["brand_claimed"], indicators, signal_breakdown
        )

        analysis = Analysis(
            message=msg,
            url=url,
            risk_score=risk_score,
            risk_level=risk_level,
            category=category,
            brand_claimed=rule_res["brand_claimed"],
            summary=exp["summary"],
            indicators=indicators,
            signal_breakdown=signal_breakdown,
            ml_probability=ml_res["probability"],
            ml_model_version=ml_res["model_version"],
            recommended_action=exp["recommended_action"],
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=6 - report_idx)
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        if item["create_report"]:
            report_code = f"PG-2026-{report_idx:06d}"
            status = "SUBMITTED" if item["submit"] else "DRAFT"
            ack_id = f"NCRP-2026-{894000 + report_idx}" if item["submit"] else None
            
            report = Report(
                analysis_id=analysis.id,
                report_code=report_code,
                message=analysis.message,
                url=analysis.url,
                category=analysis.category,
                risk_level=analysis.risk_level,
                risk_score=analysis.risk_score,
                brand_claimed=analysis.brand_claimed,
                status=status,
                submitted_at=datetime.datetime.now(datetime.timezone.utc) if item["submit"] else None,
                submission_adapter="DemoReportingAdapter" if item["submit"] else None,
                ack_id=ack_id,
                created_at=analysis.created_at
            )
            db.add(report)
            
            consent = Consent(
                event_type="DEMO_SEED_CONSENT",
                details={"report_code": report_code},
                consented_at=analysis.created_at
            )
            db.add(consent)
            db.commit()
            report_idx += 1

    print("[+] Database seeded successfully with demo records.")
    db.close()

if __name__ == "__main__":
    seed_database()

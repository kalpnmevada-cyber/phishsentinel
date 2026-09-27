import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_incident_report_pdf(report_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    primary_teal = colors.HexColor("#0F6E56")
    dark_gray = colors.HexColor("#1F2937")
    light_bg = colors.HexColor("#F3F4F6")
    border_color = colors.HexColor("#D1D5DB")
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=primary_teal,
        leading=22
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor("#6B7280"),
        leading=12
    )
    header_label_style = ParagraphStyle(
        'HeaderLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white,
        leading=12
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=primary_teal,
        leading=15,
        spaceAfter=4
    )
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=dark_gray,
        leading=12
    )
    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=dark_gray,
        leading=13
    )
    message_text = ParagraphStyle(
        'MessageText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        textColor=dark_gray,
        leading=12
    )

    story = []

    # 1. Header Banner
    header_table_data = [
        [
            Paragraph("🛡️ <b>PHISHGUARD INCIDENT REPORT</b>", title_style),
            Paragraph(f"<b>Report ID:</b> {report_data.get('report_code', 'PG-2026-XXXXXX')}<br/><b>Generated:</b> {datetime.now().strftime('%d %b %Y, %H:%M:%S UTC')}", subtitle_style)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[330, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_teal, spaceAfter=12))

    # 2. Key Metadata Summary Table
    risk_color = colors.HexColor("#DC2626") if report_data.get('risk_level') == "HIGH RISK" else (colors.HexColor("#D97706") if report_data.get('risk_level') == "SUSPICIOUS" else colors.HexColor("#16A34A"))
    
    ack_str = f" (Ack ID: {report_data.get('ack_id')})" if report_data.get('ack_id') else ""
    meta_data = [
        [
            Paragraph("<b>VERDICT / RISK SCORE</b>", body_bold),
            Paragraph(f"<font color='{risk_color.hexval()}'><b>{report_data.get('risk_level', 'UNKNOWN')} ({report_data.get('risk_score', 0)}/100)</b></font>", body_bold)
        ],
        [
            Paragraph("<b>FRAUD CATEGORY</b>", body_bold),
            Paragraph(str(report_data.get('category', 'General Phishing')), body_text)
        ],
        [
            Paragraph("<b>CLAIMED BRAND / ENTITY</b>", body_bold),
            Paragraph(str(report_data.get('brand_claimed', 'None')), body_text)
        ],
        [
            Paragraph("<b>REPORT STATUS</b>", body_bold),
            Paragraph(f"<b>{report_data.get('status', 'DRAFT')}</b>{ack_str}", body_text)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[180, 350])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Original Message Section (Audit Log)
    story.append(Paragraph("ORIGINAL MESSAGE TEXT (AUDIT EVIDENCE)", section_heading))
    msg_box_data = [[Paragraph(f"\"{report_data.get('message', '').replace('<', '&lt;').replace('>', '&gt;')}\"", message_text)]]
    msg_table = Table(msg_box_data, colWidths=[530])
    msg_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F9FAFB")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(msg_table)
    story.append(Spacer(1, 14))

    # 4. Independent Signal Breakdown
    story.append(Paragraph("FOUR-SIGNAL TECHNICAL TELEMETRY", section_heading))
    signals = report_data.get("signals", {})
    
    rule_sig = signals.get("rule_engine", {})
    url_sig = signals.get("url_analyzer", {})
    ml_sig = signals.get("ml_classifier", {})
    llm_sig = signals.get("llm_layer", {})

    signals_data = [
        [
            Paragraph("<b>Signal Module</b>", body_bold),
            Paragraph("<b>State</b>", body_bold),
            Paragraph("<b>Score Impact</b>", body_bold),
            Paragraph("<b>Telemetry Summary</b>", body_bold)
        ],
        [
            Paragraph("Rule-Based Engine", body_text),
            Paragraph("TRIGGERED" if rule_sig.get("fired") else "CLEAR", body_bold),
            Paragraph(f"+{rule_sig.get('score_impact', 0)} pts", body_text),
            Paragraph(rule_sig.get("summary", "Heuristic scans executed."), body_text)
        ],
        [
            Paragraph("SSRF-Safe URL Analyzer", body_text),
            Paragraph("ANOMALOUS" if url_sig.get("fired") else "CLEAR", body_bold),
            Paragraph(f"+{url_sig.get('score_impact', 0)} pts", body_text),
            Paragraph(url_sig.get("summary", "Domain & protocol analysis."), body_text)
        ],
        [
            Paragraph("ML Classifier (SVM)", body_text),
            Paragraph("FRAUD MATCH" if ml_sig.get("fired") else "NORMAL", body_bold),
            Paragraph(f"{'+' if ml_sig.get('score_impact', 0) >= 0 else ''}{ml_sig.get('score_impact', 0)} pts", body_text),
            Paragraph(ml_sig.get("summary", "Statistical NLP scoring."), body_text)
        ],
        [
            Paragraph("LLM Semantic Layer", body_text),
            Paragraph("ACTIVE" if llm_sig.get("fired") else "OFFLINE", body_bold),
            Paragraph(f"+{llm_sig.get('score_impact', 0)} pts", body_text),
            Paragraph(llm_sig.get("summary", "Deep contextual evaluation."), body_text)
        ]
    ]

    sig_table = Table(signals_data, colWidths=[120, 80, 80, 250])
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_teal),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 14))

    # 5. Why This Was Flagged
    story.append(Paragraph("WHY THIS WAS FLAGGED (PLAIN LANGUAGE REASONS)", section_heading))
    reasons = report_data.get("plain_reasons", [])
    if not reasons:
        reasons = ["No immediate fraudulent markers identified."]
    for idx, r in enumerate(reasons, 1):
        story.append(Paragraph(f"<b>{idx}.</b> {r}", body_text))
        story.append(Spacer(1, 3))
    story.append(Spacer(1, 10))

    # 6. Recommended Citizen Action
    story.append(Paragraph("RECOMMENDED CITIZEN ACTIONS", section_heading))
    rec_action = report_data.get("recommended_action", "Exercise standard digital security hygiene.")
    action_box = Table([[Paragraph(f"⚠️ <b>{rec_action}</b>", body_text)]], colWidths=[530])
    action_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(action_box)
    story.append(Spacer(1, 16))

    # 7. Compliance & Authority Submission Footer
    footer_text = Paragraph(
        "<b>DPDPA Notice:</b> This report was generated under consent for evidence retention and cybercrime reporting. Data handled according to Digital Personal Data Protection Act, 2023. Call 1930 to report cyber fraud to Indian Authorities.",
        subtitle_style
    )
    story.append(footer_text)

    doc.build(story)
    buffer.seek(0)
    return buffer

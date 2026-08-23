"""PDF generation for MedAssist health assessment reports.

Kept separate from the route handler so the visual/layout logic (gauges,
charts, letterhead, footer) can be read and modified independently of the
request-handling and auth code in routers/report_routes.py.
"""

from datetime import datetime

from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.shapes import Drawing, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

BRAND_COLOR = colors.HexColor("#1d70f0")
DARK_COLOR = colors.HexColor("#152a56")
GREEN = colors.HexColor("#059669")
AMBER = colors.HexColor("#d97706")
RED = colors.HexColor("#e11d48")

FLAG_COLORS = {"HIGH PRIORITY": RED, "REVIEW": AMBER, "LOW": GREEN}

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="SectionHeading", parent=styles["Heading2"],
                           textColor=DARK_COLOR, spaceBefore=14, spaceAfter=6))
styles.add(ParagraphStyle(name="Small", parent=styles["Normal"], fontSize=9, textColor=colors.grey))
styles.add(ParagraphStyle(name="BigNumber", parent=styles["Normal"], fontSize=28, leading=32,
                           alignment=1, textColor=colors.white))
styles.add(ParagraphStyle(name="BigNumberLabel", parent=styles["Normal"], fontSize=10, leading=12,
                           alignment=1, textColor=colors.white))


def score_color(score: int):
    if score >= 70:
        return GREEN
    if score >= 40:
        return AMBER
    return RED


def health_score_badge(score: int) -> Table:
    color = score_color(score)
    cell = Table(
        [[Paragraph(str(score), styles["BigNumber"])],
         [Paragraph("Health Score / 100", styles["BigNumberLabel"])]],
        colWidths=[1.8 * inch],
    )
    cell.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    return cell


def risk_gauge(priority_score: float) -> Drawing:
    width, height = 320, 34
    d = Drawing(width, height)
    zones = [(0.0, 0.3, GREEN), (0.3, 0.6, AMBER), (0.6, 1.0, RED)]
    for start, end, color in zones:
        d.add(Rect(width * start, 8, width * (end - start), 14, fillColor=color, strokeColor=None))

    marker_x = max(4, min(width - 4, width * priority_score))
    d.add(Polygon(points=[marker_x - 6, 26, marker_x + 6, 26, marker_x, 32], fillColor=DARK_COLOR, strokeColor=None))
    d.add(String(marker_x, 2, f"{priority_score:.0%}", fontSize=8, fillColor=DARK_COLOR, textAnchor="middle"))
    d.add(String(0, 26, "LOW", fontSize=7, fillColor=colors.grey))
    d.add(String(width / 2 - 10, 26, "REVIEW", fontSize=7, fillColor=colors.grey))
    d.add(String(width - 22, 26, "HIGH", fontSize=7, fillColor=colors.grey))
    return d


def disease_match_chart(top_diseases: list) -> Drawing:
    if not top_diseases:
        return Drawing(1, 1)
    names = [d["name"] for d in top_diseases]
    ratios = [round(d.get("confidence_pct", 0)) for d in top_diseases]

    chart_height = max(60, 36 * len(names))
    d = Drawing(400, chart_height)
    bc = HorizontalBarChart()
    bc.x = 90
    bc.y = 10
    bc.height = chart_height - 20
    bc.width = 260
    bc.data = [ratios]
    bc.categoryAxis.categoryNames = names
    bc.categoryAxis.labels.fontSize = 8
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 100
    bc.valueAxis.labels.fontSize = 7
    bc.bars[0].fillColor = BRAND_COLOR
    bc.barLabelFormat = "%s%%"
    bc.barLabels.fontSize = 8
    bc.barLabels.dy = 0
    d.add(bc)
    return d



def normalize_result(result: dict) -> dict:
    """
    Flatten either response shape into what the PDF body needs.

    Assessments stored before the model rewrite use the v1 shape; /assess now
    returns v2. Normalising here keeps the report layout code shape-agnostic
    instead of branching at every field.
    """
    if result.get("schema_version") and "diagnosis" in result:
        dx, sev = result.get("diagnosis", {}), result.get("severity", {})
        risk, tx = result.get("risk", {}), result.get("treatment", {})
        symptoms = [s.get("name") if isinstance(s, dict) else s
                    for s in result.get("input", {}).get("symptoms", [])]
        conf = dx.get("confidence", {})
        return {
            "version": "v2",
            "health_score": int(round(100 - float(sev.get("score", 0)) * 100)),
            "symptoms": [s for s in symptoms if s],
            "symptom_detail": result.get("input", {}).get("symptoms", []),
            "diseases": [
                {"name": p["disease"],
                 "confidence_pct": p.get("confidence_pct", 0),
                 "matched": ", ".join(p.get("matched_symptoms", [])) or "-"}
                for p in dx.get("predictions", [])
            ],
            "confidence_label": conf.get("label", "N/A"),
            "confidence_explanation": conf.get("explanation", ""),
            "flag": result.get("meta", {}).get("flag", "LOW"),
            "severity_level": sev.get("level", "N/A"),
            "severity_score": float(sev.get("score", 0)),
            "severity_action": sev.get("action", ""),
            "escalation": sev.get("escalation_override"),
            "red_flags": sev.get("critical_red_flags", []) + sev.get("serious_red_flags", []),
            "chronic": [
                {"label": c["label"], "score": c["risk_score"],
                 "probability": c["probability"], "flagged": c["flagged"],
                 "band": c["band"]}
                for c in sorted(risk.get("conditions", {}).values(),
                                key=lambda c: -c["risk_score"])
            ],
            "composite_risk": (risk.get("composite") or {}).get("score"),
            # v3 cascade. `options` was the v2 key; older stored assessments
            # still carry it, so both are read and the PDF renders either.
            "treatments": tx.get("drugs", tx.get("options", [])),
            "treatment_layer": tx.get("layer", "drug_reviews"),
            "treatment_layer_label": tx.get("layer_label", ""),
            "matched_condition": (tx.get("condition")
                                  or tx.get("matched_condition")),
            "suggested_cures": (tx.get("reference") or {}).get("cures"),
            "suggested_doctor": (tx.get("reference") or {}).get("doctor"),
            "treatment_disclaimer": ((tx.get("evidence") or {}).get("caveat")
                                     or tx.get("disclaimer", "")),
            "caveats": result.get("meta", {}).get("caveats", []),
            "disclaimer": result.get("disclaimer", ""),
        }

    # --- legacy v1 ---
    dp, ra = result.get("disease_prediction", {}), result.get("risk_assessment", {})
    rec, cp = result.get("recommendations", {}), result.get("care_plan", {})
    syms = result.get("symptom_analysis", {}).get("reported_symptoms", [])
    syms = [s.get("name") if isinstance(s, dict) else s for s in syms]
    legacy_score = result.get("health_score")
    if legacy_score is None:
        legacy_score = round(float(ra.get("priority_score", 0)) * 100)
    return {
        "version": "v1",
        # v1 stored health_score as a RISK score (higher was worse); invert it
        # so the badge means the same thing in both eras.
        "health_score": int(round(100 - float(legacy_score))),
        "symptoms": [s for s in syms if s],
        "symptom_detail": result.get("symptom_analysis", {}).get("reported_symptoms", []),
        "diseases": [
            {"name": d.get("disease_canonical", "unknown"),
             "confidence_pct": d.get("confidence_pct", 0),
             "matched": str(d.get("risk_category", "-")).title()}
            for d in dp.get("top_possible_diseases", [])
        ],
        "confidence_label": dp.get("confidence_label", dp.get("prediction_confidence", "N/A")),
        "confidence_explanation": dp.get("confidence_explanation", ""),
        "flag": ra.get("flag", "LOW"),
        "severity_level": ra.get("severity_level", "N/A"),
        "severity_score": min(float(ra.get("priority_score", 0)) / 3, 1.0),
        "severity_action": "",
        "escalation": ra.get("emergency_reason") if ra.get("emergency_case") else None,
        "red_flags": ra.get("matched_red_flag_symptoms", []),
        "chronic": [
            {"label": c.get("label", c.get("condition", "?")),
             "score": None, "probability": c.get("risk_probability", 0),
             "flagged": bool(c.get("flagged_at_risk")), "band": "-"}
            for c in (result.get("lifestyle_risk_screening") or [])
        ],
        "composite_risk": None,
        "treatments": [],
        "treatment_layer": None,
        "treatment_layer_label": "",
        "matched_condition": None,
        "suggested_cures": rec.get("suggested_cures") or cp.get("preventive_care"),
        "suggested_doctor": rec.get("suggested_doctor"),
        "treatment_disclaimer": "",
        "caveats": [],
        "disclaimer": result.get("disclaimer", ""),
    }


def build_pdf(filepath: str, *, patient_email: str, profile: dict | None,
              input_data: dict, result: dict, assessment_created_at: datetime,
              assessment_id: int):
    doc = SimpleDocTemplate(
        filepath, pagesize=letter,
        topMargin=0.65 * inch, bottomMargin=0.75 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )
    story = []

    # ---- Letterhead ----
    header_table = Table([[
        Paragraph("<b>MedAssist AI</b><br/><font size=9 color='grey'>AI-Powered Health Assessment Report</font>",
                  styles["Normal"]),
        Paragraph(
            f"Report #{assessment_id}<br/>"
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}<br/>"
            f"Assessed: {assessment_created_at.strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Small"],
        ),
    ]], colWidths=[3.8 * inch, 2.5 * inch])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", color=BRAND_COLOR, thickness=2))
    story.append(Spacer(1, 14))

    # ---- Patient info + health score side by side ----
    full_name = (profile or {}).get("full_name") or patient_email
    dob = (profile or {}).get("date_of_birth") or "-"
    allergies = (profile or {}).get("allergies") or "None recorded"
    medical_history = (profile or {}).get("medical_history") or "None recorded"

    info_rows = [
        ["Name", full_name],
        ["Email", patient_email],
        ["Date of Birth", dob],
        ["Age", str(input_data.get("age", "-"))],
        ["Gender", str(input_data.get("gender", "-")).title()],
        ["Blood Pressure", str(input_data.get("blood_pressure", "-")).title()],
        ["Cholesterol Level", str(input_data.get("cholesterol_level", "-")).title()],
        ["Known Allergies", allergies],
    ]
    info_table = Table(info_rows, colWidths=[1.5 * inch, 2.7 * inch])
    info_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    view = normalize_result(result)
    health_score = view["health_score"]
    top_row = Table([[info_table, health_score_badge(health_score)]], colWidths=[4.4 * inch, 2 * inch])
    top_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("ALIGN", (1, 0), (1, 0), "CENTER")]))
    story.append(Paragraph("Patient Information", styles["SectionHeading"]))
    story.append(top_row)

    if medical_history and medical_history != "None recorded":
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Relevant medical history considered:</b> {medical_history}", styles["Small"]))

    # ---- Symptom analysis ----
    story.append(Paragraph("Symptom Analysis", styles["SectionHeading"]))
    detail = view["symptom_detail"]
    if detail and isinstance(detail[0], dict):
        rendered = ", ".join(
            f"{d.get('name')} ({d.get('severity', 'moderate')})" for d in detail)
    else:
        rendered = ", ".join(view["symptoms"])
    story.append(Paragraph(
        f"Reported symptoms ({len(view['symptoms'])}): {rendered or 'None reported'}",
        styles["Normal"]
    ))

    # ---- Disease prediction ----
    story.append(Paragraph("Disease Prediction", styles["SectionHeading"]))
    story.append(Paragraph(
        f"Prediction confidence: <b>{view['confidence_label']}</b>", styles["Normal"]
    ))
    if view["confidence_explanation"]:
        story.append(Paragraph(view["confidence_explanation"], styles["Small"]))
    story.append(Spacer(1, 8))

    top_diseases = view["diseases"]
    disease_rows = [["Possible Condition", "Matching Symptoms", "Confidence"]]
    for d in top_diseases:
        disease_rows.append([
            Paragraph(d["name"].title(), styles["Small"]),
            Paragraph(str(d["matched"])[:90], styles["Small"]),
            f"{d['confidence_pct']:.1f}%",
        ])
    disease_table = Table(disease_rows, colWidths=[2.0 * inch, 2.6 * inch, 0.9 * inch])
    disease_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (-1, 0), DARK_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(KeepTogether([disease_table, Spacer(1, 10), disease_match_chart(top_diseases)]))

    # ---- Risk assessment ----
    story.append(Paragraph("Risk Assessment", styles["SectionHeading"]))
    flag = view["flag"]
    flag_color = FLAG_COLORS.get(flag, colors.black)
    normalized_priority = view["severity_score"]
    story.append(Paragraph(
        f"<font color='{flag_color}'><b>{flag}</b></font> &nbsp;&middot;&nbsp; "
        f"Triage level: <b>{view['severity_level']}</b> &nbsp;&middot;&nbsp; "
        f"Severity score: <b>{normalized_priority:.0%}</b>", styles["Normal"]
    ))
    if view["severity_action"]:
        story.append(Paragraph(
            f"<b>Recommended action:</b> {view['severity_action']}", styles["Normal"]))
    story.append(Spacer(1, 6))
    story.append(risk_gauge(normalized_priority))

    if view["escalation"]:
        story.append(Spacer(1, 8))
        reason = view["escalation"]
        alert = Table([[Paragraph(
            f"&#9888; This assessment was flagged as a potential <b>emergency case</b>: {reason}. "
            "Seek immediate medical attention.",
            ParagraphStyle(name="Alert", parent=styles["Normal"], textColor=colors.white)
        )]], colWidths=[6.3 * inch])
        alert.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), RED),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(alert)

    # ---- Lifestyle risk screening (Model 2 — BRFSS) ----
    lifestyle_risk = view["chronic"]
    if lifestyle_risk:
        story.append(Paragraph("Chronic Condition Risk Screening", styles["SectionHeading"]))
        if view["composite_risk"] is not None:
            story.append(Paragraph(
                f"Composite risk index: <b>{view['composite_risk']}/100</b>", styles["Normal"]))
            story.append(Spacer(1, 4))
        risk_rows = [["Condition", "Percentile", "Probability", "Flagged"]]
        for c in lifestyle_risk:
            risk_rows.append([
                c["label"],
                f"{c['score']}/100" if c["score"] is not None else "-",
                f"{c['probability']:.1%}",
                "Yes" if c["flagged"] else "No",
            ])
        risk_table = Table(risk_rows, colWidths=[2.2 * inch, 1.2 * inch, 1.4 * inch, 0.9 * inch])
        risk_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (0, 0), (-1, 0), DARK_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(risk_table)
        story.append(Paragraph(
            "Calibrated against 1.1M CDC BRFSS respondents (2011-2015) and entirely "
            "independent of the symptom-based prediction above. Percentiles are "
            "relative to surveyed US adults; this is prevalence-style screening, "
            "not a diagnosis or a forecast of future onset.",
            styles["Small"],
        ))

    # ---- Care plan ----
    story.append(Paragraph("Treatment & Care Plan", styles["SectionHeading"]))
    care_rows = [
        ["Suggested care", Paragraph(str(view["suggested_cures"] or "-"), styles["Small"])],
        ["Recommended specialist", Paragraph(str(view["suggested_doctor"] or "-"), styles["Small"])],
        ["Recommended action", Paragraph(view["severity_action"] or "-", styles["Small"])],
    ]
    care_table = Table(care_rows, colWidths=[1.6 * inch, 4.7 * inch])
    care_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(care_table)

    if view["treatments"]:
        story.append(Spacer(1, 10))

        # The heading must name the SOURCE, not just the condition. A hospital
        # co-prescription list and a patient-satisfaction ranking cannot share
        # a caption without misleading whoever reads the printout.
        is_mimic = view.get("treatment_layer") == "mimic"
        if is_mimic:
            heading = ("<b>Real hospital prescriptions</b> — drugs co-prescribed "
                       "during similar MIMIC-IV admissions")
        else:
            heading = ("<b>Patient-reported experience</b> — drug-review rankings"
                       + (f" for {view['matched_condition']}"
                          if view.get("matched_condition") else ""))
        story.append(Paragraph(heading, styles["Small"]))
        story.append(Spacer(1, 4))

        if is_mimic:
            tx_rows = [["Drug", "Class", "Class conf.", "Drug conf."]]
            for o in view["treatments"][:8]:
                dc = o.get("drug_confidence")
                tx_rows.append([
                    o.get("drug", ""),
                    str(o.get("drug_class", "")).title(),
                    f"{o.get('class_confidence', 0):.0%}",
                    "-" if dc is None else f"{dc:.0%}",
                ])
            col_widths = [2.2 * inch, 1.6 * inch, 1.1 * inch, 1.1 * inch]
        else:
            tx_rows = [["Drug", "Commonly used", "Best rated", "Satisfaction",
                        "Reviews"]]
            for o in view["treatments"][:8]:
                tx_rows.append([
                    o.get("drug", ""), f"#{o.get('rank', '-')}",
                    f"#{o.get('rank_by_rating', '-')}",
                    f"{o.get('satisfaction_rate', 0):.0%}",
                    f"{o.get('n_reviews', 0):,}",
                ])
            col_widths = [2.0 * inch, 1.2 * inch, 1.1 * inch, 1.1 * inch, 0.9 * inch]

        tx_table = Table(tx_rows, colWidths=col_widths)
        tx_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (0, 0), (-1, 0), DARK_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tx_table)
        if view["treatment_disclaimer"]:
            story.append(Spacer(1, 4))
            story.append(Paragraph(view["treatment_disclaimer"], styles["Small"]))

    if view["caveats"]:
        story.append(Spacer(1, 10))
        story.append(Paragraph("<b>Model limitations</b>", styles["Small"]))
        for c in view["caveats"]:
            story.append(Paragraph("\u2022 " + c, styles["Small"]))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0"), thickness=1))
    story.append(Spacer(1, 6))
    story.append(Paragraph(view["disclaimer"], styles["Small"]))
    story.append(Paragraph(
        "This report is confidential and intended solely for the named patient and their care team.",
        styles["Small"],
    ))

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(0.7 * inch, 0.5 * inch, "Generated by MedAssist AI")
        canvas.drawRightString(letter[0] - 0.7 * inch, 0.5 * inch, f"Page {doc_.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)



def build_provider_report_pdf(filepath: str, *, report, assessment, provider, patient, profile):
    """Build a provider-created treatment and recommendation report PDF."""
    import json
    
    doc = SimpleDocTemplate(
        filepath, pagesize=letter,
        topMargin=0.65 * inch, bottomMargin=0.75 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )
    story = []

    # ---- Letterhead ----
    header_table = Table([[
        Paragraph("<b>MedAssist AI</b><br/><font size=9 color='grey'>Provider Treatment & Health Recommendation Report</font>",
                  styles["Normal"]),
        Paragraph(
            f"Report #{report.id}<br/>"
            f"Generated: {report.created_at.strftime('%Y-%m-%d %H:%M UTC')}<br/>"
            f"Assessment Date: {assessment.created_at.strftime('%Y-%m-%d')}",
            styles["Small"],
        ),
    ]], colWidths=[3.8 * inch, 2.5 * inch])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", color=BRAND_COLOR, thickness=2))
    story.append(Spacer(1, 14))

    # ---- Patient & Provider info ----
    story.append(Paragraph("Report Information", styles["SectionHeading"]))
    
    full_name = (profile.full_name if profile else None) or patient.email
    provider_name = f"{provider.email} ({provider.role.replace('_', ' ').title()})"
    
    info_rows = [
        ["Patient Name", full_name],
        ["Patient Email", patient.email],
        ["Healthcare Provider", provider_name],
        ["Assessment ID", f"#{assessment.id}"],
        ["Risk Flag", assessment.risk_flag],
        ["Report Date", report.created_at.strftime('%B %d, %Y')],
    ]
    
    info_table = Table(info_rows, colWidths=[1.8 * inch, 4.6 * inch])
    info_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # ---- Provider Insights ----
    story.append(Paragraph("Clinical Insights", styles["SectionHeading"]))
    story.append(Paragraph(report.provider_insights, styles["Normal"]))
    story.append(Spacer(1, 12))

    # ---- Treatment Suggestions ----
    story.append(Paragraph("Treatment Suggestions", styles["SectionHeading"]))
    treatment_para = Paragraph(report.treatment_suggestions, styles["Normal"])
    treatment_box = Table([[treatment_para]], colWidths=[6.4 * inch])
    treatment_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(treatment_box)
    story.append(Spacer(1, 12))

    # ---- Health Recommendations ----
    story.append(Paragraph("Health Recommendations", styles["SectionHeading"]))
    health_para = Paragraph(report.health_recommendations, styles["Normal"])
    health_box = Table([[health_para]], colWidths=[6.4 * inch])
    health_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(health_box)
    story.append(Spacer(1, 12))

    # ---- Doctor/Specialist Suggestions ----
    if report.doctor_suggestions:
        story.append(Paragraph("Specialist Referral", styles["SectionHeading"]))
        story.append(Paragraph(report.doctor_suggestions, styles["Normal"]))
        story.append(Spacer(1, 12))

    # ---- Additional Notes ----
    if report.additional_notes:
        story.append(Paragraph("Additional Notes", styles["SectionHeading"]))
        story.append(Paragraph(report.additional_notes, styles["Small"]))
        story.append(Spacer(1, 12))

    # ---- Assessment Summary ----
    result_data = json.loads(assessment.result_json)
    
    story.append(Paragraph("Assessment Summary", styles["SectionHeading"]))
    
    # Get health score
    health_score = result_data.get("health_score", 0)
    score_badge = health_score_badge(health_score)
    
    # Symptoms
    symptoms = result_data["symptom_analysis"]["reported_symptoms"]
    symptom_text = ", ".join(symptoms) if symptoms else "None reported"
    
    # Top disease
    top_diseases = result_data["disease_prediction"]["top_possible_diseases"]
    top_disease = top_diseases[0]["disease_canonical"] if top_diseases else "None"
    
    summary_rows = [
        ["Reported Symptoms", symptom_text],
        ["Top Predicted Condition", top_disease.title()],
        ["Risk Assessment", assessment.risk_flag],
        ["Priority Score", f"{result_data['risk_assessment']['priority_score']:.2f}"],
    ]
    
    summary_table = Table(summary_rows, colWidths=[2.0 * inch, 4.4 * inch])
    summary_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(summary_table)

    # ---- Footer ----
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0"), thickness=1))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>Disclaimer:</b> This report contains professional medical recommendations and should be discussed with your primary care physician. "
        "Follow-up care and treatment decisions should be made in consultation with qualified healthcare professionals.",
        styles["Small"],
    ))
    story.append(Paragraph(
        "This report is confidential and intended solely for the named patient.",
        styles["Small"],
    ))

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(0.7 * inch, 0.5 * inch, f"MedAssist Provider Report #{report.id}")
        canvas.drawRightString(letter[0] - 0.7 * inch, 0.5 * inch, f"Page {doc_.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)



def build_prescription_pdf(filepath: str, *, prescription, provider_profile):
    """Build a professional prescription (Rx) document PDF."""
    import json
    
    doc = SimpleDocTemplate(
        filepath, pagesize=letter,
        topMargin=0.5 * inch, bottomMargin=0.75 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )
    story = []

    # ---- Header/Letterhead ----
    header_style = ParagraphStyle(
        name="PrescriptionHeader",
        parent=styles["Normal"],
        fontSize=16,
        textColor=DARK_COLOR,
        fontName="Helvetica-Bold",
        alignment=1,
    )
    
    clinic_style = ParagraphStyle(
        name="ClinicInfo",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        alignment=1,
    )
    
    story.append(Paragraph(provider_profile.clinic_name, header_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"{provider_profile.clinic_address}<br/>"
        f"Tel: {provider_profile.clinic_contact}",
        clinic_style
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", color=BRAND_COLOR, thickness=2))
    story.append(Spacer(1, 12))

    # ---- Doctor Info ----
    doctor_info_style = ParagraphStyle(
        name="DoctorInfo",
        parent=styles["Normal"],
        fontSize=11,
        textColor=DARK_COLOR,
        fontName="Helvetica-Bold",
    )
    
    story.append(Paragraph(
        f"Dr. {provider_profile.full_name}, {provider_profile.qualifications}",
        doctor_info_style
    ))
    story.append(Paragraph(
        f"Reg. No.: {provider_profile.registration_number}",
        styles["Small"]
    ))
    story.append(Spacer(1, 12))

    # ---- Date & Patient Info ----
    date_issued = prescription.date_issued.strftime('%B %d, %Y')
    
    info_table = Table([
        ["Date:", date_issued],
        ["Patient Name:", prescription.patient_name],
        ["Age/Sex:", f"{prescription.patient_age} years / {prescription.patient_sex.capitalize()}"],
        ["Address:", prescription.patient_address or "-"],
    ], colWidths=[1.2 * inch, 5.2 * inch])
    
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748b")),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK_COLOR),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 16))

    # ---- Rx Symbol & Medications ----
    rx_style = ParagraphStyle(
        name="RxSymbol",
        parent=styles["Normal"],
        fontSize=24,
        textColor=BRAND_COLOR,
        fontName="Helvetica-Bold",
    )
    
    story.append(Paragraph("℞", rx_style))
    story.append(Spacer(1, 8))

    # Medications Table
    medications = json.loads(prescription.medications_json)
    
    med_rows = [["Drug Name", "Strength", "Form", "Frequency", "Route", "Duration"]]
    
    for med in medications:
        drug_display = med["drug_name"].upper()
        if med.get("brand_name"):
            drug_display += f" ({med['brand_name']})"
        
        med_rows.append([
            drug_display,
            med["strength"],
            med["dosage_form"],
            med["frequency"],
            med["route"],
            med["duration"],
        ])
        
        # Add instructions row if present
        if med.get("instructions"):
            med_rows.append([
                Paragraph(f"<i>Instructions: {med['instructions']}</i>", styles["Small"]),
                "", "", "", "", ""
            ])
    
    med_table = Table(med_rows, colWidths=[2.2 * inch, 0.8 * inch, 0.8 * inch, 0.9 * inch, 0.7 * inch, 0.9 * inch])
    
    med_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK_COLOR),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("SPAN", (0, 2), (-1, 2)) if len(med_rows) > 2 and medications[0].get("instructions") else None,
    ]))
    
    story.append(med_table)
    story.append(Spacer(1, 16))

    # ---- Additional Notes ----
    if prescription.additional_notes:
        story.append(Paragraph("<b>Additional Notes:</b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        story.append(Paragraph(prescription.additional_notes, styles["Normal"]))
        story.append(Spacer(1, 16))

    # ---- Signature & Stamp ----
    story.append(Spacer(1, 20))
    
    signature_table_data = []
    signature_widths = []
    
    if provider_profile.signature_image and provider_profile.stamp_image:
        # Both signature and stamp
        signature_table_data = [
            [Paragraph("<b>Doctor's Signature</b>", styles["Small"]),
             Paragraph("<b>Clinic Stamp</b>", styles["Small"])],
            ["[Signature Image]", "[Stamp Image]"],
            [Paragraph(f"Dr. {provider_profile.full_name}", styles["Small"]),
             Paragraph(provider_profile.clinic_name, styles["Small"])],
        ]
        signature_widths = [3.2 * inch, 3.2 * inch]
    elif provider_profile.signature_image:
        # Signature only
        signature_table_data = [
            [Paragraph("<b>Doctor's Signature</b>", styles["Small"])],
            ["[Signature Image]"],
            [Paragraph(f"Dr. {provider_profile.full_name}", styles["Small"])],
        ]
        signature_widths = [3.2 * inch]
    else:
        # Typed signature
        typed_sig_style = ParagraphStyle(
            name="TypedSignature",
            parent=styles["Normal"],
            fontSize=18,
            textColor=BRAND_COLOR,
            fontName="Helvetica-Oblique",
        )
        signature_table_data = [
            [Paragraph("<b>Digitally Signed</b>", styles["Small"])],
            [Paragraph(provider_profile.full_name, typed_sig_style)],
            [Paragraph(f"Dr. {provider_profile.full_name}, {provider_profile.qualifications}", styles["Small"])],
        ]
        signature_widths = [3.2 * inch]
    
    signature_table = Table(signature_table_data, colWidths=signature_widths)
    signature_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    
    story.append(signature_table)
    story.append(Spacer(1, 16))

    # ---- Footer/Disclaimer ----
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0"), thickness=1))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>Note:</b> This is a legally valid digital prescription. "
        "Present this document at any registered pharmacy. "
        "Do not self-medicate or share this prescription with others.",
        styles["Small"]
    ))

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(0.7 * inch, 0.5 * inch, f"MedAssist Prescription #{prescription.id}")
        canvas.drawRightString(letter[0] - 0.7 * inch, 0.5 * inch, f"Page {doc_.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)

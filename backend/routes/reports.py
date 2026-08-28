from datetime import datetime
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from bson.objectid import ObjectId

from database import get_db
from routes.auth import get_current_user

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

router = APIRouter(prefix="/api/reports", tags=["reports"])

def validate_access(patient_id: str, current_user: dict):
    # Enforce RBAC
    if current_user.get("role") == "patient":
        if str(current_user["_id"]) != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only access your own reports."
            )
    elif current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )

def get_assessment(patient_id: str, index: int):
    db = get_db()
    try:
        obj_id = ObjectId(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
        
    patient = db.users.find_one({"_id": obj_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    history = patient.get("medicalHistory", [])
    
    # We filter only the valid diagnostic reports, matching the frontend logic
    valid_reports = [item for item in history if isinstance(item, dict) and item.get("details")]
    
    # Since frontend might just send the absolute index in the history array or the filtered index
    # We will assume index refers to the exact array index in medicalHistory to be safe.
    # Actually, the frontend `reports.map((report, idx))` maps over the *filtered* list. 
    # Let's support an index into the filtered list.
    if index < 0 or index >= len(valid_reports):
        raise HTTPException(status_code=404, detail="Report not found")
        
    report = valid_reports[index]
    return patient, report

@router.get("/{patient_id}/{index}/pdf")
async def generate_pdf_report(patient_id: str, index: int, current_user: dict = Depends(get_current_user)):
    validate_access(patient_id, current_user)
    patient, report = get_assessment(patient_id, index)
    
    details = report.get("details", {})
    recs = details.get("recommendations", {})
    
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
    
    # Custom Styles
    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=12,
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        name="SubtitleStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=20,
        alignment=1
    )
    
    heading_style = ParagraphStyle(
        name="HeadingStyle",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#334155"),
        spaceBefore=12,
        spaceAfter=6,
        textTransform="uppercase"
    )
    
    normal_style = ParagraphStyle(
        name="NormalStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
        leading=14
    )
    
    bullet_style = ParagraphStyle(
        name="BulletStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#334155"),
        spaceAfter=4,
        leftIndent=15,
        bulletIndent=5,
        leading=14
    )
    
    disclaimer_style = ParagraphStyle(
        name="DisclaimerStyle",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748b"),
        spaceBefore=20,
        leading=10,
        alignment=0
    )

    elements = []
    
    # Header
    elements.append(Paragraph("<b>MEDASSIST AI</b>", title_style))
    elements.append(Paragraph("AI Medical Symptom Analysis & Disease Prediction Report", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=15))
    
    # Report Info
    report_id = f"MED-{datetime.now().strftime('%Y')}-{str(patient['_id'])[-4:]}-{index:03d}"
    
    info_data = [
        ["Report ID:", report_id, "Assessment Date:", report.get("date", "Unknown")],
        ["Generated On:", datetime.now().strftime("%B %d, %Y"), "", ""]
    ]
    info_table = Table(info_data, colWidths=[80, 150, 100, 150])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#475569")),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))
    
    # Patient Info
    elements.append(Paragraph("<b>PATIENT INFORMATION</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    
    age = patient.get("age", "Not provided")
    gender = patient.get("sex", "Not provided")
    if str(gender).lower() == "m": gender = "Male"
    elif str(gender).lower() == "f": gender = "Female"
    
    pat_data = [
        ["Patient ID:", str(patient["_id"])],
        ["Patient Name:", patient.get("name", "Not provided")],
        ["Age:", str(age)],
        ["Gender:", gender.capitalize() if gender != "Not provided" else gender]
    ]
    pat_table = Table(pat_data, colWidths=[100, 300])
    pat_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(pat_table)
    elements.append(Spacer(1, 10))
    
    # Symptoms
    elements.append(Paragraph("<b>REPORTED SYMPTOMS</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    
    symptoms = details.get("symptoms", [])
    if not symptoms:
        elements.append(Paragraph("Not provided", normal_style))
    else:
        for sym in symptoms:
            elements.append(Paragraph(f"• {sym.capitalize()}", bullet_style))
    elements.append(Spacer(1, 10))
    
    # Medical History
    elements.append(Paragraph("<b>MEDICAL HISTORY</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    chronic = patient.get("chronicConditions", [])
    allergies = patient.get("allergies", [])
    if not chronic and not allergies:
        elements.append(Paragraph("Not provided", normal_style))
    else:
        if chronic:
            elements.append(Paragraph("<b>Chronic Conditions:</b>", normal_style))
            for c in chronic:
                elements.append(Paragraph(f"• {c}", bullet_style))
        if allergies:
            elements.append(Paragraph("<b>Allergies:</b>", normal_style))
            for a in allergies:
                elements.append(Paragraph(f"• {a}", bullet_style))
    elements.append(Spacer(1, 10))
    
    # Prediction
    elements.append(Paragraph("<b>AI DISEASE PREDICTION</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    
    elements.append(Paragraph(f"<b>Possible Condition:</b> {report.get('condition', 'Unknown')}", normal_style))
    elements.append(Paragraph(f"<b>Confidence:</b> {details.get('primaryProb', 0)}%", normal_style))
    
    # Top Predictions
    sec_preds = details.get("secondaryPredictions", [])
    if sec_preds:
        elements.append(Spacer(1, 5))
        elements.append(Paragraph("<b>Other Possible Conditions:</b>", normal_style))
        for p in sec_preds:
            elements.append(Paragraph(f"• {p.get('name')}: {p.get('probability')}%", bullet_style))
            
    elements.append(Spacer(1, 10))
    
    # Risk Assessment
    elements.append(Paragraph("<b>RISK ASSESSMENT</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    
    elements.append(Paragraph(f"<b>Risk Level:</b> {details.get('riskCat', 'Unknown')}", normal_style))
    elements.append(Paragraph(f"<b>Risk Score:</b> {details.get('riskScore', 0)} / 100", normal_style))
    elements.append(Paragraph(f"<b>Severity:</b> {details.get('severity', 'Unknown')}", normal_style))
    elements.append(Spacer(1, 10))
    
    # Healthcare Advisory
    elements.append(Paragraph("<b>AI HEALTHCARE ADVISORY</b>", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    
    if not recs:
        elements.append(Paragraph("No advisory generated.", normal_style))
    else:
        # Warning Signs
        if recs.get("warningSigns"):
            elements.append(Paragraph("<b><font color='red'>Warning Signs & Red Flags:</font></b>", normal_style))
            for w in recs.get("warningSigns"):
                elements.append(Paragraph(f"• {w}", bullet_style))
            elements.append(Spacer(1, 5))
            
        if recs.get("healthcareSuggestions"):
            elements.append(Paragraph("<b>Healthcare Suggestions:</b>", normal_style))
            for h in recs.get("healthcareSuggestions"):
                elements.append(Paragraph(f"• {h}", bullet_style))
            elements.append(Spacer(1, 5))
            
        if recs.get("preventiveCare"):
            elements.append(Paragraph("<b>Preventive Care:</b>", normal_style))
            for p in recs.get("preventiveCare"):
                elements.append(Paragraph(f"• {p}", bullet_style))
            elements.append(Spacer(1, 5))
            
        if recs.get("lifestyleRecommendations"):
            elements.append(Paragraph("<b>Lifestyle & Nutrition:</b>", normal_style))
            for l in recs.get("lifestyleRecommendations"):
                elements.append(Paragraph(f"• {l}", bullet_style))
            elements.append(Spacer(1, 5))
            
        if recs.get("followUpGuidance"):
            elements.append(Paragraph("<b>Follow-Up Timeline:</b>", normal_style))
            for f in recs.get("followUpGuidance"):
                elements.append(Paragraph(f"• {f}", bullet_style))
            
    # Disclaimer
    elements.append(Spacer(1, 30))
    disclaimer_text = "<b>Medical Disclaimer:</b> This report contains AI-generated information intended for educational and informational purposes only. AI predictions are not a medical diagnosis, prescription, or substitute for professional medical advice. The prediction confidence represents the model's output and does not indicate medical certainty. Consult a qualified healthcare professional for diagnosis, treatment, and medical decisions."
    elements.append(Paragraph(disclaimer_text, disclaimer_style))
    
    doc.build(elements)
    
    buffer.seek(0)
    
    filename = f"MedAssist_Report_{report_id}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

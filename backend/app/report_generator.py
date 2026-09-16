"""
PDF Report Generator for MedAssist AI.
Generates downloadable disease prediction reports.
"""

from io import BytesIO
from datetime import datetime

from fpdf import FPDF


class MedAssistReport(FPDF):
    """Custom PDF class with MedAssist AI branding."""

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(41, 128, 185)
        self.cell(190, 12, "MedAssist AI", new_x="LMARGIN", new_y="NEXT", align="C")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(190, 6, "AI-Powered Healthcare Assistant", new_x="LMARGIN", new_y="NEXT", align="C")

        self.ln(5)
        self.set_draw_color(41, 128, 185)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-20)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(
            190, 5,
            "DISCLAIMER: This report is AI-generated for educational "
            "purposes only and is NOT a medical diagnosis.",
            new_x="LMARGIN", new_y="NEXT", align="C"
        )
        self.cell(
            190, 5,
            f"Page {self.page_no()} | Generated on "
            f"{datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            align="C"
        )

    def section_title(self, title):
        self.ln(4)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(41, 128, 185)
        self.cell(190, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def add_row(self, key, value):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(60, 60, 60)
        self.cell(55, 7, str(key) + ":", new_x="END")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        val = str(value) if value else "N/A"
        # Sanitize non-latin1 characters
        val = val.encode("latin-1", errors="replace").decode("latin-1")
        self.cell(135, 7, val, new_x="LMARGIN", new_y="NEXT")

    def add_bullet(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        # Sanitize text
        safe_text = str(text).encode("latin-1", errors="replace").decode("latin-1")
        self.cell(190, 6, "   -  " + safe_text, new_x="LMARGIN", new_y="NEXT")


def generate_prediction_report_pdf(
    patient_info,
    symptoms,
    prediction_data,
    top_conditions,
    risk_data,
    recommendations
):
    """
    Generate a complete disease prediction report as PDF.
    Returns: bytes (PDF content)
    """

    pdf = MedAssistReport()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    # Report Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(190, 12, "Disease Prediction Report", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(2)

    # 1. Patient Information
    pdf.section_title("1. Patient Information")

    if patient_info:
        pdf.add_row("Full Name", patient_info.get("full_name"))
        pdf.add_row("Email", patient_info.get("email"))
        pdf.add_row("Gender", patient_info.get("gender"))
        pdf.add_row("Date of Birth", patient_info.get("date_of_birth"))
        pdf.add_row("Blood Group", patient_info.get("blood_group"))

        height = patient_info.get("height_cm", "N/A")
        weight = patient_info.get("weight_kg", "N/A")
        pdf.add_row("Height / Weight", f"{height} cm / {weight} kg")
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 7, "Patient profile not available.", new_x="LMARGIN", new_y="NEXT")

    # 2. Symptoms Submitted
    pdf.section_title("2. Symptoms Submitted")

    if symptoms and len(symptoms) > 0:
        for symptom in symptoms:
            name = symptom.get("symptom_name", "Unknown")
            severity = symptom.get("severity", "N/A")
            pdf.add_bullet(f"{name} (Severity: {severity})")
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 7, "No symptoms recorded.", new_x="LMARGIN", new_y="NEXT")

    # 3. Disease Prediction Results
    pdf.section_title("3. AI Disease Prediction Results")

    if prediction_data:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(220, 50, 50)
        safe_disease = str(prediction_data).encode("latin-1", errors="replace").decode("latin-1")
        pdf.cell(190, 10, f"Primary Prediction: {safe_disease}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 30, 30)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 7, "No prediction available.", new_x="LMARGIN", new_y="NEXT")

    # Top conditions
    if top_conditions and len(top_conditions) > 0:
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(190, 8, "Top Possible Conditions:", new_x="LMARGIN", new_y="NEXT")

        for i, condition in enumerate(top_conditions):
            name = condition.get("condition", "Unknown")
            score = condition.get("model_score", 0)

            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(41, 128, 185)
            safe_name = str(name).encode("latin-1", errors="replace").decode("latin-1")
            pdf.cell(
                190, 7,
                f"  #{i + 1}  {safe_name}  --  Confidence: {score}%",
                new_x="LMARGIN", new_y="NEXT"
            )

            desc = condition.get("description")
            if desc:
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(80, 80, 80)
                safe_desc = str(desc).encode("latin-1", errors="replace").decode("latin-1")
                # Truncate long descriptions to fit on one line
                if len(safe_desc) > 120:
                    safe_desc = safe_desc[:117] + "..."
                pdf.cell(190, 5, f"     {safe_desc}", new_x="LMARGIN", new_y="NEXT")

            precautions = condition.get("precautions", [])
            if precautions:
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(100, 100, 100)
                prec_text = ", ".join(str(p) for p in precautions)
                safe_prec = prec_text.encode("latin-1", errors="replace").decode("latin-1")
                if len(safe_prec) > 120:
                    safe_prec = safe_prec[:117] + "..."
                pdf.cell(190, 5, f"     Precautions: {safe_prec}", new_x="LMARGIN", new_y="NEXT")

            pdf.ln(2)

    # 4. Risk Assessment Summary
    pdf.section_title("4. Risk Assessment Summary")

    if risk_data:
        pdf.add_row("Outcome", risk_data.get("predicted_outcome"))
        pdf.add_row("Positive Risk Score", f"{risk_data.get('positive_model_score', 'N/A')}%")
        pdf.add_row("Negative Score", f"{risk_data.get('negative_model_score', 'N/A')}%")
        pdf.add_row("Blood Pressure", risk_data.get("blood_pressure"))
        pdf.add_row("Cholesterol", risk_data.get("cholesterol_level"))
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 7, "No risk assessment completed yet.", new_x="LMARGIN", new_y="NEXT")

    # 5. Recommendations
    pdf.section_title("5. Recommendations and Precautions")

    if recommendations and len(recommendations) > 0:
        for rec in recommendations:
            pdf.add_bullet(rec)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 7, "No recommendations available.", new_x="LMARGIN", new_y="NEXT")

    # Output
    pdf_bytes = pdf.output()
    return bytes(pdf_bytes)


def generate_care_plan_pdf(
    caretaker_info: dict,
    patient_info: dict,
    care_plan: dict
) -> bytes:
    """
    Generate a formal Clinical Care Plan & E-Prescription Directive as a downloadable PDF.
    """
    pdf = MedAssistReport()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    # Document Header
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(190, 10, "Clinical Care Plan & Health Directive", new_x="LMARGIN", new_y="NEXT", align="C")
    
    # Priority & Status Tag
    priority = care_plan.get("priority", "Standard")
    pdf.set_font("Helvetica", "B", 10)
    if priority == "Urgent":
        pdf.set_text_color(220, 38, 38)
    elif priority == "High":
        pdf.set_text_color(217, 119, 6)
    else:
        pdf.set_text_color(14, 116, 144)
    pdf.cell(190, 6, f"[ Priority Level: {priority.upper()} ]", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)

    # 1. Patient & Caretaker Metadata
    pdf.section_title("1. Consultation & Patient Overview")
    pdf.add_row("Patient Name", patient_info.get("full_name", "N/A"))
    pdf.add_row("Gender / Blood Group", f"{patient_info.get('gender', 'N/A')}  |  {patient_info.get('blood_group', 'N/A')}")
    pdf.add_row("Emergency Contact", f"{patient_info.get('emergency_contact_name', 'N/A')} ({patient_info.get('emergency_contact_phone', 'N/A')})")
    pdf.add_row("Supervising Caretaker", f"{caretaker_info.get('full_name', 'N/A')} ({caretaker_info.get('profession', 'Healthcare Assistant')})")
    pdf.add_row("Organization / Clinic", caretaker_info.get("organization", "MedAssist Healthcare Network"))
    pdf.add_row("Directive Issue Date", care_plan.get("created_at", datetime.now().strftime('%Y-%m-%d')))

    # 2. Care Plan Focus & Title
    pdf.section_title("2. Care Plan Directives")
    pdf.add_row("Directive Title", care_plan.get("title", "Clinical Care Plan"))

    # 3. Clinical Observations
    pdf.section_title("3. Diagnostic Observations & Clinical Notes")
    notes = care_plan.get("diagnosis_notes")
    if notes:
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        safe_notes = str(notes).encode("latin-1", errors="replace").decode("latin-1")
        pdf.multi_cell(190, 6, safe_notes)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 6, "No specific diagnostic observations recorded.", new_x="LMARGIN", new_y="NEXT")

    # 4. Medication & Prescription Advice
    pdf.section_title("4. Prescribed Medication & Therapeutic Guidance")
    meds = care_plan.get("medication_advice")
    if meds:
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        safe_meds = str(meds).encode("latin-1", errors="replace").decode("latin-1")
        pdf.multi_cell(190, 6, safe_meds)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 6, "Standard symptomatic care; no pharmacological directives noted.", new_x="LMARGIN", new_y="NEXT")

    # 5. Dietary & Lifestyle Management
    pdf.section_title("5. Dietary & Lifestyle Directives")
    diet = care_plan.get("dietary_lifestyle")
    if diet:
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(30, 30, 30)
        safe_diet = str(diet).encode("latin-1", errors="replace").decode("latin-1")
        pdf.multi_cell(190, 6, safe_diet)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(190, 6, "Standard balanced hydration and rest advised.", new_x="LMARGIN", new_y="NEXT")

    # 6. Digital Attestation
    pdf.ln(4)
    pdf.set_draw_color(14, 116, 144)
    pdf.set_line_width(0.4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(14, 116, 144)
    pdf.cell(190, 5, "ELECTRONICALLY VERIFIED & ISSUED VIA MEDASSIST AI CLINICAL PORTAL", new_x="LMARGIN", new_y="NEXT", align="R")
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(190, 4, f"Digital Signoff: {caretaker_info.get('full_name', 'Healthcare Provider')} | ID #{caretaker_info.get('user_id', '00')}", new_x="LMARGIN", new_y="NEXT", align="R")

    pdf_bytes = pdf.output()
    return bytes(pdf_bytes)


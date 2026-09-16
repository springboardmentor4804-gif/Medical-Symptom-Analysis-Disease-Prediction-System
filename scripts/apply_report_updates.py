import sys
import subprocess

def update_section3_and_rebuild():
    report_path = r"c:\Users\Hemanth\Documents\Projects_2026\MedAssist-AI\FINAL_PROJECT_REPORT.md"
    with open(report_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find start and end indices
    start_idx = None
    end_idx = None
    for i, line in enumerate(lines):
        if line.startswith("### 3.6 Patient Diagnostic Workflow") or line.startswith("### 3.6 Patient"):
            start_idx = i
        if start_idx is not None and i > start_idx and line.startswith("# 4. Technology Stack & Modules"):
            end_idx = i
            break

    if start_idx is not None and end_idx is not None:
        replacement_lines = [
            "### 3.6 Patient Healthcare Assistance Workflow\n",
            "The patient healthcare assistance workflow sequence is structured as follows:\n",
            "\n",
            "> **Patient Workflow Sequence**: `Login → Patient Dashboard → Symptom Selection/Input → Symptom Severity → Disease Prediction → Risk Assessment → Healthcare Recommendations → PDF Health Report → Assessment History`\n",
            "\n",
            "The selected symptoms are converted into the feature representation expected by the trained model. The Random Forest classifier returns predicted disease classes with model-generated probability scores. The application presents the top-ranked predictions to the user as preliminary informational results rather than a definitive medical diagnosis.\n",
            "\n",
            "```\n",
            "[ Patient Registration / Login ] ──> JWT Auth Issued\n",
            "               │\n",
            "               ▼\n",
            "      [ Patient Dashboard ]\n",
            "               │\n",
            "   ┌───────────┴───────────────────────────────┐\n",
            "   ▼                                           ▼\n",
            "[ Input Symptoms & Severity ]       [ Enter Demographic Vitals ]\n",
            "   │                                           │\n",
            "   ▼                                           ▼\n",
            "[ AI Disease Prediction Engine ]    [ Health Risk Assessment Engine ]\n",
            "   │ (Top-3 Diseases + Prob %)                 │ (Risk Category + Score %)\n",
            "   │                                           │\n",
            "   └───────────────────┬───────────────────────┘\n",
            "                       ▼\n",
            "         [ Healthcare Recommendations ]\n",
            "         (Precautions, Diet, Guidance)\n",
            "                       │\n",
            "                       ▼\n",
            "      [ Generate & Download PDF Report ]\n",
            "                       │\n",
            "                       ▼\n",
            "            [ Assessment History ]\n",
            "```\n",
            "\n",
            "### 3.7 Caretaker Workflow\n",
            "The caretaker workflow sequence is structured as follows:\n",
            "\n",
            "> **Caretaker Workflow Sequence**: `Login → Caretaker Dashboard → View Authorized Patient Information → Review Assessments/Analytics → Select Patient → Create or Update Care Plan → Save/Manage Care Plan`\n",
            "\n",
            "```\n",
            "[ Caretaker Registration / Login ] ──> JWT Auth Issued\n",
            "               │\n",
            "               ▼\n",
            "     [ Caretaker Dashboard ]\n",
            "               │\n",
            "   ┌───────────┼───────────────────────────────┐\n",
            "   ▼           ▼                               ▼\n",
            "[ My Profile] [ View Authorized Patients ]   [ Analytics & Trends Dashboard ]\n",
            "                        │                    (Disease Distribution, Risk Pie,\n",
            "                        ▼                     Monthly Consultation Timeline)\n",
            "               [ Patient Health Records ]\n",
            "               (Symptoms, Predictions, Vitals)\n",
            "                        │\n",
            "                        ▼\n",
            "               [ Create or Update Care Plan ]\n",
            "             (Observations, Health Guidance,\n",
            "              Dietary/Lifestyle Advice, Priority)\n",
            "                        │\n",
            "                        ▼\n",
            "               [ Save/Manage Care Plan ]\n",
            "```\n",
            "\n",
            "---\n",
            "\n"
        ]
        new_lines = lines[:start_idx] + replacement_lines + lines[end_idx:]
        with open(report_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"Successfully replaced lines {start_idx} to {end_idx} in FINAL_PROJECT_REPORT.md")
    else:
        print(f"Error: Could not locate Section 3 boundaries (start={start_idx}, end={end_idx})")

    # Now run DOCX generation
    print("Regenerating DOCX...")
    res = subprocess.run([sys.executable, r"scripts\generate_docx_report.py"], capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print(res.stderr)

if __name__ == "__main__":
    update_section3_and_rebuild()

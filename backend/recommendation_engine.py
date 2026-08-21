"""
MedAssist AI — Centralized Recommendation Engine (Milestone 3)
Knowledge-Based & Rule-Based Healthcare Advisory System

Consumes outputs from Milestone 2 (Disease Prediction, Confidence, Risk Assessment,
Severity, Symptoms, and Patient Context) to generate 5 structured advisory categories:
1. Treatment / Healthcare Suggestions
2. Preventive-Care Advice
3. Lifestyle Recommendations
4. Follow-Up Guidance
5. Warning Signs (Red Flags)

Includes Confidence Calibration (uncertainty note for low-confidence predictions),
Risk-Aware Prioritization (urgency level), Severity Adaptation, and Medical Safety Guardrails.
"""

import os
import pickle
from typing import Dict, List, Any, Optional

# Load existing disease_info if available as a baseline
DATASETS_DIR = "DATASETS" if os.path.exists("DATASETS") else "../DATASETS"
DISEASE_INFO_PATH = os.path.join(DATASETS_DIR, "disease_info.pkl")

_raw_disease_info = {}
if os.path.exists(DISEASE_INFO_PATH):
    try:
        with open(DISEASE_INFO_PATH, "rb") as f:
            _raw_disease_info = pickle.load(f)
    except Exception:
        _raw_disease_info = {}

# Comprehensive Knowledge Base covering diseases supported by the ML classification model
# Structured with specialist, diagnostic tests, preventive care, lifestyle rules, follow-up, and red flags
DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "dengue fever": {
        "specialist": "Infectious Disease Specialist / General Physician",
        "diagnostic_tests": ["Complete Blood Count (CBC) with Platelet Count", "Dengue NS1 Antigen Test", "Dengue IgM/IgG Serology", "Hematocrit Level"],
        "healthcare_suggestions": [
            "Consult an Infectious Disease Specialist or General Physician for clinical evaluation.",
            "Obtain daily Complete Blood Count (CBC) and Platelet Count monitoring during the acute febrile phase.",
            "Strictly avoid aspirin, ibuprofen, and other NSAIDs as they increase hemorrhagic/bleeding risk.",
            "Use paracetamol/acetaminophen strictly as advised by a healthcare provider for fever control."
        ],
        "preventive_care": [
            "Use mosquito repellents (DEET or Picaridin) and wear protective, light-colored long-sleeved clothing.",
            "Eliminate standing water in and around living areas to prevent Aedes mosquito breeding.",
            "Use mosquito bed nets and window screens.",
            "Monitor body temperature twice daily and maintain a detailed symptom log."
        ],
        "lifestyle_recommendations": [
            "Maintain strict bed rest during the febrile and critical phase (days 3-7).",
            "Prioritize aggressive oral rehydration with electrolyte solutions, coconut water, and clear broths.",
            "Consume light, easily digestible, nutrient-dense meals; avoid oily or heavily spiced foods.",
            "Avoid intense physical exertion until complete clinical recovery and platelet normalization."
        ],
        "follow_up_guidance": [
            "Reassess platelet count and hematocrit every 24 hours until fever subsides for at least 48 hours.",
            "Schedule follow-up clinical examination within 24 to 48 hours.",
            "Seek immediate emergency escalation if the critical phase (days 3-7) brings sudden abdominal pain or vomiting."
        ],
        "warning_signs": [
            "Severe, persistent abdominal pain or tenderness.",
            "Persistent vomiting (unable to retain fluids).",
            "Mucosal bleeding (bleeding gums, nosebleeds, blood in stool or vomit).",
            "Lethargy, restlessness, extreme drowsiness, or confusion.",
            "Sudden drop in body temperature accompanied by cold, clammy skin."
        ],
        "is_emergency_condition": False
    },
    "malaria": {
        "specialist": "Infectious Disease Specialist / General Physician",
        "diagnostic_tests": ["Peripheral Blood Smear (Thick and Thin films)", "Malaria Rapid Diagnostic Test (RDT)", "Complete Blood Count", "Liver Function Tests"],
        "healthcare_suggestions": [
            "Consult a physician or infectious disease specialist promptly for confirmatory blood smear testing.",
            "Initiate doctor-prescribed antimalarial therapy without delay once confirmed.",
            "Complete the entire prescribed medication course even after symptoms subside.",
            "Monitor for signs of anemia and jaundice."
        ],
        "preventive_care": [
            "Sleep under insecticide-treated mosquito nets (ITNs).",
            "Apply insect repellents containing DEET to exposed skin.",
            "Take prescribed antimalarial chemoprophylaxis if residing in or traveling through endemic regions.",
            "Keep surroundings clear of stagnant water."
        ],
        "lifestyle_recommendations": [
            "Ensure complete bed rest during paroxysms and febrile episodes.",
            "Drink plenty of fluids with electrolytes to replenish fluids lost from fever and sweating.",
            "Consume a balanced diet rich in iron, protein, and vitamin C to aid red blood cell regeneration.",
            "Avoid strenuous activity until full hemoglobin recovery."
        ],
        "follow_up_guidance": [
            "Repeat blood smear test after 48-72 hours of starting treatment to confirm parasite clearance.",
            "Follow up with your physician within 3-5 days for clinical reassessment.",
            "Seek urgent evaluation if fever spikes recur or dark urine develops."
        ],
        "warning_signs": [
            "Altered mental state, confusion, seizures, or loss of consciousness (Cerebral Malaria).",
            "Severe difficulty breathing or rapid breathing.",
            "Dark, tea-colored urine (Blackwater fever).",
            "Severe jaundice (yellowing of eyes/skin) and profound pallor."
        ],
        "is_emergency_condition": False
    },
    "typhoid fever": {
        "specialist": "Infectious Disease Specialist / Gastroenterologist",
        "diagnostic_tests": ["Blood Culture", "Widal Test / Typhidot", "Stool Culture", "Complete Blood Count"],
        "healthcare_suggestions": [
            "Consult a physician for blood culture confirmation and targeted antibiotic regimen.",
            "Do not discontinue prescribed antibiotics early to prevent carrier state and relapse.",
            "Monitor body temperature and abdominal symptoms closely."
        ],
        "preventive_care": [
            "Drink only boiled, filtered, or bottled water.",
            "Practice strict hand hygiene with soap and water before eating and after using the restroom.",
            "Avoid raw, unpeeled fruits and street food in endemic areas.",
            "Consider typhoid vaccination if traveling to high-risk regions."
        ],
        "lifestyle_recommendations": [
            "Follow a bland, soft, low-fiber diet (porridge, boiled potatoes, soups) to avoid bowel irritation.",
            "Drink 2.5-3 liters of clean fluids daily (ORS, electrolyte water).",
            "Ensure adequate physical rest and avoid abdominal strain.",
            "Maintain separate eating utensils and personal towels to prevent household transmission."
        ],
        "follow_up_guidance": [
            "Follow up with your clinician within 3 days of starting therapy.",
            "Conduct stool culture testing post-treatment to verify non-carrier status.",
            "Re-evaluate immediately if sharp abdominal pain or high fever persists."
        ],
        "warning_signs": [
            "Sudden severe abdominal pain with rigidity (sign of intestinal perforation).",
            "Rectal bleeding or dark tarry stools.",
            "Extreme delirium, stupor, or sustained high fever (> 103°F / 39.5°C).",
            "Severe dehydration and unresponsiveness."
        ],
        "is_emergency_condition": False
    },
    "pneumonia": {
        "specialist": "Pulmonologist / General Physician",
        "diagnostic_tests": ["Chest X-Ray (PA & Lateral)", "Pulse Oximetry (SpO2)", "Complete Blood Count", "Sputum Culture & Gram Stain"],
        "healthcare_suggestions": [
            "Consult a Pulmonologist or General Physician promptly for chest auscultation and imaging.",
            "Follow the prescribed antibiotic, antiviral, or supportive therapy rigorously.",
            "Use a pulse oximeter to track blood oxygen saturation (SpO2) at regular intervals."
        ],
        "preventive_care": [
            "Receive annual influenza and pneumococcal conjugate/polysaccharide vaccines.",
            "Practice respiratory hygiene: cover mouth when coughing and wash hands frequently.",
            "Avoid exposure to tobacco smoke, industrial fumes, and air pollution.",
            "Maintain good oral hygiene to reduce aspiration of oral bacteria."
        ],
        "lifestyle_recommendations": [
            "Prioritize strict bed rest with an elevated headrest (30-45 degrees) to facilitate breathing.",
            "Maintain high fluid intake (warm broths, teas, water) to thin pulmonary secretions.",
            "Practice gentle deep breathing exercises and spirometry as tolerated.",
            "Avoid heavy physical work until lung fields are clear."
        ],
        "follow_up_guidance": [
            "Re-evaluate with your physician within 48-72 hours to verify clinical improvement.",
            "Schedule a follow-up chest X-ray in 4-6 weeks to confirm complete resolution.",
            "Seek emergency care if oxygen saturation drops below 92%."
        ],
        "warning_signs": [
            "Pulse oximetry reading (SpO2) below 92% on room air.",
            "Severe shortness of breath, rapid breathing, or grunting respirations.",
            "Bluish lips, nail beds, or skin (cyanosis).",
            "Hemoptysis (coughing up substantial blood).",
            "Confusion or altered mental state, particularly in older adults."
        ],
        "is_emergency_condition": True
    },
    "asthma": {
        "specialist": "Pulmonologist / Allergist",
        "diagnostic_tests": ["Spirometry / Pulmonary Function Test (PFT)", "Peak Expiratory Flow (PEF) Monitoring", "Fractional Exhaled Nitric Oxide (FeNO)", "Allergy Skin Prick Testing"],
        "healthcare_suggestions": [
            "Consult a Pulmonologist to create or review an Asthma Action Plan.",
            "Ensure proper inhaler technique (use a spacer device if prescribed MDI).",
            "Keep fast-acting rescue inhaler accessible at all times.",
            "Adhere to daily controller medications even when asymptomatic."
        ],
        "preventive_care": [
            "Identify and strictly avoid personal asthma triggers (dust mites, pollen, pet dander, mold, cold air).",
            "Use HEPA air purifiers and dust-mite proof bedding covers.",
            "Get annual influenza and respiratory vaccines.",
            "Check daily air quality index (AQI) before outdoor activities."
        ],
        "lifestyle_recommendations": [
            "Engage in physician-approved low-intensity physical exercise with appropriate pre-exercise warm-up.",
            "Practice diaphragmatic breathing and pursed-lip breathing techniques.",
            "Avoid sudden exposure to cold air; cover mouth and nose with a scarf in winter.",
            "Ensure smoke-free living environment."
        ],
        "follow_up_guidance": [
            "Monitor and record daily Peak Expiratory Flow (PEF) readings.",
            "Schedule routine asthma control reviews every 3 to 6 months.",
            "Consult your doctor if rescue inhaler usage exceeds twice a week."
        ],
        "warning_signs": [
            "Severe breathlessness unable to speak full sentences in one breath.",
            "Chest retractions (skin sucking in around ribs or neck when breathing).",
            "Rescue inhaler provides no relief or wears off in under 2 hours.",
            "Peak Flow reading drops below 50% of personal best (Red Zone)."
        ],
        "is_emergency_condition": True
    },
    "chronic obstructive pulmonary disease (copd)": {
        "specialist": "Pulmonologist",
        "diagnostic_tests": ["Post-Bronchodilator Spirometry (FEV1/FVC ratio)", "Chest CT / X-Ray", "Arterial Blood Gas (ABG)", "6-Minute Walk Test"],
        "healthcare_suggestions": [
            "Consult a Pulmonologist for comprehensive pulmonary function staging.",
            "Adhere strictly to prescribed long-acting bronchodilators and anti-inflammatory inhalers.",
            "Participate in a structured Pulmonary Rehabilitation program."
        ],
        "preventive_care": [
            "Complete and permanent cessation of tobacco smoking.",
            "Avoid secondhand smoke, biomass smoke, and occupational dust/chemical exposures.",
            "Stay up-to-date with pneumococcal, influenza, COVID-19, and RSV vaccinations.",
            "Use air filtration during high smog or pollution days."
        ],
        "lifestyle_recommendations": [
            "Practice energy conservation techniques for daily activities.",
            "Maintain a nutrient-dense, high-protein diet to prevent respiratory muscle wasting.",
            "Perform pursed-lip breathing during exertion.",
            "Stay adequately hydrated to keep mucus thin."
        ],
        "follow_up_guidance": [
            "Regular follow-up visits every 3-6 months depending on GOLD stage.",
            "Track daily symptoms and pulse oximetry readings.",
            "Have an action plan for acute COPD exacerbations."
        ],
        "warning_signs": [
            "Acute worsening of shortness of breath that does not respond to rescue inhalers.",
            "Significant change in sputum color, volume, or thickness with fever.",
            "New or worsening peripheral edema (swollen ankles/legs).",
            "Confusion, excessive sleepiness, or morning headaches."
        ],
        "is_emergency_condition": True
    },
    "hypertension": {
        "specialist": "Cardiologist / General Physician",
        "diagnostic_tests": ["Ambulatory Blood Pressure Monitoring (ABPM)", "Electrocardiogram (ECG)", "Lipid Profile & Serum Creatinine", "Urinalysis (Microalbuminuria)"],
        "healthcare_suggestions": [
            "Consult a Cardiologist or primary care physician for cardiovascular risk assessment.",
            "Take prescribed antihypertensive medications consistently at the same time each day.",
            "Do not abruptly discontinue blood pressure medication without medical advice."
        ],
        "preventive_care": [
            "Maintain a validated home blood pressure log (record morning and evening readings).",
            "Limit dietary sodium intake to less than 1,500 - 2,000 mg per day.",
            "Limit alcohol intake and eliminate tobacco use.",
            "Manage stress through mindfulness, relaxation techniques, and adequate sleep."
        ],
        "lifestyle_recommendations": [
            "Adopt the DASH (Dietary Approaches to Stop Hypertension) diet rich in vegetables, fruits, and whole grains.",
            "Engage in at least 150 minutes of moderate aerobic exercise (e.g., brisk walking) per week.",
            "Maintain a healthy Body Mass Index (BMI between 18.5 and 24.9).",
            "Ensure 7-9 hours of restorative sleep each night."
        ],
        "follow_up_guidance": [
            "Review blood pressure log with your doctor every 4-8 weeks until blood pressure is stable, then every 3-6 months.",
            "Annual screening for target organ damage (kidneys, heart, retinas).",
            "Recheck BP immediately if experiencing headache or visual disturbances."
        ],
        "warning_signs": [
            "Blood pressure reading exceeding 180/120 mmHg (Hypertensive Crisis).",
            "Severe chest pain, pressure, or tightness.",
            "Severe 'thunderclap' headache with nausea or blurred vision.",
            "Sudden numbness, weakness in face/arms, or slurred speech."
        ],
        "is_emergency_condition": False
    },
    "myocardial infarction (heart attack)": {
        "specialist": "Cardiologist / Emergency Medicine Physician",
        "diagnostic_tests": ["12-Lead ECG (immediate)", "Cardiac Troponin (I/T) Biomarkers", "Echocardiogram", "Coronary Angiography"],
        "healthcare_suggestions": [
            "ACT IMMEDIATELY: Call emergency services (911 / 112 / local emergency) without delay.",
            "Chew an uncoated adult aspirin (325 mg) if advised by emergency dispatch and no contraindications/allergies exist.",
            "Do not drive yourself to the hospital; await emergency medical personnel with life-support equipment."
        ],
        "preventive_care": [
            "Strict adherence to post-infarction secondary prevention medications (statins, antiplatelets, beta-blockers).",
            "Complete cardiac rehabilitation program as prescribed.",
            "Control blood pressure, cholesterol, and blood glucose strictly.",
            "Completely avoid all forms of tobacco and vaping."
        ],
        "lifestyle_recommendations": [
            "Rest completely; avoid any physical exertion or stressful situations immediately.",
            "Adopt a heart-healthy Mediterranean diet low in saturated fats and refined sugars.",
            "Gradually resume supervised physical activity only after cardiology clearance.",
            "Maintain emotional well-being and stress reduction practices."
        ],
        "follow_up_guidance": [
            "Immediate emergency department hospitalization required.",
            "Post-discharge cardiology review within 1-2 weeks.",
            "Continuous lifetime cardiac monitoring and medication adherence."
        ],
        "warning_signs": [
            "Crushing chest pain, pressure, fullness, or squeezing in the center of the chest.",
            "Pain radiating to jaw, neck, back, stomach, or one/both arms.",
            "Shortness of breath with or without chest discomfort.",
            "Cold sweat, severe dizziness, lightheadedness, or sudden nausea/vomiting."
        ],
        "is_emergency_condition": True
    },
    "stroke": {
        "specialist": "Neurologist / Emergency Medicine Physician",
        "diagnostic_tests": ["Emergency Non-Contrast Brain CT / MRI", "Carotid Doppler Ultrasound", "CT Angiography (CTA)", "Echocardiogram & Holter Monitor"],
        "healthcare_suggestions": [
            "ACT IMMEDIATELY: Call emergency services immediately (B.E. F.A.S.T. protocol).",
            "Note the exact time symptoms first started; emergency thrombolytic treatment is time-critical (within 3-4.5 hours).",
            "Do NOT administer food, water, or aspirin until professional swallowing and neuroimaging assessment."
        ],
        "preventive_care": [
            "Strict blood pressure management (primary modifiable stroke risk factor).",
            "Anticoagulation / antiplatelet therapy for atrial fibrillation or carotid stenosis.",
            "Strict glycemic and cholesterol control.",
            "Total smoking cessation."
        ],
        "lifestyle_recommendations": [
            "Engage in multidisciplinary post-stroke rehabilitation (physical, occupational, speech therapy).",
            "Adopt a low-sodium, heart-healthy dietary plan.",
            "Implement home safety modifications to prevent fall injuries.",
            "Ensure supervised daily recovery routines."
        ],
        "follow_up_guidance": [
            "Immediate emergency medical department transfer.",
            "Close neurological follow-up at 1, 3, and 6 months post-discharge.",
            "Continuous monitoring for recurrence or secondary vascular events."
        ],
        "warning_signs": [
            "Face drooping or numbness on one side.",
            "Arm or leg weakness / paralysis, especially on one side of the body.",
            "Speech difficulty, slurred speech, or trouble understanding speech.",
            "Sudden loss of balance, coordination, or unexplained severe headache."
        ],
        "is_emergency_condition": True
    },
    "diabetes": {
        "specialist": "Endocrinologist / Diabetologist",
        "diagnostic_tests": ["HbA1c (Glycated Hemoglobin)", "Fasting Plasma Glucose (FPG)", "Oral Glucose Tolerance Test (OGTT)", "Lipid Profile & Urine Albumin/Creatinine Ratio"],
        "healthcare_suggestions": [
            "Consult an Endocrinologist to formulate an individualized glycemic management plan.",
            "Adhere strictly to prescribed oral hypoglycemic agents or insulin therapy.",
            "Perform regular self-monitoring of blood glucose (SMBG) or continuous glucose monitoring (CGM).",
            "Learn to recognize and immediately manage episodes of hypoglycemia (blood sugar < 70 mg/dL)."
        ],
        "preventive_care": [
            "Annual comprehensive dilated eye examination by an Ophthalmologist.",
            "Daily foot inspection for cuts, sores, blisters, or redness.",
            "Annual kidney function tests (eGFR and microalbuminuria).",
            "Keep up-to-date with pneumococcal, hepatitis B, and influenza immunizations."
        ],
        "lifestyle_recommendations": [
            "Follow a consistent carbohydrate, low glycemic index, high-fiber dietary plan.",
            "Engage in at least 150 minutes of moderate aerobic exercise plus 2-3 resistance training sessions per week.",
            "Stay well hydrated with plain water; avoid sugar-sweetened beverages and juices.",
            "Maintain proper foot hygiene: keep feet dry, wear comfortable seamless footwear."
        ],
        "follow_up_guidance": [
            "Check HbA1c every 3 months until target (< 7.0%) is reached, then every 6 months.",
            "Review blood glucose logs and medication adjustments with your physician every 3-6 months.",
            "Re-evaluate immediately if frequent low blood sugars occur."
        ],
        "warning_signs": [
            "Severe hypoglycemia: shakiness, sweating, confusion, dizziness, seizures, or loss of consciousness.",
            "Diabetic Ketoacidosis (DKA) / HHS: high blood sugar > 250 mg/dL, fruity breath, vomiting, rapid breathing, confusion.",
            "Non-healing ulcers, sores, or black discoloration on feet or toes.",
            "Sudden visual blurriness or dark floaters."
        ],
        "is_emergency_condition": False
    },
    "influenza": {
        "specialist": "General Physician / Family Doctor",
        "diagnostic_tests": ["Rapid Influenza Diagnostic Test (RIDT)", "Viral RT-PCR Swab", "Complete Blood Count"],
        "healthcare_suggestions": [
            "Consult a General Physician; prescription antiviral therapy (e.g. oseltamivir) is most effective when initiated within 48 hours of onset.",
            "Use antipyretics (such as acetaminophen/paracetamol) for fever and myalgias under medical guidance.",
            "Avoid aspirin in children and teenagers due to the risk of Reye's syndrome."
        ],
        "preventive_care": [
            "Receive the annual quadrivalent influenza vaccine.",
            "Wash hands regularly with soap and water for at least 20 seconds.",
            "Wear a surgical mask in crowded spaces during peak flu season.",
            "Stay home from work or school to prevent transmitting the virus to others."
        ],
        "lifestyle_recommendations": [
            "Strict bed rest and sleep to support immune response.",
            "Drink plenty of fluids (warm water, broths, herbal teas with honey) to prevent dehydration.",
            "Use warm saline gargles and steam inhalation to soothe throat and nasal passages.",
            "Eat light, wholesome meals rich in vitamin C and zinc as tolerated."
        ],
        "follow_up_guidance": [
            "Monitor symptoms daily; most uncomplicated flu resolves within 5 to 7 days.",
            "Consult a physician if fever lasts beyond 4 days or returns after initial improvement.",
            "Seek urgent care if breathing becomes labored."
        ],
        "warning_signs": [
            "Difficulty breathing or persistent chest discomfort.",
            "Persistent high fever (> 103°F / 39.5°C) not responding to medication.",
            "Severe muscle pain or weakness causing inability to walk.",
            "Confusion, dizziness, or persistent vomiting."
        ],
        "is_emergency_condition": False
    },
    "common cold": {
        "specialist": "General Practitioner",
        "diagnostic_tests": ["Clinical Physical Examination (throat & nasal mucosa)"],
        "healthcare_suggestions": [
            "Consult a General Practitioner if symptoms do not improve after 10 days.",
            "Antibiotics are ineffective against viral colds and should NOT be taken unless a secondary bacterial infection is diagnosed.",
            "Use saline nasal sprays or rinses for nasal congestion relief."
        ],
        "preventive_care": [
            "Practice regular hand hygiene with soap and water.",
            "Avoid touching eyes, nose, and mouth with unwashed hands.",
            "Disinfect frequently touched surfaces (phones, door handles).",
            "Maintain distance from individuals exhibiting respiratory symptoms."
        ],
        "lifestyle_recommendations": [
            "Ensure 8+ hours of restful sleep every night.",
            "Stay well-hydrated with warm liquids like herbal teas, warm lemon water, and clear soups.",
            "Use a room humidifier or steam inhalation to ease congestion.",
            "Avoid active and passive tobacco smoke."
        ],
        "follow_up_guidance": [
            "Routine self-monitoring at home; standard cold resolves in 7-10 days.",
            "Consult a doctor if symptoms worsen after day 7 or if facial pain/earache develops.",
            "Re-evaluate if high fever emerges."
        ],
        "warning_signs": [
            "High fever above 102°F (38.9°C).",
            "Severe sore throat with difficulty swallowing liquids.",
            "Shortness of breath or wheezing.",
            "Severe sinus pressure or ear pain lasting over a week."
        ],
        "is_emergency_condition": False
    },
    "bronchitis": {
        "specialist": "Pulmonologist / General Physician",
        "diagnostic_tests": ["Chest Auscultation", "Pulse Oximetry", "Chest X-Ray (to rule out pneumonia)"],
        "healthcare_suggestions": [
            "Consult a physician for chest examination to distinguish acute bronchitis from pneumonia.",
            "Most acute bronchitis cases are viral; avoid unnecessary antibiotic use.",
            "Use prescribed bronchodilators or cough suppressants/expectorants as clinically indicated."
        ],
        "preventive_care": [
            "Avoid cigarette smoke, vaping, and airborne irritants.",
            "Receive annual flu and COVID-19 vaccinations.",
            "Wear a protective dust mask when exposed to dust or fumes."
        ],
        "lifestyle_recommendations": [
            "Get ample rest to aid airway mucosal healing.",
            "Increase fluid intake (at least 2.5 liters/day) to liquefy bronchial mucus.",
            "Use a cool-mist humidifier or warm steam showers.",
            "Avoid vigorous aerobic workouts while coughing persists."
        ],
        "follow_up_guidance": [
            "Cough may linger for 2-3 weeks as bronchial lining heals.",
            "Consult your doctor if cough produces blood or lasts longer than 3 weeks.",
            "Reassess if fever develops after initial improvement."
        ],
        "warning_signs": [
            "Shortness of breath or resting oxygen saturation below 94%.",
            "Coughing up rust-colored or bloody sputum.",
            "High fever persisting beyond 3 days.",
            "Severe chest pain when breathing or coughing."
        ],
        "is_emergency_condition": False
    },
    "gastroenteritis": {
        "specialist": "Gastroenterologist / General Physician",
        "diagnostic_tests": ["Stool Examination / Culture", "Serum Electrolytes & Renal Function", "Complete Blood Count"],
        "healthcare_suggestions": [
            "Consult a physician to assess hydration status and determine if stool testing is needed.",
            "Prioritize oral rehydration solutions (ORS) to replace fluid and electrolyte loss.",
            "Avoid anti-motility drugs (e.g. loperamide) without medical guidance if fever or bloody stool is present."
        ],
        "preventive_care": [
            "Thoroughly wash hands with soap and water after bathroom use and before handling food.",
            "Cook meat, eggs, and seafood thoroughly.",
            "Wash fruits and vegetables with clean, potable water.",
            "Avoid unpasteurized dairy and questionable street foods."
        ],
        "lifestyle_recommendations": [
            "Sip small amounts of Oral Rehydration Solution (ORS) frequently (50-100 mL every 15-20 minutes).",
            "Transition gradually to the BRAT diet (Bananas, Rice, Applesauce, Toast) once vomiting stops.",
            "Strictly avoid dairy products, caffeine, alcohol, artificial sweeteners, and fatty/greasy foods.",
            "Rest and avoid strenuous activities until gut motility normalizes."
        ],
        "follow_up_guidance": [
            "Monitor hydration status (urine frequency and color, skin turgor).",
            "Follow up with a doctor if diarrhea persists beyond 48 hours.",
            "Seek emergency care if signs of severe dehydration develop."
        ],
        "warning_signs": [
            "Inability to keep liquids down for more than 24 hours.",
            "Signs of severe dehydration: dry mouth, sunken eyes, extreme thirst, no urination for 8+ hours.",
            "Stools containing visible blood, pus, or black tarry material.",
            "High fever (> 102°F / 38.9°C) with severe abdominal cramping."
        ],
        "is_emergency_condition": False
    },
    "sepsis": {
        "specialist": "Critical Care / Infectious Disease Specialist",
        "diagnostic_tests": ["Blood Cultures (multiple sites)", "Serum Lactate Level", "Complete Blood Count & Coagulation", "Sequential Organ Failure Assessment (SOFA)"],
        "healthcare_suggestions": [
            "CRITICAL EMERGENCY: Sepsis is a life-threatening medical emergency requiring immediate ICU / hospital admission.",
            "Call emergency services immediately (911 / 112 / local ER).",
            "Immediate broad-spectrum intravenous antibiotics and IV fluid resuscitation are essential within the first hour."
        ],
        "preventive_care": [
            "Promptly treat and clean all skin wounds, cuts, and burns.",
            "Seek early treatment for localized infections (UTIs, pneumonia, dental, skin infections).",
            "Stay current on recommended vaccinations.",
            "Maintain meticulous hygiene if immunocompromised or chronically ill."
        ],
        "lifestyle_recommendations": [
            "Immediate complete hospitalization required; no home management is safe.",
            "Post-sepsis rehabilitation and physical therapy as prescribed following hospital discharge."
        ],
        "follow_up_guidance": [
            "Immediate Emergency Room admission.",
            "Intensive inpatient monitoring and post-sepsis syndrome follow-up."
        ],
        "warning_signs": [
            "Extreme shivering, muscle pain, or fever; or feeling abnormally cold.",
            "Confusion, slurred speech, disorientation, or altered mental state.",
            "Severe shortness of breath and rapid heart rate (> 100 bpm).",
            "Mottled, discolored, or bluish skin patches.",
            "Passing no urine for an entire day."
        ],
        "is_emergency_condition": True
    },
    "urinary tract infection (uti)": {
        "specialist": "Urologist / General Physician",
        "diagnostic_tests": ["Urinalysis (Dipstick & Microscopy)", "Urine Culture and Sensitivity (Urine C&S)", "Renal Ultrasound (if recurrent)"],
        "healthcare_suggestions": [
            "Consult a physician for urinalysis and targeted antibiotic prescription.",
            "Complete the entire course of prescribed antibiotics to avoid recurrence and resistance.",
            "Avoid self-medicating with over-the-counter painkillers without addressing the infection."
        ],
        "preventive_care": [
            "Drink plenty of water daily (at least 2 to 2.5 liters) to flush urinary bacteria.",
            "Urinate promptly when the urge arises; do not hold urine for extended periods.",
            "Wipe from front to back after using the toilet.",
            "Urinate soon after sexual intercourse to clear bacteria."
        ],
        "lifestyle_recommendations": [
            "Increase fluid intake substantially with water and non-acidic hydration.",
            "Avoid bladder irritants like coffee, alcohol, citrus juices, and carbonated beverages during acute infection.",
            "Wear loose, breathable cotton underwear and avoid tight pants.",
            "Use warm heating pad on lower abdomen for pelvic discomfort."
        ],
        "follow_up_guidance": [
            "Symptoms should improve within 24 to 48 hours of starting antibiotics.",
            "Follow up with your doctor if symptoms persist after 3 days of treatment.",
            "Seek urgent evaluation if flank/back pain or fever develops (sign of kidney involvement)."
        ],
        "warning_signs": [
            "Fever and chills with back/flank pain (indicates Pyelonephritis / Kidney Infection).",
            "Visible blood in urine (Gross Hematuria).",
            "Persistent nausea, vomiting, and inability to take oral medications.",
            "Severe pelvic pain or inability to pass urine."
        ],
        "is_emergency_condition": False
    },
    "anemia": {
        "specialist": "Hematologist / General Physician",
        "diagnostic_tests": ["Complete Blood Count (CBC)", "Serum Ferritin, Iron, and TIBC", "Vitamin B12 and Folate Levels", "Peripheral Blood Smear"],
        "healthcare_suggestions": [
            "Consult a physician to determine the exact underlying etiology (iron deficiency, B12/folate, chronic disease, hemolysis).",
            "Take doctor-recommended iron or vitamin supplements with vitamin C to enhance absorption.",
            "Avoid taking iron supplements with tea, coffee, milk, or calcium supplements."
        ],
        "preventive_care": [
            "Consume a nutrient-rich diet incorporating iron, vitamin B12, and folic acid.",
            "Screen for occult gastrointestinal blood loss or heavy menstrual bleeding if indicated.",
            "Routine periodic blood count checks for at-risk demographics."
        ],
        "lifestyle_recommendations": [
            "Incorporate iron-rich foods (spinach, lentils, beans, fortified cereals, lean meats, poultry, fish).",
            "Pair plant-based iron sources with vitamin C foods (citrus fruits, bell peppers, tomatoes).",
            "Pace daily activities to manage fatigue and avoid sudden postural changes.",
            "Get 7-8 hours of sleep per night."
        ],
        "follow_up_guidance": [
            "Repeat CBC and ferritin test after 8-12 weeks of oral iron therapy.",
            "Regular follow-up with your primary physician to ensure hemoglobin levels normalize.",
            "Re-evaluate if fatigue progressively worsens."
        ],
        "warning_signs": [
            "Chest pain, rapid or irregular heartbeat (palpitations) at rest.",
            "Severe shortness of breath with minimal exertion.",
            "Extreme dizziness, fainting spells (syncope), or severe pallor.",
            "Black or bloody stools."
        ],
        "is_emergency_condition": False
    },
    "allergic rhinitis": {
        "specialist": "Allergist / ENT Specialist",
        "diagnostic_tests": ["Allergy Skin Prick Test", "Serum Specific IgE Blood Test", "Nasal Endoscopy"],
        "healthcare_suggestions": [
            "Consult an Allergist or ENT specialist for targeted allergen identification.",
            "Use doctor-recommended non-sedating antihistamines or corticosteroid nasal sprays.",
            "Use nasal steroid sprays consistently every day for optimal efficacy."
        ],
        "preventive_care": [
            "Keep windows closed during high pollen count seasons.",
            "Wash bedding weekly in hot water (>= 130°F / 54°C) to eliminate dust mites.",
            "Use HEPA air purifiers and vacuum with HEPA filters.",
            "Shower and change clothes after spending time outdoors."
        ],
        "lifestyle_recommendations": [
            "Perform daily saline nasal irrigation (neti pot or saline spray) to rinse allergens from nasal passages.",
            "Avoid known allergen triggers like pet dander, mold, and dust.",
            "Wear sunglasses outdoors to protect eyes from airborne pollen.",
            "Keep indoor humidity below 50% to prevent mold growth."
        ],
        "follow_up_guidance": [
            "Review treatment response with your allergist after 4 weeks.",
            "Discuss allergen immunotherapy (allergy shots or sublingual tablets) if symptoms are persistent."
        ],
        "warning_signs": [
            "Severe wheezing, chest tightness, or difficulty breathing (asthma crossover).",
            "Severe facial pain and purulent nasal discharge lasting > 10 days (secondary bacterial sinusitis).",
            "Swelling of lips, tongue, or throat (anaphylaxis warning)."
        ],
        "is_emergency_condition": False
    },
    "migraine": {
        "specialist": "Neurologist / Headache Specialist",
        "diagnostic_tests": ["Comprehensive Neurological Exam", "Brain MRI / CT (if red flags present)"],
        "healthcare_suggestions": [
            "Consult a Neurologist to establish an acute and preventive migraine management plan.",
            "Take prescribed abortive medications (e.g. triptans) at the earliest onset of the migraine headache or aura.",
            "Maintain a detailed migraine trigger diary."
        ],
        "preventive_care": [
            "Identify and avoid common dietary triggers (aged cheese, MSG, artificial sweeteners, nitrates, excess caffeine).",
            "Maintain regular meal times; avoid fasting or skipping meals.",
            "Stay well-hydrated throughout the day.",
            "Practice stress-management techniques (progressive muscle relaxation, biofeedback)."
        ],
        "lifestyle_recommendations": [
            "Rest in a dark, quiet, temperature-controlled room during an acute attack.",
            "Apply a cold compress or ice pack to the forehead or back of neck.",
            "Maintain a strict, consistent sleep schedule (same bedtime and wake time every day).",
            "Limit screen time and use blue-light filters."
        ],
        "follow_up_guidance": [
            "Review your headache diary with your doctor every 2-3 months.",
            "Consider preventive daily therapy if migraines occur more than 4 days per month.",
            "Seek urgent evaluation if headache characteristics abruptly change."
        ],
        "warning_signs": [
            "Sudden, excruciating 'thunderclap' headache reaching peak intensity in seconds.",
            "Headache accompanied by high fever, stiff neck, confusion, or seizures.",
            "New focal neurological deficits (persistent visual loss, weakness, numbness).",
            "New onset headache after age 50 or headache worsening with coughing/straining."
        ],
        "is_emergency_condition": False
    },
    "arthritis": {
        "specialist": "Rheumatologist / Orthopedic Specialist",
        "diagnostic_tests": ["Joint X-Rays / MRI", "Rheumatoid Factor (RF) & Anti-CCP Antibodies", "ESR & C-Reactive Protein (CRP)", "Uric Acid Level"],
        "healthcare_suggestions": [
            "Consult a Rheumatologist or Orthopedic specialist for joint evaluation and disease subtyping.",
            "Adhere to prescribed anti-inflammatory or disease-modifying antirheumatic drugs (DMARDs).",
            "Work with a physical therapist to design a customized joint-friendly exercise plan."
        ],
        "preventive_care": [
            "Maintain an optimal body weight to reduce mechanical stress on weight-bearing joints (knees, hips).",
            "Use ergonomic tools and joint protection techniques.",
            "Avoid repetitive high-impact joint strain.",
            "Wear supportive, well-cushioned footwear."
        ],
        "lifestyle_recommendations": [
            "Engage in regular low-impact aerobic exercises (swimming, water aerobics, cycling, walking).",
            "Apply heat therapy (warm baths, heating pads) for morning stiffness and cold therapy (ice packs) for acute swelling.",
            "Adopt an anti-inflammatory Mediterranean diet rich in omega-3 fatty acids (flaxseeds, walnuts, oily fish).",
            "Perform gentle range-of-motion stretching exercises daily."
        ],
        "follow_up_guidance": [
            "Schedule routine rheumatology follow-ups every 3 to 6 months.",
            "Periodic blood tests to monitor inflammatory markers and drug safety.",
            "Consult your doctor if joint swelling or redness abruptly worsens."
        ],
        "warning_signs": [
            "Hot, red, severely swollen, and exquisitely tender single joint with fever (suspected Septic Arthritis).",
            "Sudden inability to bear weight on a joint.",
            "Rapidly progressive joint deformity or systemic symptoms (rash, eye inflammation, unprovoked weight loss)."
        ],
        "is_emergency_condition": False
    }
}

def _get_fallback_advisory(disease: str, doctor: str, cures: str, risk_cat: str) -> Dict[str, Any]:
    """Generates structured fallback advisory when a disease is not explicitly defined in the detailed KB."""
    doc_name = doctor if doctor else "General Physician / Specialist"
    cure_text = cures if cures else "evidence-based clinical care, lifestyle modification, and supportive therapy"
    
    return {
        "specialist": doc_name,
        "diagnostic_tests": ["Clinical Physical Examination", "Standard Complete Blood Count (CBC)", "Targeted Diagnostic Evaluation"],
        "healthcare_suggestions": [
            f"Consult a {doc_name} for formal clinical evaluation and confirmatory diagnostics.",
            f"Follow doctor-directed therapy: {cure_text}.",
            "Discuss any pre-existing medical conditions or current medications with your doctor."
        ],
        "preventive_care": [
            "Monitor your vital signs and overall symptoms twice daily.",
            "Follow general preventive health protocols and avoid known health risk factors.",
            "Maintain an up-to-date log of symptom progression to share with your healthcare provider."
        ],
        "lifestyle_recommendations": [
            "Ensure 7-9 hours of restful sleep daily to support immune and physical recovery.",
            "Maintain optimal hydration by drinking 2-2.5 liters of clean water daily unless fluid-restricted.",
            "Consume a balanced, nutrient-dense diet suited to your digestive tolerance.",
            "Avoid strenuous physical exertion and stressful environments during recovery."
        ],
        "follow_up_guidance": [
            "Schedule a clinical evaluation with a qualified physician within 48-72 hours if symptoms persist.",
            "Reassess your symptoms daily; seek prompt medical attention if symptoms worsen.",
            "Follow all physician-recommended post-consultation checkup schedules."
        ],
        "warning_signs": [
            "Sudden severe difficulty breathing, chest pain, or rapid heartbeat.",
            "High fever that does not respond to standard antipyretics.",
            "Severe confusion, dizziness, fainting spells, or loss of consciousness.",
            "Sudden severe or worsening pain in any part of the body."
        ],
        "is_emergency_condition": "emergency" in doc_name.lower() or "urgent" in doc_name.lower()
    }

def get_disease_knowledge(disease_name: str) -> Dict[str, Any]:
    """Lookup disease knowledge from detailed knowledge base or fallback to disease_info.pkl / dynamic rules."""
    key = disease_name.lower().strip()
    
    # 1. Exact match in detailed KB
    if key in DISEASE_KNOWLEDGE_BASE:
        return DISEASE_KNOWLEDGE_BASE[key]
    
    # 2. Substring match in detailed KB
    for k, v in DISEASE_KNOWLEDGE_BASE.items():
        if k in key or key in k:
            return v
            
    # 3. Lookup in existing _raw_disease_info from Milestone 2 dataset
    raw_match = None
    if key in _raw_disease_info:
        raw_match = _raw_disease_info[key]
    else:
        for k, v in _raw_disease_info.items():
            if k in key or key in k:
                raw_match = v
                break
                
    doc = raw_match.get("doctor", "") if raw_match else ""
    cures = raw_match.get("cures", "") if raw_match else ""
    risk_level = raw_match.get("risk_level", "") if raw_match else ""
    
    return _get_fallback_advisory(disease_name, doc, cures, risk_level)


def generate_recommendations(
    disease: str,
    confidence: int,
    risk_score: int,
    risk_level: str,
    severity: str = "Moderate",
    symptoms: Optional[List[str]] = None,
    patient_info: Optional[Dict[str, Any]] = None,
    medical_history: Optional[List[Any]] = None
) -> Dict[str, Any]:
    """
    Centralized Recommendation Engine.
    Consumes Milestone 2 prediction outputs and generates 5 distinct advisory categories,
    confidence notices, risk prioritizations, and medical safety guardrails.
    """
    symptoms = symptoms or []
    patient_info = patient_info or {}
    medical_history = medical_history or []
    
    # 1. Retrieve disease baseline knowledge
    kb = get_disease_knowledge(disease)
    
    # 2. Risk Level normalization & Emergency checks
    risk_score = max(10, min(99, int(risk_score)))
    is_high_risk = risk_score > 70 or "high" in risk_level.lower()
    is_mod_risk = 40 <= risk_score <= 70 or "moderate" in risk_level.lower()
    is_emergency = is_high_risk and (kb.get("is_emergency_condition", False) or risk_score > 75)
    
    # Determine Urgency Level
    if is_emergency or risk_score >= 80:
        urgency_level = "emergency"
        urgency_label = "Emergency / Immediate Medical Evaluation Required"
    elif is_high_risk:
        urgency_level = "urgent"
        urgency_label = "Urgent Medical Attention Recommended"
    elif is_mod_risk:
        urgency_level = "prompt"
        urgency_label = "Prompt Clinical Evaluation Recommended"
    else:
        urgency_level = "routine"
        urgency_label = "Routine Monitoring & Preventive Care"

    # 3. Confidence Calibration
    confidence = max(1, min(99, int(confidence)))
    if confidence >= 75:
        confidence_tier = "High Confidence"
        uncertainty_note = None
    elif confidence >= 60:
        confidence_tier = "Moderate Confidence"
        uncertainty_note = "Moderate model confidence. Reported symptoms may be shared across multiple conditions; professional medical evaluation is advised."
    else:
        confidence_tier = "Low Confidence"
        uncertainty_note = f"Preliminary indication only (Confidence: {confidence}%). This assessment exhibits significant symptom overlap with other common conditions. A physical examination and diagnostic laboratory testing by a qualified healthcare professional are essential for accurate identification."

    # 4. Generate Category A: Treatment / Healthcare Suggestions
    healthcare_list: List[str] = []
    
    if is_emergency:
        healthcare_list.append("EMERGENCY PROTOCOL: Proceed to the nearest Emergency Department or call emergency medical services immediately.")
    elif is_high_risk:
        healthcare_list.append(f"Seek urgent evaluation from a qualified {kb['specialist']} within 12-24 hours.")
    elif is_mod_risk:
        healthcare_list.append(f"Schedule a consultation with a {kb['specialist']} within 24-48 hours.")
    else:
        healthcare_list.append(f"Consult a {kb['specialist']} if symptoms do not improve with self-care over the next 48-72 hours.")
        
    # Add diagnostic tests
    tests = kb.get("diagnostic_tests", [])
    if tests:
        healthcare_list.append(f"Indicated diagnostic tests for consideration: {', '.join(tests[:3])}.")
        
    # Add specific suggestions from KB
    for sug in kb.get("healthcare_suggestions", []):
        if sug not in healthcare_list and not any(sug.lower() in h.lower() for h in healthcare_list):
            healthcare_list.append(sug)

    # 5. Generate Category B: Preventive-Care Advice
    preventive_list: List[str] = []
    # Add vitals monitoring rule based on risk
    if is_high_risk:
        preventive_list.append("Monitor resting heart rate, blood pressure, and body temperature every 2-4 hours.")
    elif is_mod_risk:
        preventive_list.append("Monitor vital signs (temperature and blood pressure) twice daily.")
    else:
        preventive_list.append("Check and record your temperature and symptom progression once daily.")
        
    for prev in kb.get("preventive_care", []):
        if prev not in preventive_list:
            preventive_list.append(prev)

    # 6. Generate Category C: Lifestyle Recommendations
    lifestyle_list: List[str] = []
    
    # Severity adaptation
    sev_lower = severity.lower()
    if sev_lower == "severe":
        lifestyle_list.append("Strict bed rest and complete cessation of physical exertion until medical clearance.")
    elif sev_lower == "moderate":
        lifestyle_list.append("Prioritize restful recovery; avoid strenuous exercise, heavy lifting, or high-stress environments.")
    else:
        lifestyle_list.append("Maintain adequate rest and light, low-intensity daily activities as tolerated.")
        
    for life in kb.get("lifestyle_recommendations", []):
        if life not in lifestyle_list:
            lifestyle_list.append(life)

    # 7. Generate Category D: Follow-Up Guidance
    followup_list: List[str] = []
    
    if is_emergency:
        followup_list.append("Immediate hospital evaluation required. Do not delay or wait for symptoms to evolve.")
    elif is_high_risk:
        followup_list.append("Clinical reassessment required within 24 hours. Seek immediate emergency escalation if any red flag appears.")
    elif is_mod_risk:
        followup_list.append("Monitor symptom progression daily over the next 3 to 5 days; consult your physician if fever or pain persists beyond 48 hours.")
    else:
        followup_list.append("Reassess symptoms in 3 to 5 days. Most mild cases resolve spontaneously with proper rest and hydration.")
        
    for fol in kb.get("follow_up_guidance", []):
        if fol not in followup_list:
            followup_list.append(fol)

    # 8. Generate Category E: Warning Signs (Red Flags)
    warning_signs: List[str] = list(kb.get("warning_signs", []))
    
    # Contextual correlations
    correlations: List[str] = []
    chronic = patient_info.get("chronicConditions", []) or []
    bp = str(patient_info.get("blood_pressure", "")).lower()
    chol = str(patient_info.get("cholesterol_level", "")).lower()
    
    if bp == "high" and any("hypertension" in c.lower() or "heart" in c.lower() for c in chronic):
        correlations.append("Elevated blood pressure baseline correlates with pre-existing cardiovascular risk profile.")
    if chol == "high" and any("cardio" in c.lower() or "artery" in c.lower() for c in chronic):
        correlations.append("Elevated cholesterol profile warrants lipid monitoring and cardiovascular risk assessment.")
    if any(s.lower() in ["difficulty breathing", "shortness of breath", "cough"] for s in symptoms) and any("asthma" in c.lower() or "copd" in c.lower() for c in chronic):
        correlations.append("Respiratory symptoms correlate with documented chronic pulmonary history.")
    if any("diabetes" in c.lower() for c in chronic) and "diabetes" in disease.lower():
        correlations.append("Current symptoms align with ongoing metabolic management profile.")

    # Medical Disclaimer
    disclaimer = "This AI-generated healthcare advisory is provided for educational and decision-support purposes only. It does not constitute a formal medical diagnosis, prescription, or clinical treatment plan. Always consult a qualified healthcare professional for medical diagnosis and treatment."

    # Backwards-compatible single string representations
    healthcare_summary = healthcare_list[0] if healthcare_list else "Consult a General Practitioner."
    preventive_summary = preventive_list[0] if preventive_list else "Monitor vital signs daily."
    lifestyle_summary = lifestyle_list[0] if lifestyle_list else "Ensure adequate rest, hydration, and nutrition."
    followup_summary = followup_list[0] if followup_list else "Follow up with a healthcare professional if symptoms persist."

    return {
        "disease": disease,
        "confidence": confidence,
        "confidenceTier": confidence_tier,
        "uncertaintyNote": uncertainty_note,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "urgencyLevel": urgency_level,
        "urgencyLabel": urgency_label,
        "severity": severity,
        "isEmergency": is_emergency,
        "specialist": kb.get("specialist", "General Physician"),
        "diagnosticTests": kb.get("diagnostic_tests", []),
        "correlations": correlations,
        "disclaimer": disclaimer,
        
        # 5 Primary Categories as Structured Lists
        "healthcareSuggestions": healthcare_list,
        "preventiveCare": preventive_list,
        "lifestyleRecommendations": lifestyle_list,
        "followUpGuidance": followup_list,
        "warningSigns": warning_signs,
        
        # Legacy summary strings for compatibility
        "healthcare": healthcare_summary,
        "preventive": preventive_summary,
        "lifestyle": lifestyle_summary,
        "followUp": followup_summary
    }

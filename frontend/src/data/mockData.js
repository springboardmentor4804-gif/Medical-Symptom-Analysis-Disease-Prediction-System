// Pre-seeded clinical datasets, specialists, and sample triage records
// Aligned with Kaggle Disease Symptoms & Patient Profile Dataset specifications

export const SPECIALIST_DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Marcus Vance, MD, FACC",
    email: "dr.vance@medassist.ai",
    specialization: "Cardiology",
    experienceYears: 16,
    hospital: "Metropolitan Heart & Vascular Institute",
    rating: 4.9,
    reviewsCount: 142,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableSlots: ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"],
    consultationFee: "$120",
    bio: "Senior Cardiologist specializing in ischemic heart disease, hypertension management, and non-invasive cardiovascular risk stratification."
  },
  {
    id: "doc-2",
    name: "Dr. Elena Rostova, MD, FCCP",
    email: "dr.rostova@medassist.ai",
    specialization: "Pulmonology",
    experienceYears: 12,
    hospital: "Apex Lung & Critical Care Center",
    rating: 4.8,
    reviewsCount: 98,
    avatar: "https://images.unsplash.com/photo-1594824813501-48af3137b03b?w=200&auto=format&fit=crop&q=80",
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    availableSlots: ["08:30 AM", "11:00 AM", "01:30 PM", "03:30 PM"],
    consultationFee: "$110",
    bio: "Pulmonology specialist focused on asthma, COPD, pneumonia, post-viral respiratory rehabilitation, and bronchoscopy."
  },
  {
    id: "doc-3",
    name: "Dr. Rajesh Kothari, MD",
    email: "dr.kothari@medassist.ai",
    specialization: "General Medicine & Infectious Diseases",
    experienceYears: 18,
    hospital: "City Health General Hospital",
    rating: 4.95,
    reviewsCount: 220,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: ["10:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"],
    consultationFee: "$85",
    bio: "Board-certified internist with deep expertise in acute febrile illnesses, vector-borne infections (Dengue, Malaria), and systemic diagnostics."
  },
  {
    id: "doc-4",
    name: "Dr. Sophia Chen, MD, PhD",
    email: "dr.chen@medassist.ai",
    specialization: "Endocrinology & Diabetology",
    experienceYears: 14,
    hospital: "Endocrine & Metabolic Health Clinic",
    rating: 4.85,
    reviewsCount: 115,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80",
    availableDays: ["Monday", "Thursday"],
    availableSlots: ["09:30 AM", "01:00 PM", "02:30 PM"],
    consultationFee: "$130",
    bio: "Expert in Type 1 & Type 2 Diabetes management, lipid disorders, thyroid pathology, and preventative metabolic syndrome therapies."
  },
  {
    id: "doc-5",
    name: "Dr. David Sterling, MD",
    email: "dr.sterling@medassist.ai",
    specialization: "Neurology",
    experienceYears: 15,
    hospital: "NeuroHealth Brain Spine Center",
    rating: 4.75,
    reviewsCount: 84,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80",
    availableDays: ["Wednesday", "Friday"],
    availableSlots: ["11:00 AM", "02:00 PM", "04:00 PM"],
    consultationFee: "$140",
    bio: "Neurologist specializing in chronic migraine, intractable cephalalgia, neuropathies, and vestibular balance disorders."
  }
];

export const DISEASE_KNOWLEDGE_BASE = [
  {
    id: "dis-1",
    name: "Acute Bronchitis",
    category: "Respiratory",
    baseRisk: "Medium",
    requiredSymptoms: ["cough", "fatigue"],
    optionalSymptoms: ["fever", "sore_throat", "dyspnea", "chest_pain"],
    indicators: { fever: "Mild", cough: "Productive", breathing: "Mild" },
    description: "Inflammation of the lining of your bronchial tubes, often following an upper respiratory viral infection.",
    treatmentAdvisory: {
      immediateAction: "Rest, hydrate heavily (2-3L fluids/day), and monitor breathing closely.",
      precautions: "Avoid tobacco smoke, dust, and cold damp air. Use a cool mist humidifier.",
      dietary: "Warm herbal teas with honey, warm broths, vitamin C rich citrus fruits.",
      redFlags: "Hemoptysis (coughing blood), fever above 39°C (102.2°F), or rapid worsening of shortness of breath.",
      specialist: "Pulmonologist or Primary Care Physician"
    }
  },
  {
    id: "dis-2",
    name: "Hypertension (Stage 2 Elevated)",
    category: "Cardiovascular",
    baseRisk: "High",
    requiredSymptoms: ["headache", "dizziness"],
    optionalSymptoms: ["chest_pain", "fatigue", "dyspnea"],
    indicators: { bloodPressure: "Stage 2" },
    description: "Significantly elevated arterial blood pressure placing excessive strain on cardiac vessels.",
    treatmentAdvisory: {
      immediateAction: "Rest in a quiet, dark environment. Recheck blood pressure after 15 minutes of rest.",
      precautions: "Strictly restrict sodium intake (<1500mg/day). Avoid caffeine and heavy exertion.",
      dietary: "DASH diet regimen (leafy greens, bananas, berries, low-fat dairy, unsalted nuts).",
      redFlags: "Severe chest pain, sudden vision changes, severe numbness, or confusion require emergency ER care.",
      specialist: "Cardiologist"
    }
  },
  {
    id: "dis-3",
    name: "Dengue Fever",
    category: "Infectious Disease",
    baseRisk: "High",
    requiredSymptoms: ["fever", "joint_pain", "headache"],
    optionalSymptoms: ["nausea", "fatigue", "skin_rash"],
    indicators: { fever: "High" },
    description: "Mosquito-borne viral infection causing acute severe febrile illness, intense arthralgia, and retro-orbital pain.",
    treatmentAdvisory: {
      immediateAction: "Hydrate vigorously with oral rehydration salts (ORS), coconut water, and fluids.",
      precautions: "Do NOT take Aspirin or Ibuprofen (NSAIDs) as they elevate hemorrhage risk; use Paracetamol only under clinical guidance.",
      dietary: "Pomegranate juice, papaya leaf extract (traditional adjunct), soft bland digestible foods.",
      redFlags: "Spontaneous bleeding (gums/nose), persistent vomiting, severe abdominal tenderness, or petechiae rash.",
      specialist: "Infectious Disease Specialist / Internist"
    }
  },
  {
    id: "dis-4",
    name: "Type 2 Diabetes Mellitus (Uncontrolled)",
    category: "Endocrine",
    baseRisk: "Medium",
    requiredSymptoms: ["frequent_urination", "excessive_thirst", "fatigue"],
    optionalSymptoms: ["dizziness", "headache"],
    indicators: { cholesterol: "High" },
    description: "Metabolic disorder characterized by insulin resistance and chronically elevated glycemic levels.",
    treatmentAdvisory: {
      immediateAction: "Conduct fasting blood glucose and HbA1c screening. Maintain adequate hydration.",
      precautions: "Inspect feet daily for micro-lesions. Monitor ketone levels if blood sugar exceeds 250 mg/dL.",
      dietary: "Low glycemic index carbohydrates, high fiber vegetables, lean proteins, zero refined sugars.",
      redFlags: "Fruity breath odor, rapid breathing, altered mental status (Diabetic Ketoacidosis risk).",
      specialist: "Endocrinologist"
    }
  },
  {
    id: "dis-5",
    name: "Migraine with Aura",
    category: "Neurological",
    baseRisk: "Low",
    requiredSymptoms: ["headache", "nausea"],
    optionalSymptoms: ["dizziness", "fatigue"],
    indicators: {},
    description: "Recurrent neurovascular headache disorder causing unilateral pulsating pain and sensory sensitivity.",
    treatmentAdvisory: {
      immediateAction: "Retreat to a quiet, darkened room. Apply a cold compress to the forehead or neck.",
      precautions: "Identify and avoid known triggers (aged cheeses, artificial sweeteners, lack of sleep, screen glare).",
      dietary: "Stay hydrated with electrolyte-infused water; magnesium-rich foods (spinach, pumpkin seeds).",
      redFlags: "Thunderclap onset ('worst headache of life'), stiff neck with fever, or motor weakness.",
      specialist: "Neurologist"
    }
  },
  {
    id: "dis-6",
    name: "Community-Acquired Pneumonia",
    category: "Respiratory",
    baseRisk: "High",
    requiredSymptoms: ["cough", "fever", "dyspnea"],
    optionalSymptoms: ["chest_pain", "fatigue", "sweating"],
    indicators: { fever: "High", breathing: "Severe", cough: "Productive" },
    description: "Infection that inflames air sacs in one or both lungs, which may fill with fluid or purulent material.",
    treatmentAdvisory: {
      immediateAction: "Immediate medical evaluation for chest radiography (X-ray) and pulse oximetry.",
      precautions: "Continuous oxygen saturation monitoring; maintain upright sitting posture to ease lung expansion.",
      dietary: "Calorie-dense warm soups, electrolyte broths, small frequent high-protein meals.",
      redFlags: "Oxygen saturation (SpO2) falling below 93%, cyanosis (bluish lips/fingers), acute confusion.",
      specialist: "Pulmonologist or Urgent Care Facility"
    }
  },
  {
    id: "dis-7",
    name: "Malaria (Plasmodium Falciparum / Vivax)",
    category: "Infectious Disease",
    baseRisk: "High",
    requiredSymptoms: ["fever", "sweating", "headache"],
    optionalSymptoms: ["fatigue", "nausea", "joint_pain"],
    indicators: { fever: "High" },
    description: "Life-threatening disease caused by parasites transmitted to people through the bites of infected female Anopheles mosquitoes.",
    treatmentAdvisory: {
      immediateAction: "Urgent peripheral blood smear (RDT/microscopy) for malarial parasite confirmation.",
      precautions: "Use mosquito nets, wear long sleeves, and commence prescribed Artemisinin-based combination therapy (ACT).",
      dietary: "Adequate caloric intake, easily digestible fluids, electrolyte replenishment.",
      redFlags: "Dark tea-colored urine, jaundice (yellow eyes), extreme prostration or convulsions.",
      specialist: "Infectious Disease Consultant"
    }
  },
  {
    id: "dis-8",
    name: "Bronchial Asthma (Acute Exacerbation)",
    category: "Respiratory",
    baseRisk: "High",
    requiredSymptoms: ["dyspnea", "cough"],
    optionalSymptoms: ["chest_pain", "fatigue"],
    indicators: { breathing: "Moderate" },
    description: "Chronic airway disease characterized by variable airflow obstruction, bronchial hyperresponsiveness, and wheezing.",
    treatmentAdvisory: {
      immediateAction: "Administer prescribed short-acting beta2-agonist (SABA) rescue inhaler (e.g., Albuterol 2-4 puffs via spacer).",
      precautions: "Sit upright, loosen tight clothing, stay calm, and remove immediate allergic triggers.",
      dietary: "Warm decaffeinated fluids; avoid cold drinks and sulfite-preserved foods.",
      redFlags: "Inability to speak in full sentences, retractions of intercostal muscles, unresponsive to rescue inhaler.",
      specialist: "Pulmonologist"
    }
  }
];

export const INITIAL_PATIENT_LOGS = [
  {
    id: "log-101",
    patientId: "pat-1",
    patientName: "Sarah Jenkins",
    date: "2026-03-04 14:30",
    symptoms: ["fever", "cough", "fatigue", "sore_throat"],
    rawInput: "Severe persistent dry cough with mild fever and throat irritation for 3 days",
    indicators: { fever: "Mild", cough: "Productive", breathing: "Normal", bloodPressure: "Normal", cholesterol: "Normal" },
    predictedDisease: "Acute Bronchitis",
    confidence: 88,
    riskLevel: "Medium",
    reviewedByDoctor: true,
    doctorNotes: "Prescribed bronchodilator inhalation and expectorant. Advised chest X-ray if cough persists beyond 7 days.",
    status: "Completed"
  },
  {
    id: "log-102",
    patientId: "pat-2",
    patientName: "David Miller",
    date: "2026-03-07 09:15",
    symptoms: ["chest_pain", "dyspnea", "headache", "dizziness"],
    rawInput: "High pressure in chest when walking, feeling dizzy and severe temple throbbing",
    indicators: { fever: "Normal", cough: "None", breathing: "Moderate", bloodPressure: "Stage 2", cholesterol: "High" },
    predictedDisease: "Hypertension (Stage 2 Elevated)",
    confidence: 93,
    riskLevel: "High",
    reviewedByDoctor: true,
    doctorNotes: "Urgent in-clinic cardiology triage performed. Initiated dual antihypertensive regimen. Scheduled 48hr follow-up ECG.",
    status: "Under Treatment"
  },
  {
    id: "log-103",
    patientId: "pat-3",
    patientName: "Ananya Rao",
    date: "2026-03-08 17:45",
    symptoms: ["fever", "joint_pain", "headache", "skin_rash"],
    rawInput: "High fever with unbearable joint aches and red spots on forearms",
    indicators: { fever: "High", cough: "None", breathing: "Normal", bloodPressure: "Normal", cholesterol: "Normal" },
    predictedDisease: "Dengue Fever",
    confidence: 91,
    riskLevel: "High",
    reviewedByDoctor: false,
    doctorNotes: "",
    status: "Awaiting Provider Review"
  },
  {
    id: "log-104",
    patientId: "pat-4",
    patientName: "Robert Chen",
    date: "2026-03-09 11:20",
    symptoms: ["headache", "nausea", "dizziness"],
    rawInput: "Throbbing unilateral headache with nausea and light sensitivity",
    indicators: { fever: "Normal", cough: "None", breathing: "Normal", bloodPressure: "Normal", cholesterol: "Normal" },
    predictedDisease: "Migraine with Aura",
    confidence: 86,
    riskLevel: "Low",
    reviewedByDoctor: false,
    doctorNotes: "",
    status: "Self-Monitoring"
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    id: "apt-1",
    patientId: "pat-1",
    patientName: "Sarah Jenkins",
    patientPhone: "9845123456",
    patientAge: 32,
    patientGender: "Female",
    doctorId: "doc-1",
    doctorName: "Dr. Marcus Vance, MD, FACC",
    specialization: "Cardiology",
    date: "2026-03-12",
    timeSlot: "10:30 AM",
    status: "Accepted",
    meetingType: "In-Clinic Consultation (Room 304)",
    reason: "Follow-up review for periodic palpitations and mild hypertension",
    doctorRemarks: "Confirmed. Please bring last 3 months BP log and previous lipid panel results.",
    createdAt: "2026-03-06"
  },
  {
    id: "apt-2",
    patientId: "pat-2",
    patientName: "David Miller",
    patientPhone: "9712345678",
    patientAge: 56,
    patientGender: "Male",
    doctorId: "doc-1",
    doctorName: "Dr. Marcus Vance, MD, FACC",
    specialization: "Cardiology",
    date: "2026-03-14",
    timeSlot: "02:00 PM",
    status: "Pending",
    meetingType: "Telehealth Video Call",
    reason: "Post-triage consultation regarding Stage 2 blood pressure assessment",
    doctorRemarks: "",
    createdAt: "2026-03-08"
  },
  {
    id: "apt-3",
    patientId: "pat-3",
    patientName: "Ananya Rao",
    patientPhone: "9823456789",
    patientAge: 27,
    patientGender: "Female",
    doctorId: "doc-3",
    doctorName: "Dr. Rajesh Kothari, MD",
    specialization: "General Medicine & Infectious Diseases",
    date: "2026-03-10",
    timeSlot: "11:30 AM",
    status: "Accepted",
    meetingType: "Urgent Clinic Visit",
    reason: "High febrile symptoms and platelet count monitoring",
    doctorRemarks: "Admitted to day-care observation for IV fluid therapy.",
    createdAt: "2026-03-08"
  }
];

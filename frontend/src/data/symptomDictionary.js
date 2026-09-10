// Master clinical symptom knowledge dictionary
// Aligned with Kaggle Disease Symptoms & Patient Profile Dataset and CDC Clinical Indicators

export const SYMPTOM_DICTIONARY = [
  {
    id: "fever",
    canonicalName: "Fever / Pyrexia",
    category: "Systemic",
    severityDefault: "Moderate",
    keywords: ["fever", "high temperature", "chills", "feeling hot", "feverish", "shivering", "pyrexia", "warm body", "burning up"],
    clinicalTerm: "Pyrexia"
  },
  {
    id: "cough",
    canonicalName: "Cough (Dry/Productive)",
    category: "Respiratory",
    severityDefault: "Moderate",
    keywords: ["cough", "coughing", "hacking", "dry cough", "productive cough", "phlegm", "mucus", "clearing throat"],
    clinicalTerm: "Tussis"
  },
  {
    id: "fatigue",
    canonicalName: "Fatigue & Lethargy",
    category: "Systemic",
    severityDefault: "Mild",
    keywords: ["fatigue", "tired", "exhaustion", "weakness", "lethargic", "no energy", "drained", "worn out", "sleepy"],
    clinicalTerm: "Asthenia / Lethargy"
  },
  {
    id: "dyspnea",
    canonicalName: "Breathing Difficulty / Dyspnea",
    category: "Respiratory",
    severityDefault: "High",
    isRedFlag: true,
    keywords: ["shortness of breath", "breathless", "breathing difficulty", "dyspnea", "hard to breathe", "gasping", "suffocating", "winded"],
    clinicalTerm: "Dyspnea"
  },
  {
    id: "headache",
    canonicalName: "Headache / Migraine",
    category: "Neurological",
    severityDefault: "Moderate",
    keywords: ["headache", "migraine", "head pain", "throbbing head", "pounding head", "cranial pressure", "temple pain"],
    clinicalTerm: "Cephalea"
  },
  {
    id: "chest_pain",
    canonicalName: "Chest Pain / Pressure",
    category: "Cardiovascular",
    severityDefault: "High",
    isRedFlag: true,
    keywords: ["chest pain", "chest tightness", "angina", "pressure in chest", "squeezing chest", "chest ache", "substernal pain"],
    clinicalTerm: "Angina Pectoris"
  },
  {
    id: "nausea",
    canonicalName: "Nausea & Vomiting",
    category: "Gastrointestinal",
    severityDefault: "Moderate",
    keywords: ["nausea", "vomiting", "throwing up", "queasy", "upset stomach", "sick to stomach", "emesis"],
    clinicalTerm: "Emesis / Nausea"
  },
  {
    id: "dizziness",
    canonicalName: "Dizziness & Vertigo",
    category: "Neurological",
    severityDefault: "Moderate",
    keywords: ["dizzy", "dizziness", "lightheaded", "vertigo", "spinning", "unsteady", "fainting sensation", "presyncope"],
    clinicalTerm: "Vertigo"
  },
  {
    id: "joint_pain",
    canonicalName: "Joint Pain & Arthralgia",
    category: "Musculoskeletal",
    severityDefault: "Moderate",
    keywords: ["joint pain", "body ache", "arthralgia", "aching joints", "knee pain", "elbow pain", "stiff joints"],
    clinicalTerm: "Arthralgia"
  },
  {
    id: "sore_throat",
    canonicalName: "Sore Throat / Pharyngitis",
    category: "Respiratory",
    severityDefault: "Mild",
    keywords: ["sore throat", "throat pain", "scratchy throat", "pharyngitis", "pain swallowing", "red throat"],
    clinicalTerm: "Pharyngitis"
  },
  {
    id: "abdominal_pain",
    canonicalName: "Abdominal Pain / Cramps",
    category: "Gastrointestinal",
    severityDefault: "Moderate",
    keywords: ["stomach ache", "belly pain", "abdominal pain", "gut pain", "stomach cramps", "abdominal cramps"],
    clinicalTerm: "Abdominalgia"
  },
  {
    id: "loss_of_taste_smell",
    canonicalName: "Loss of Taste / Smell (Anosmia)",
    category: "Sensory",
    severityDefault: "Moderate",
    keywords: ["loss of smell", "loss of taste", "anosmia", "ageusia", "can't taste", "can't smell"],
    clinicalTerm: "Anosmia / Ageusia"
  },
  {
    id: "skin_rash",
    canonicalName: "Skin Rash & Dermatitis",
    category: "Dermatological",
    severityDefault: "Mild",
    keywords: ["rash", "skin rash", "itchy skin", "hives", "red spots", "dermatitis", "welts", "eczema flare"],
    clinicalTerm: "Dermatitis / Erythema"
  },
  {
    id: "frequent_urination",
    canonicalName: "Frequent Urination / Polyuria",
    category: "Endocrine/Renal",
    severityDefault: "Moderate",
    keywords: ["frequent urination", "peeing a lot", "polyuria", "night urination", "excessive urination"],
    clinicalTerm: "Polyuria"
  },
  {
    id: "excessive_thirst",
    canonicalName: "Excessive Thirst (Polydipsia)",
    category: "Endocrine",
    severityDefault: "Moderate",
    keywords: ["excessive thirst", "always thirsty", "dry mouth", "polydipsia", "unquenchable thirst"],
    clinicalTerm: "Polydipsia"
  },
  {
    id: "sweating",
    canonicalName: "Diaphoresis / Night Sweats",
    category: "Systemic",
    severityDefault: "Moderate",
    keywords: ["sweating", "night sweats", "cold sweats", "excessive perspiration", "diaphoresis"],
    clinicalTerm: "Diaphoresis"
  }
];

export const COMMON_SYMPTOM_TAGS = [
  "Fever",
  "Persistent Cough",
  "Breathing Difficulty",
  "Chest Pain",
  "Headache",
  "Fatigue",
  "Nausea",
  "Dizziness",
  "Joint Pain",
  "Sore Throat",
  "Skin Rash",
  "Frequent Urination"
];

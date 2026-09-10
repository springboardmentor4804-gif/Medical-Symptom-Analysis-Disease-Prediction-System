// AI Disease Prediction & Interactive Health Assistant Engine

export const SYMPTOM_CATEGORIES = [
  {
    category: 'Cardiovascular & Heart',
    specialty: 'Cardiologist',
    symptoms: [
      { id: 'chest_pain', name: 'Chest Pain or Pressure', weight: 7 },
      { id: 'palpitations', name: 'Rapid Heart Rate / Palpitations', weight: 4 },
      { id: 'sob_exertion', name: 'Shortness of Breath (Breathlessness)', weight: 4 },
      { id: 'swollen_legs', name: 'Swollen Legs & Ankles', weight: 5 },
      { id: 'dizziness', name: 'Dizziness & Lightheadedness', weight: 4 },
      { id: 'sweating', name: 'Excessive Sweating & Cold Sweats', weight: 3 },
      { id: 'cold_hands_and_feets', name: 'Cold Hands & Feet', weight: 5 },
      { id: 'prominent_veins_on_calf', name: 'Prominent Veins on Calf', weight: 6 }
    ]
  },
  {
    category: 'Dermatology & Skin',
    specialty: 'Dermatologist',
    symptoms: [
      { id: 'skin_rash', name: 'Skin Rash & Redness', weight: 3 },
      { id: 'itching', name: 'Severe Skin Itching', weight: 1 },
      { id: 'nodal_skin_eruptions', name: 'Nodal Skin Eruptions', weight: 4 },
      { id: 'pus_filled_pimples', name: 'Pus Filled Pimples / Acne', weight: 2 },
      { id: 'blackheads', name: 'Blackheads & Lesions', weight: 2 },
      { id: 'blister', name: 'Fluid Blisters & Bumps', weight: 4 },
      { id: 'skin_peeling', name: 'Skin Peeling & Flaking', weight: 3 },
      { id: 'silver_like_dusting', name: 'Silver-Like Dusting / Psoriasis', weight: 2 },
      { id: 'red_spots_over_body', name: 'Red Spots Over Body', weight: 3 },
      { id: 'dischromic_patches', name: 'Dischromic Patches on Skin', weight: 6 }
    ]
  },
  {
    category: 'Neurological & Brain',
    specialty: 'Neurologist',
    symptoms: [
      { id: 'headache', name: 'Severe Throbbing Headache', weight: 3 },
      { id: 'dizziness', name: 'Dizziness & Loss of Balance', weight: 4 },
      { id: 'slurred_speech', name: 'Slurred Speech & Difficulty Talking', weight: 4 },
      { id: 'weakness_in_limbs', name: 'Weakness in Limbs / Arms / Legs', weight: 7 },
      { id: 'weakness_of_one_body_side', name: 'Weakness on One Body Side', weight: 4 },
      { id: 'spinning_movements', name: 'Spinning Movements / Vertigo', weight: 6 },
      { id: 'blurred_and_distorted_vision', name: 'Blurred & Distorted Vision', weight: 5 },
      { id: 'loss_of_smell', name: 'Loss of Smell or Taste', weight: 3 },
      { id: 'lack_of_concentration', name: 'Lack of Concentration & Confusion', weight: 3 }
    ]
  },
  {
    category: 'Respiratory & Lungs',
    specialty: 'Pulmonologist',
    symptoms: [
      { id: 'cough', name: 'Persistent Cough', weight: 4 },
      { id: 'breathlessness', name: 'Breathlessness / Difficulty Breathing', weight: 4 },
      { id: 'phlegm', name: 'Excessive Phlegm / Mucus', weight: 5 },
      { id: 'blood_in_sputum', name: 'Blood in Sputum / Coughing Blood', weight: 5 },
      { id: 'continuous_sneezing', name: 'Continuous Sneezing', weight: 4 },
      { id: 'runny_nose', name: 'Runny Nose & Nasal Discharge', weight: 5 },
      { id: 'congestion', name: 'Nasal & Chest Congestion', weight: 5 },
      { id: 'sinus_pressure', name: 'Sinus Facial Pressure', weight: 4 },
      { id: 'throat_irritation', name: 'Throat Irritation & Soreness', weight: 4 }
    ]
  },
  {
    category: 'Gastrointestinal & Digestive',
    specialty: 'General Physician',
    symptoms: [
      { id: 'stomach_pain', name: 'Stomach Pain & Cramps', weight: 5 },
      { id: 'acidity', name: 'Acidity & Acid Reflux', weight: 3 },
      { id: 'vomiting', name: 'Vomiting & Nausea', weight: 5 },
      { id: 'indigestion', name: 'Indigestion & Bloating', weight: 5 },
      { id: 'diarrhoea', name: 'Diarrhoea & Frequent Loose Stools', weight: 6 },
      { id: 'constipation', name: 'Constipation', weight: 4 },
      { id: 'loss_of_appetite', name: 'Loss of Appetite', weight: 4 },
      { id: 'bloody_stool', name: 'Bloody Stool / Rectal Bleeding', weight: 5 },
      { id: 'abdominal_pain', name: 'Lower Abdominal Pain', weight: 4 }
    ]
  },
  {
    category: 'Musculoskeletal & Joints',
    specialty: 'Orthopedist',
    symptoms: [
      { id: 'joint_pain', name: 'Joint Pain & Swelling', weight: 3 },
      { id: 'back_pain', name: 'Lower & Upper Back Pain', weight: 3 },
      { id: 'neck_pain', name: 'Neck Stiffness & Pain', weight: 5 },
      { id: 'knee_pain', name: 'Knee Pain & Discomfort', weight: 3 },
      { id: 'muscle_weakness', name: 'Muscle Weakness', weight: 2 },
      { id: 'muscle_pain', name: 'Muscle Aches & Pain', weight: 2 },
      { id: 'stiff_neck', name: 'Stiff Neck', weight: 4 },
      { id: 'swelling_joints', name: 'Swelling Joints', weight: 5 },
      { id: 'movement_stiffness', name: 'Movement Stiffness', weight: 5 }
    ]
  },
  {
    category: 'Systemic, Endocrine & Infection',
    specialty: 'General Physician',
    symptoms: [
      { id: 'high_fever', name: 'High Fever (> 101°F)', weight: 7 },
      { id: 'mild_fever', name: 'Mild Fever / Chills', weight: 5 },
      { id: 'shivering', name: 'Shivering & Rigors', weight: 5 },
      { id: 'fatigue', name: 'Severe Fatigue & Exhaustion', weight: 4 },
      { id: 'weight_loss', name: 'Unexplained Weight Loss', weight: 3 },
      { id: 'weight_gain', name: 'Sudden Weight Gain', weight: 3 },
      { id: 'anxiety', name: 'Anxiety & Restlessness', weight: 4 },
      { id: 'swelled_lymph_nodes', name: 'Swelled Lymph Nodes', weight: 6 },
      { id: 'yellowish_skin', name: 'Yellowish Skin & Eyes (Jaundice)', weight: 3 },
      { id: 'dark_urine', name: 'Dark Colored Urine', weight: 4 }
    ]
  }
];

// Diagnostic Models
const DIAGNOSIS_MODELS = [
  {
    condition: 'Hypertensive Cardiovascular Stress / Angina Risk',
    specialty: 'Cardiologist',
    triggers: ['chest_pain', 'palpitations', 'sob_exertion', 'dizziness', 'sweating'],
    baseRisk: 45,
    summary: 'Symptoms strongly align with cardiovascular strain or coronary insufficiency.'
  },
  {
    condition: 'Acute Dermatitis / Allergic Eczema',
    specialty: 'Dermatologist',
    triggers: ['skin_rash', 'itching', 'nodal_skin_eruptions', 'blister'],
    baseRisk: 25,
    summary: 'Localized immune or allergic reaction in dermal tissue requiring dermatological assessment.'
  },
  {
    condition: 'Migraine Syndrome / Neurological Vasospasm',
    specialty: 'Neurologist',
    triggers: ['headache', 'blurred_and_distorted_vision', 'spinning_movements', 'dizziness'],
    baseRisk: 35,
    summary: 'Neurovascular headache pattern with sensory sensitivity.'
  },
  {
    condition: 'Lower Respiratory Inflammation / Asthma Risk',
    specialty: 'Pulmonologist',
    triggers: ['cough', 'breathlessness', 'phlegm', 'congestion'],
    baseRisk: 40,
    summary: 'Airway hyper-reactivity and bronchial obstruction markers detected.'
  },
  {
    condition: 'Acute Gastroenteritis / Digestive Irritation',
    specialty: 'General Physician',
    triggers: ['stomach_pain', 'vomiting', 'diarrhoea', 'indigestion', 'acidity'],
    baseRisk: 30,
    summary: 'Gastrointestinal mucosal irritation or systemic digestive disturbance.'
  },
  {
    condition: 'Systemic Inflammatory / Viral Infection',
    specialty: 'General Physician',
    triggers: ['high_fever', 'fatigue', 'shivering', 'swelled_lymph_nodes', 'weight_loss'],
    baseRisk: 35,
    summary: 'Widespread immune response to infection or systemic inflammatory process.'
  }
];

export function predictDiseaseRisk({ selectedSymptomIds, severity, duration, age, chronicConditions = '' }) {
  if (!selectedSymptomIds || selectedSymptomIds.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'Low',
      primaryCondition: 'No Active Symptoms Selected',
      recommendedSpecialty: 'General Physician',
      matchedConditions: [],
      urgency: 'Routine',
      warnings: [],
      summary: 'Please select symptoms to generate an AI clinical evaluation.'
    };
  }

  const allSymptomsMap = {};
  SYMPTOM_CATEGORIES.forEach(cat => {
    cat.symptoms.forEach(s => {
      allSymptomsMap[s.id] = { ...s, specialty: cat.specialty };
    });
  });

  let rawScore = 0;
  const specialtyCounts = {};

  selectedSymptomIds.forEach(id => {
    const sym = allSymptomsMap[id];
    if (sym) {
      rawScore += sym.weight * 6;
      specialtyCounts[sym.specialty] = (specialtyCounts[sym.specialty] || 0) + sym.weight;
    }
  });

  const severityMultipliers = { Low: 0.8, Moderate: 1.0, High: 1.25, Severe: 1.5 };
  const severityMult = severityMultipliers[severity] || 1.0;
  
  let ageMult = 1.0;
  if (age > 60) ageMult = 1.2;
  else if (age > 45) ageMult = 1.1;

  let finalRiskScore = Math.min(Math.round((rawScore / 35) * 100 * severityMult * ageMult), 98);
  if (finalRiskScore < 15) finalRiskScore = 15;

  let riskLevel = 'Low';
  let urgency = 'Routine Care';
  if (finalRiskScore >= 75) {
    riskLevel = 'Critical';
    urgency = 'Immediate Emergency Care';
  } else if (finalRiskScore >= 55) {
    riskLevel = 'High';
    urgency = 'Prompt Specialist Consultation';
  } else if (finalRiskScore >= 35) {
    riskLevel = 'Moderate';
    urgency = 'Schedule Appointment';
  }

  let topSpecialty = 'General Physician';
  let maxWeight = 0;
  Object.keys(specialtyCounts).forEach(spec => {
    if (specialtyCounts[spec] > maxWeight) {
      maxWeight = specialtyCounts[spec];
      topSpecialty = spec;
    }
  });

  const matchedConditions = DIAGNOSIS_MODELS.map(model => {
    const matchCount = model.triggers.filter(t => selectedSymptomIds.includes(t)).length;
    const matchPercent = Math.min(Math.round((matchCount / model.triggers.length) * 100) + (matchCount > 0 ? 30 : 0), 95);
    return {
      condition: model.condition,
      specialty: model.specialty,
      matchPercentage: matchPercent,
      summary: model.summary
    };
  })
  .filter(m => m.matchPercentage > 30)
  .sort((a, b) => b.matchPercentage - a.matchPercentage);

  const primaryCondition = matchedConditions.length > 0 
    ? matchedConditions[0].condition 
    : 'Acute Symptom Pattern';

  const warnings = [];
  if (selectedSymptomIds.includes('chest_pain') || selectedSymptomIds.includes('blood_in_sputum') || selectedSymptomIds.includes('slurred_speech') || selectedSymptomIds.includes('breathlessness')) {
    warnings.push('⚠️ Red Flag Alert: Severe chest pressure, coughing blood, or breathlessness requires immediate emergency medical attention.');
  }

  return {
    riskScore: finalRiskScore,
    riskLevel,
    primaryCondition,
    recommendedSpecialty: topSpecialty,
    matchedConditions: matchedConditions.slice(0, 3),
    urgency,
    warnings,
    summary: `AI Risk Index is ${finalRiskScore}% (${riskLevel} risk). Suggested medical discipline: Dr. ${topSpecialty}.`
  };
}

export function generateAiAssistantResponse(messageText, currentSymptoms = []) {
  const textLower = messageText.toLowerCase();

  if (textLower.includes('chest') || textLower.includes('heart') || textLower.includes('palpitation')) {
    return {
      reply: "Based on your description of chest or cardiac symptoms, our AI Clinical Engine detects potential cardiovascular stress. I strongly recommend evaluating chest tightness, pulse rate, and consulting a **Dr. Cardiologist**.",
      suggestedSpecialty: 'Cardiologist',
      autoSymptoms: ['chest_pain', 'palpitations', 'sob_exertion']
    };
  }

  if (textLower.includes('skin') || textLower.includes('rash') || textLower.includes('itch') || textLower.includes('mole')) {
    return {
      reply: "Dermal symptoms like rashes, hives, or itching are often associated with contact dermatitis or allergic responses. I recommend consulting a **Dr. Dermatologist** for a visual assessment.",
      suggestedSpecialty: 'Dermatologist',
      autoSymptoms: ['skin_rash', 'itching']
    };
  }

  if (textLower.includes('headache') || textLower.includes('dizzy') || textLower.includes('numb') || textLower.includes('memory')) {
    return {
      reply: "Neurological indicators such as severe headaches, dizziness, or limb numbness require neurovascular evaluation. I recommend consulting a **Dr. Neurologist**.",
      suggestedSpecialty: 'Neurologist',
      autoSymptoms: ['headache', 'dizziness']
    };
  }

  if (textLower.includes('cough') || textLower.includes('breath') || textLower.includes('lung')) {
    return {
      reply: "Respiratory symptoms like persistent coughing or shortness of breath suggest airway or bronchial involvement. Consulting a **Dr. Pulmonologist** is advised.",
      suggestedSpecialty: 'Pulmonologist',
      autoSymptoms: ['cough', 'breathlessness']
    };
  }

  return {
    reply: `Hello! I am your MediAI Medical Health Assistant. I have recorded your inquiry: "${messageText}". You can select your symptoms in the symptom grid, review your AI Risk Index, and submit your case directly to a specialist doctor!`,
    suggestedSpecialty: 'General Physician',
    autoSymptoms: []
  };
}

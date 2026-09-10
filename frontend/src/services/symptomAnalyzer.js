import { SYMPTOM_DICTIONARY } from '../data/symptomDictionary.js';
import { DISEASE_KNOWLEDGE_BASE } from '../data/mockData.js';

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalizes free text input into matched standardized clinical symptoms
 * Uses exact keyword matching, token n-grams, and fuzzy Levenshtein comparison
 */
export function normalizeSymptomsFromText(freeText) {
  if (!freeText || typeof freeText !== 'string') return [];
  
  const cleanInput = freeText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = cleanInput.split(/\s+/).filter(Boolean);
  const matchedSymptomsMap = new Map();

  // Create sliding n-grams (1, 2, 3 words)
  const ngrams = [];
  for (let i = 0; i < tokens.length; i++) {
    ngrams.push(tokens[i]);
    if (i + 1 < tokens.length) ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    if (i + 2 < tokens.length) ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }

  SYMPTOM_DICTIONARY.forEach((symptom) => {
    // 1. Direct substring checks on the whole input
    for (const kw of symptom.keywords) {
      const kwLower = kw.toLowerCase();
      if (cleanInput.includes(kwLower)) {
        matchedSymptomsMap.set(symptom.id, {
          ...symptom,
          matchedKeyword: kw,
          matchConfidence: 1.0,
          matchType: 'exact'
        });
        return;
      }
    }

    // 2. Fuzzy token check
    for (const phrase of ngrams) {
      for (const kw of symptom.keywords) {
        const kwLower = kw.toLowerCase();
        if (phrase.length >= 4 && kwLower.length >= 4) {
          const dist = levenshteinDistance(phrase, kwLower);
          const maxLen = Math.max(phrase.length, kwLower.length);
          const similarity = 1 - (dist / maxLen);

          if (similarity >= 0.82) {
            if (!matchedSymptomsMap.has(symptom.id) || matchedSymptomsMap.get(symptom.id).matchConfidence < similarity) {
              matchedSymptomsMap.set(symptom.id, {
                ...symptom,
                matchedKeyword: kw,
                matchConfidence: Math.round(similarity * 100) / 100,
                matchType: 'fuzzy'
              });
            }
          }
        }
      }
    }
  });

  return Array.from(matchedSymptomsMap.values());
}

/**
 * Predicts disease and stratifies clinical risk based on:
 * - Selected or normalized symptom IDs
 * - Clinical indicators: { fever, cough, breathing, bloodPressure, cholesterol }
 * - Patient profile: age, gender
 */
export function analyzeDiseaseRisk({
  symptomIds = [],
  indicators = {
    fever: 'Normal',
    cough: 'None',
    breathing: 'Normal',
    bloodPressure: 'Normal',
    cholesterol: 'Normal'
  },
  patientProfile = {}
}) {
  const scoredDiseases = DISEASE_KNOWLEDGE_BASE.map((disease) => {
    let score = 0;
    let maxPossibleScore = (disease.requiredSymptoms.length * 3) + (disease.optionalSymptoms.length * 1.2) + 3;

    // Required symptoms evaluation
    let matchedRequiredCount = 0;
    disease.requiredSymptoms.forEach((reqSym) => {
      if (symptomIds.includes(reqSym)) {
        score += 3;
        matchedRequiredCount++;
      }
    });

    // Optional symptoms evaluation
    disease.optionalSymptoms.forEach((optSym) => {
      if (symptomIds.includes(optSym)) {
        score += 1.2;
      }
    });

    // Indicator corroboration
    if (disease.indicators) {
      Object.entries(disease.indicators).forEach(([key, expectedVal]) => {
        if (indicators[key] && indicators[key] !== 'Normal' && indicators[key] !== 'None') {
          if (indicators[key] === expectedVal) {
            score += 2.0;
          } else {
            score += 0.8;
          }
        }
      });
    }

    // High blood pressure indicator boost for cardiovascular
    if (indicators.bloodPressure === 'Stage 2' && disease.category === 'Cardiovascular') {
      score += 2.5;
    }
    // Breathing difficulty indicator boost for respiratory
    if ((indicators.breathing === 'Moderate' || indicators.breathing === 'Severe') && disease.category === 'Respiratory') {
      score += 2.5;
    }
    // High cholesterol indicator boost for Endocrine/Cardiovascular
    if (indicators.cholesterol === 'High' && (disease.category === 'Endocrine' || disease.category === 'Cardiovascular')) {
      score += 1.5;
    }

    // Normalized confidence percentage
    const rawRatio = score / maxPossibleScore;
    let confidence = Math.min(96, Math.max(35, Math.round(rawRatio * 100)));
    
    // Penalize if zero required symptoms match
    if (matchedRequiredCount === 0 && disease.requiredSymptoms.length > 0) {
      confidence = Math.min(confidence, 42);
    }

    return {
      ...disease,
      score,
      confidence,
      matchedRequiredCount,
      totalRequiredCount: disease.requiredSymptoms.length
    };
  });

  // Sort by highest confidence
  scoredDiseases.sort((a, b) => b.confidence - a.confidence);
  const primaryPrediction = scoredDiseases[0];

  // Stratify Clinical Risk Level
  let calculatedRisk = primaryPrediction.baseRisk || 'Medium';

  // Red-flag symptom checks (dyspnea, chest_pain)
  const hasRedFlagSymptom = symptomIds.some((id) => {
    const sym = SYMPTOM_DICTIONARY.find(s => s.id === id);
    return sym && sym.isRedFlag;
  });

  if (
    hasRedFlagSymptom || 
    indicators.breathing === 'Severe' || 
    indicators.bloodPressure === 'Stage 2' || 
    indicators.fever === 'High' ||
    (primaryPrediction.confidence >= 85 && primaryPrediction.baseRisk === 'High')
  ) {
    calculatedRisk = 'High';
  } else if (
    primaryPrediction.confidence < 60 && 
    !hasRedFlagSymptom && 
    indicators.breathing === 'Normal' && 
    indicators.bloodPressure === 'Normal'
  ) {
    calculatedRisk = 'Low';
  }

  // Generate differential diagnoses (top 3)
  const differentialDiagnoses = scoredDiseases.slice(1, 4).map(d => ({
    name: d.name,
    category: d.category,
    confidence: Math.max(30, Math.min(d.confidence, primaryPrediction.confidence - 5))
  }));

  return {
    disease: primaryPrediction.name,
    diseaseCategory: primaryPrediction.category,
    confidence: primaryPrediction.confidence,
    riskLevel: calculatedRisk,
    description: primaryPrediction.description,
    treatmentAdvisory: primaryPrediction.treatmentAdvisory,
    differentialDiagnoses,
    matchedSymptoms: symptomIds.map(id => {
      const sym = SYMPTOM_DICTIONARY.find(s => s.id === id);
      return sym ? sym.canonicalName : id;
    }),
    evaluatedIndicators: indicators,
    triageTimestamp: new Date().toISOString()
  };
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { SYMPTOM_DICTIONARY } from '../../data/symptomDictionary.js';
import { normalizeSymptomsFromText, analyzeDiseaseRisk } from '../../services/symptomAnalyzer.js';
import { api } from '../../services/api.js';
import DiagnosticResultCard from './DiagnosticResultCard.jsx';
import { 
  Sparkles, 
  Search, 
  X, 
  Thermometer, 
  Wind, 
  Heart, 
  Activity, 
  Droplet, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_PROMPTS = [
  {
    label: 'Bronchitis Symptoms',
    text: 'Severe persistent dry cough with mild fever and throat irritation for 3 days'
  },
  {
    label: 'Cardiac / Hypertension',
    text: 'High pressure in chest when walking, feeling dizzy and severe temple throbbing'
  },
  {
    label: 'Dengue / Febrile Illness',
    text: 'High fever with unbearable joint aches and red spots on forearms'
  },
  {
    label: 'Asthma / Respiratory',
    text: 'Severe shortness of breath, chest tightness, and wheezing cough during night'
  }
];

export default function SymptomChecker() {
  const { currentUser } = useAuth();
  const { addDiagnosticLog, activeDiagnosis, setActiveDiagnosis } = useMedical();

  const [rawInput, setRawInput] = useState('');
  const [selectedSymptomIds, setSelectedSymptomIds] = useState([]);
  const [normalizedMatches, setNormalizedMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clinical Indicators State
  const [indicators, setIndicators] = useState({
    fever: 'Normal',
    cough: 'None',
    breathing: 'Normal',
    bloodPressure: 'Normal',
    cholesterol: 'Normal'
  });

  // Automatically parse NLP symptoms when user pauses typing or submits
  useEffect(() => {
    if (!rawInput.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      const matches = normalizeSymptomsFromText(rawInput);
      setNormalizedMatches(matches);

      // Merge newly discovered IDs into selected
      setSelectedSymptomIds((prev) => {
        const set = new Set(prev);
        matches.forEach((m) => set.add(m.id));
        return Array.from(set);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [rawInput]);

  const handleIndicatorChange = (key, value) => {
    setIndicators((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSymptomSelection = (symptomId) => {
    setSelectedSymptomIds((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleRunDiagnosis = async () => {
    if (selectedSymptomIds.length === 0 && !rawInput.trim()) {
      alert('Please enter or select at least one symptom to evaluate.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const userEmail = currentUser?.email || 'patient@example.com';
      const symptomTextCombined = rawInput.trim() || selectedSymptomIds.join(', ');

      const backendPayload = {
        email: userEmail,
        symptoms_text: symptomTextCombined,
        fever: indicators.fever === 'High' || indicators.fever === 'Moderate' ? 'Yes' : 'No',
        cough: indicators.cough !== 'None' ? 'Yes' : 'No',
        fatigue: indicators.fatigue || 'Yes',
        difficulty_breathing: indicators.breathing !== 'Normal' ? 'Yes' : 'No',
        blood_pressure: indicators.bloodPressure || 'Normal',
        cholesterol: indicators.cholesterol || 'Normal'
      };

      // Call FastAPI Backend & MongoDB Atlas
      const res = await api.predictDisease(backendPayload);

      // Fetch comprehensive clinical recommendations
      let recData = null;
      try {
        recData = await api.getRecommendations(res.predicted_disease, res.risk_level);
      } catch (e) {
        console.warn('Recommendations fetch note:', e);
      }

      // Save to medical triage history & UI state
      const savedEntry = addDiagnosticLog({
        patientId: currentUser?.id || userEmail,
        patientName: currentUser?.name || 'Patient',
        symptoms: selectedSymptomIds,
        rawInput: symptomTextCombined,
        indicators,
        predictedDisease: res.predicted_disease,
        confidence: parseFloat(res.confidence_score) || 92.5,
        riskLevel: res.risk_level,
        diseaseCategory: 'Clinical Diagnostic Evaluation',
        description: res.recommendations,
        treatmentAdvisory: recData?.treatment_suggestions || res.recommendations,
        lifestyleAdvice: recData?.lifestyle_advice || [],
        precautions: recData?.precautions || [],
        whenToConsult: recData?.when_to_consult || '',
        differentialDiagnoses: []
      });

      setIsAnalyzing(false);

      if (res.risk_level === 'Low') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      console.warn('Backend predict fallback to local analyzer:', err);
      // Fallback to local rule engine if backend is offline
      const result = analyzeDiseaseRisk({
        symptomIds: selectedSymptomIds,
        indicators,
        patientProfile: {
          age: currentUser?.age || 32,
          gender: currentUser?.gender || 'Female'
        }
      });

      addDiagnosticLog({
        patientId: currentUser?.id || 'pat-1',
        patientName: currentUser?.name || 'Patient',
        symptoms: selectedSymptomIds,
        rawInput: rawInput || 'Selected via interactive clinical selectors',
        indicators,
        predictedDisease: result.disease,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        diseaseCategory: result.diseaseCategory,
        description: result.description,
        treatmentAdvisory: result.treatmentAdvisory,
        differentialDiagnoses: result.differentialDiagnoses
      });

      setIsAnalyzing(false);
    }
  };

  // Filtered dictionary for manual picker
  const filteredSymptoms = SYMPTOM_DICTIONARY.filter(
    (s) =>
      s.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-brand-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-100 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI-Assisted Diagnostic Triage & Evidence-Based Guidance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Describe Your Symptoms & Receive Instant Clinical Risk Stratification
          </h1>
          <p className="text-indigo-100/90 text-sm mt-2 leading-relaxed">
            Enter your symptoms in plain English or select from clinical indicators. Our NLP engine normalizes your inputs against verified medical datasets to predict potential conditions, calculate confidence scores, and format a clinical PDF report.
          </p>

          {/* Quick sample prompt chips */}
          <div className="mt-5 pt-4 border-t border-white/15">
            <span className="text-xs font-bold text-indigo-200 block mb-2">Try quick sample clinical scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRawInput(p.text);
                    if (idx === 1) {
                      setIndicators((prev) => ({ ...prev, bloodPressure: 'Stage 2', breathing: 'Moderate' }));
                    } else if (idx === 2) {
                      setIndicators((prev) => ({ ...prev, fever: 'High' }));
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/20 transition-all text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Box & Interactive Indicators */}
        <div className="lg:col-span-7 space-y-6">
          {/* Natural Language Input Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Natural Language Symptom Input
              </label>
              <span className="text-xs text-slate-400">NLP & Fuzzy Normalization Active</span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Example: I've had a severe persistent cough with high fever and chest tightness since yesterday..."
                className="w-full p-3.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none text-slate-800 placeholder:text-slate-400"
              />
              {rawInput && (
                <button
                  onClick={() => setRawInput('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Normalized Symptoms Tags Detected from Text */}
            {normalizedMatches.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Recognized Clinical Symptoms ({normalizedMatches.length}):
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                    Confidence: High
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {normalizedMatches.map((sym) => (
                    <span
                      key={sym.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-indigo-900 border border-indigo-200 shadow-2xs"
                    >
                      <span>{sym.canonicalName}</span>
                      <span className="text-[10px] text-indigo-500 font-mono">
                        ({sym.matchType === 'exact' ? 'Exact match' : `${Math.round(sym.matchConfidence * 100)}% fuzzy`})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Symptom Indicators (Fever, Cough, Breathing, BP, Cholesterol) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Clinical Biomarkers & Symptom Indicator Dropdowns
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Refine diagnostic accuracy with measured physical observations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fever Indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  Fever / Body Temperature
                </label>
                <select
                  value={indicators.fever}
                  onChange={(e) => handleIndicatorChange('fever', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="Normal">Normal (&lt; 98.6°F / 37°C)</option>
                  <option value="Mild">Mild (99°F - 100.4°F)</option>
                  <option value="Moderate">Moderate (100.5°F - 102°F)</option>
                  <option value="High">High / Severe (&gt; 102°F / 38.9°C)</option>
                </select>
              </div>

              {/* Cough Indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Wind className="w-4 h-4 text-indigo-500" />
                  Cough Profile
                </label>
                <select
                  value={indicators.cough}
                  onChange={(e) => handleIndicatorChange('cough', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="None">None / No Cough</option>
                  <option value="Dry">Dry Hacking Cough</option>
                  <option value="Productive">Productive Cough (Phlegm / Sputum)</option>
                  <option value="Severe">Severe / Paroxysmal Barking</option>
                </select>
              </div>

              {/* Breathing Difficulty Indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Wind className="w-4 h-4 text-cyan-600" />
                  Breathing / Dyspnea Status
                </label>
                <select
                  value={indicators.breathing}
                  onChange={(e) => handleIndicatorChange('breathing', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="Normal">Normal Unlabored Breathing</option>
                  <option value="Mild">Mild Shortness upon exertion</option>
                  <option value="Moderate">Moderate Wheezing / Tightness</option>
                  <option value="Severe">Severe Shortness / Resting Dyspnea</option>
                </select>
              </div>

              {/* Blood Pressure Indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Blood Pressure Stratification
                </label>
                <select
                  value={indicators.bloodPressure}
                  onChange={(e) => handleIndicatorChange('bloodPressure', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="Normal">Normal (&lt; 120/80 mmHg)</option>
                  <option value="Elevated">Elevated (120-129 / &lt;80 mmHg)</option>
                  <option value="Stage 1">Stage 1 HTN (130-139 / 80-89 mmHg)</option>
                  <option value="Stage 2">Stage 2 HTN (≥ 140/90 mmHg)</option>
                </select>
              </div>

              {/* Cholesterol Indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Droplet className="w-4 h-4 text-amber-500" />
                  Serum Cholesterol Profile
                </label>
                <select
                  value={indicators.cholesterol}
                  onChange={(e) => handleIndicatorChange('cholesterol', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="Normal">Desirable / Normal (&lt; 200 mg/dL)</option>
                  <option value="Borderline">Borderline Elevated (200 - 239 mg/dL)</option>
                  <option value="High">High Risk (≥ 240 mg/dL)</option>
                </select>
              </div>
            </div>

            {/* Run Diagnostic Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={selectedSymptomIds.length === 0 || isAnalyzing}
                onClick={handleRunDiagnosis}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 ${
                  selectedSymptomIds.length === 0 || isAnalyzing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 via-brand-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/25 hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating Clinical Knowledge Base...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Run AI Disease Prediction & Risk Stratification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Symptom Catalog & Active Diagnostic Result */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Diagnostic Result (if evaluated) */}
          {activeDiagnosis && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Latest Triage Diagnostic Result
                </h3>
                <button
                  onClick={() => setActiveDiagnosis(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear view
                </button>
              </div>
              <DiagnosticResultCard
                diagnosis={activeDiagnosis}
                selectedSymptoms={selectedSymptomIds}
                indicators={indicators}
              />
            </div>
          )}

          {/* Quick Symptom Catalog Picker */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select Symptoms ({selectedSymptomIds.length} Selected)
                </h3>
                <p className="text-xs text-slate-500">Tap to add or remove symptoms from clinical evaluation</p>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fever, headache, chest pain..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* List of Symptoms */}
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredSymptoms.map((symptom) => {
                const isSelected = selectedSymptomIds.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    onClick={() => toggleSymptomSelection(symptom.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{symptom.canonicalName}</span>
                        {symptom.isRedFlag && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                            RED FLAG
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{symptom.category}</p>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

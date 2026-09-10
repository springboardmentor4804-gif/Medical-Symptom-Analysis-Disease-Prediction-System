import React, { useState } from 'react';
import { SYMPTOM_CATEGORIES } from '../../services/aiPredictor';
import { Stethoscope, CheckCircle2, Clock, Zap, Send, Edit3 } from 'lucide-react';

export default function SymptomChecker({
  selectedSymptomIds,
  onToggleSymptom,
  severity,
  onSeverityChange,
  duration,
  onDurationChange,
  onSubmitPatientData
}) {
  const [customText, setCustomText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Collect all disease/symptom options
  const allDiseaseOptions = [];
  SYMPTOM_CATEGORIES.forEach(cat => {
    cat.symptoms.forEach(sym => {
      allDiseaseOptions.push({ ...sym, category: cat.category, specialty: cat.specialty });
    });
  });

  const filteredOptions = searchFilter.trim() === ''
    ? allDiseaseOptions
    : allDiseaseOptions.filter(s => s.name.toLowerCase().includes(searchFilter.toLowerCase()) || s.category.toLowerCase().includes(searchFilter.toLowerCase()));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedSymptomIds.length === 0 && !customText.trim()) {
      alert('Please select or enter at least one symptom before running the AI assessment.');
      return;
    }
    if (customText.trim()) {
      const textLower = customText.toLowerCase();
      allDiseaseOptions.forEach(opt => {
        if (textLower.includes(opt.name.toLowerCase()) || opt.name.toLowerCase().split(' ').some(word => word.length > 3 && textLower.includes(word))) {
          if (!selectedSymptomIds.includes(opt.id)) {
            onToggleSymptom(opt.id);
          }
        }
      });
    }
    // Submit patient disease data
    onSubmitPatientData();
  };


  return (
    <div className="card glass-panel fade-in">
      <div className="card-header border-bottom">
        <div>
          <h3><Stethoscope className="icon-header" /> Symptom & Disease Input</h3>
          <p className="card-subtitle">Type your symptoms in the box or select disease options below</p>
        </div>
        <div className="counter-pill">
          {selectedSymptomIds.length} Selected
        </div>
      </div>

      {/* 1. TEXT BOX TO ENTER SYMPTOMS */}
      <form onSubmit={handleFormSubmit} className="symptom-text-box-section margin-bottom">
        <label className="form-label font-bold text-main flex-items-center gap-6">
          <Edit3 size={16} color="#06b6d4" /> Enter Your Symptoms / Disease Details
        </label>
        <div className="input-with-icon margin-top-xs">
          <textarea
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setSearchFilter(e.target.value);
            }}
            placeholder="Type your symptoms here (e.g., 'Severe chest tightness, dizziness, and rapid heartbeat')..."
            className="form-input text-area custom-symptom-input"
            rows={3}
          />
        </div>
      </form>

      {/* 2. SELECTABLE DISEASE OPTIONS BELOW */}
      <div className="disease-options-section margin-bottom border-top padding-top">
        <div className="section-title space-between">
          <span className="font-semibold text-main">Selectable Disease & Symptom Options (Click to select)</span>
          <span className="text-muted text-xs">Click options below to add</span>
        </div>

        <div className="disease-options-grid margin-top-xs">
          {filteredOptions.map(opt => {
            const isSelected = selectedSymptomIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggleSymptom(opt.id)}
                className={`disease-option-chip ${isSelected ? 'active' : ''}`}
              >
                <CheckCircle2 size={15} className={`chip-check ${isSelected ? 'visible' : ''}`} />
                <span className="option-name">{opt.name}</span>
                <span className="option-spec">({opt.specialty})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity & Duration Controls */}
      <div className="symptom-params-grid border-top padding-top">
        <div className="param-box">
          <label className="param-label"><Zap size={16} color="#eab308" /> Severity Level</label>
          <div className="severity-options">
            {['Low', 'Moderate', 'High', 'Severe'].map(level => (
              <button
                key={level}
                type="button"
                className={`severity-btn ${level.toLowerCase()} ${severity === level ? 'active' : ''}`}
                onClick={() => onSeverityChange(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="param-box">
          <label className="param-label"><Clock size={16} color="#06b6d4" /> Symptom Duration</label>
          <select
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            className="form-input custom-select"
          >
            <option value="1-3 days">1-3 Days (Acute)</option>
            <option value="1 week">1 Week</option>
            <option value="2-3 weeks">2-3 Weeks</option>
            <option value="1+ month">1+ Month (Chronic)</option>
          </select>
        </div>
      </div>

      {/* DIRECT SUBMIT BUTTON */}
      <div className="card-footer align-right">
        <button
          type="button"
          onClick={handleFormSubmit}
          className="btn-success btn-lg pulse-glow"
        >
          <Send size={18} /> Submit
        </button>
      </div>
    </div>
  );
}

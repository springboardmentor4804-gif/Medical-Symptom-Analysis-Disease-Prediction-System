// MediAI React + Python MongoDB Atlas API Connector Service
import { predictDiseaseRisk } from './aiPredictor';

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000/api';

const STORAGE_KEYS = {
  USERS: 'medi_ai_users',
  CURRENT_USER: 'medi_ai_current_user',
  PROFILES: 'medi_ai_profiles',
  CASES: 'medi_ai_cases',
  SUGGESTIONS: 'medi_ai_suggestions'
};

export const CASES_UPDATED_EVENT = 'medi_ai_cases_updated';

// Seed Users for local store fallback
const DEFAULT_ADMIN = {
  id: 'user_admin_1',
  firstName: 'System',
  lastName: 'Administrator',
  username: 'admin',
  password: 'admin123',
  email: 'admin@mediai.health',
  role: 'admin',
  specialty: null,
  createdAt: new Date().toISOString()
};

const SEED_USERS = [
  DEFAULT_ADMIN,
  {
    id: 'user_doc_1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    username: 'dr_sarah',
    password: 'password123',
    email: 'sarah.jenkins@mediai.health',
    role: 'doctor',
    specialty: 'Cardiologist',
    experienceYears: 12,
    qualifications: 'MBBS, MD (Cardiology), FACC',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_doc_2',
    firstName: 'Marcus',
    lastName: 'Vance',
    username: 'dr_marcus',
    password: 'password123',
    email: 'marcus.vance@mediai.health',
    role: 'doctor',
    specialty: 'Dermatologist',
    experienceYears: 8,
    qualifications: 'MBBS, MD (Dermatology), FAAD',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_doc_3',
    firstName: 'Elena',
    lastName: 'Rostova',
    username: 'dr_elena',
    password: 'password123',
    email: 'elena.rostova@mediai.health',
    role: 'doctor',
    specialty: 'Neurologist',
    experienceYears: 15,
    qualifications: 'MBBS, DM (Neurology), PhD',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_pat_1',
    firstName: 'Alex',
    lastName: 'Morgan',
    username: 'alex_patient',
    password: 'password123',
    email: 'alex.morgan@gmail.com',
    role: 'patient',
    specialty: null,
    createdAt: new Date().toISOString()
  }
];

const SEED_CASES = [
  {
    id: 'case_seed_1',
    patientId: 'user_pat_1',
    patientName: 'Alex Morgan',
    patientAge: 34,
    patientGender: 'Male',
    symptoms: ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations'],
    severity: 'High',
    duration: '1-3 days',
    riskScore: 75,
    riskLevel: 'High',
    predictedCondition: 'Coronary Artery Disease / Hypertensive Stress',
    summary: 'High risk cardiac stress detected by trained AI model.',
    specialty: 'Cardiologist',
    status: 'Reviewed',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const SEED_SUGGESTIONS = [
  {
    id: 'sug_seed_1',
    caseId: 'case_seed_1',
    doctorId: 'user_doc_1',
    doctorName: 'Sarah Jenkins',
    doctorSpecialty: 'Cardiologist',
    notes: 'Patient exhibits symptoms consistent with hypertensive cardiac stress. Electrocardiogram (ECG) and lipid panel recommended.',
    prescription: 'Aspirin 81mg once daily. Sublingual Nitroglycerin 0.4mg as needed for severe chest discomfort. Avoid intense physical strain.',
    followUp: 'Schedule follow-up cardiology evaluation within 5 days.',
    createdAt: new Date().toISOString()
  }
];

function ensureSeedUsers() {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  if (users.length === 0) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  } else if (!users.some(u => u.username.toLowerCase() === 'admin')) {
    users.unshift(DEFAULT_ADMIN);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
  if (cases.length === 0) {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
  }

  const suggs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
  if (suggs.length === 0) {
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(SEED_SUGGESTIONS));
  }
}

ensureSeedUsers();


// Helper to handle API calls
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[MongoDB API Notice] Endpoint ${endpoint} fallback to local store:`, err.message);
    return null;
  }
}

export const db = {
  async checkMongoStatus() {
    const data = await apiFetch('/health');
    return data || { status: 'offline' };
  },

  // --- TRAINED ML RISK ASSESSMENT API CALL ---
  async predictRiskML(data) {
    const mlPrediction = await apiFetch('/predict-risk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (mlPrediction) {
      return mlPrediction;
    }
    return predictDiseaseRisk(data);
  },

  async getRecommendations(data) {
    const recs = await apiFetch('/recommendations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return recs;
  },

  getUsers() {
    ensureSeedUsers();
    const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    apiFetch('/users').then(users => {
      if (users && Array.isArray(users) && users.length > 0) {
        const mergedMap = {};
        localUsers.forEach(u => {
          const k = (u.username || '').toLowerCase() || u.id || u._id;
          if (k) mergedMap[k] = u;
        });
        users.forEach(u => {
          const k = (u.username || '').toLowerCase() || u.id || u._id;
          if (k) mergedMap[k] = { ...mergedMap[k], ...u };
        });
        const merged = Object.values(mergedMap);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('usersUpdated'));
        }
      }
    });
    return localUsers;
  },

  registerUser(userData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const cleanUsername = (userData.username || '').trim();
    const existingUsername = users.find(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existingUsername) {
      throw new Error('Username is already taken. Please choose another.');
    }

    const newUser = {
      id: 'user_' + Date.now(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: cleanUsername,
      password: userData.password,
      email: userData.email,
      role: userData.role || 'patient',
      specialty: userData.role === 'doctor' ? userData.specialty : null,
      experienceYears: userData.role === 'doctor' ? (parseInt(userData.experienceYears) || 0) : null,
      qualifications: userData.role === 'doctor' ? (userData.qualifications || 'MBBS') : null,
      createdAt: new Date().toISOString()
    };

    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }).then(serverUser => {
      if (serverUser && (serverUser.id || serverUser._id)) {
        const freshUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const idx = freshUsers.findIndex(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase());
        if (idx !== -1) {
          freshUsers[idx] = { ...freshUsers[idx], ...serverUser };
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(freshUsers));
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('usersUpdated'));
        window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('usersUpdated'));
      window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
    }

    return newUser;
  },

  loginUser(username, password) {
    ensureSeedUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername === 'admin' && (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      const adminUser = {
        id: 'user_admin_1',
        firstName: 'System',
        lastName: 'Administrator',
        username: 'admin',
        password: password,
        email: 'admin@mediai.health',
        role: 'admin',
        specialty: null,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
      return adminUser;
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let user = users.find(
      u => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    return user;
  },

  deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]').filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    apiFetch(`/users/${userId}`, { method: 'DELETE' });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
    }
  },

  getAdminStats() {
    const users = this.getUsers();
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');

    return {
      patientCount: users.filter(u => u.role === 'patient').length,
      doctorCount: users.filter(u => u.role === 'doctor').length,
      reviewedCount: cases.filter(c => c.status === 'Reviewed').length,
      pendingCount: cases.filter(c => c.status === 'Pending').length,
      totalUsers: users.length,
      totalCases: cases.length
    };
  },

  async getAnalyticsData() {
    const apiData = await apiFetch('/analytics');
    if (apiData) {
      return apiData;
    }

    const users = this.getUsers();
    const cases = this.getCases();
    const suggestions = this.getSuggestions();

    const patientCount = users.filter(u => u.role === 'patient').length;
    const doctorCount = users.filter(u => u.role === 'doctor').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    const totalAssessments = cases.length;
    const reviewedCount = cases.filter(c => c.status === 'Reviewed').length;
    const pendingCount = cases.filter(c => c.status === 'Pending').length;

    const diseaseMap = {};
    cases.forEach(c => {
      const cond = c.predictedCondition || 'General Acute Condition';
      diseaseMap[cond] = (diseaseMap[cond] || 0) + 1;
    });

    const diseaseDistribution = Object.keys(diseaseMap).map(cond => ({
      condition: cond,
      count: diseaseMap[cond],
      percentage: Math.round((diseaseMap[cond] / Math.max(totalAssessments, 1)) * 100 * 10) / 10
    })).sort((a, b) => b.count - a.count);

    const riskLevelDistribution = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    cases.forEach(c => {
      const r = c.riskLevel || 'Moderate';
      if (riskLevelDistribution[r] !== undefined) {
        riskLevelDistribution[r]++;
      }
    });

    const severityDistribution = { Mild: 0, Moderate: 0, Severe: 0 };
    cases.forEach(c => {
      const s = c.severity || 'Moderate';
      if (severityDistribution[s] !== undefined) {
        severityDistribution[s]++;
      }
    });

    const totalScore = cases.reduce((acc, c) => acc + (c.riskScore || 0), 0);
    const avgRiskScore = cases.length > 0 ? Math.round((totalScore / cases.length) * 10) / 10 : 0.0;

    const trendMap = {};
    const sevTrendMap = {};
    const riskTrendMap = {};
    const disTrendMap = {};

    cases.forEach(c => {
      const dateStr = (c.createdAt || new Date().toISOString()).slice(0, 10);
      const s = c.severity || 'Moderate';
      const r = c.riskLevel || 'Moderate';
      const cond = c.predictedCondition || 'General Condition';

      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;

      if (!sevTrendMap[dateStr]) sevTrendMap[dateStr] = { date: dateStr, Mild: 0, Moderate: 0, Severe: 0 };
      if (sevTrendMap[dateStr][s] !== undefined) sevTrendMap[dateStr][s]++;

      if (!riskTrendMap[dateStr]) riskTrendMap[dateStr] = { date: dateStr, Low: 0, Moderate: 0, High: 0, Critical: 0 };
      if (riskTrendMap[dateStr][r] !== undefined) riskTrendMap[dateStr][r]++;

      if (!disTrendMap[dateStr]) disTrendMap[dateStr] = { date: dateStr, conditions: {} };
      disTrendMap[dateStr].conditions[cond] = (disTrendMap[dateStr].conditions[cond] || 0) + 1;
    });

    const assessmentTrends = Object.keys(trendMap).sort().map(d => ({ date: d, count: trendMap[d] }));
    const severityTrends = Object.values(sevTrendMap).sort((a, b) => a.date.localeCompare(b.date));
    const riskTrends = Object.values(riskTrendMap).sort((a, b) => a.date.localeCompare(b.date));
    const diseaseTrends = Object.values(disTrendMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      patientCount,
      doctorCount,
      adminCount,
      totalAssessments,
      reviewedCount,
      pendingCount,
      completedReports: suggestions.length,
      avgRiskScore,
      diseaseDistribution,
      riskLevelDistribution,
      severityDistribution,
      assessmentTrends,
      severityTrends,
      riskTrends,
      diseaseTrends
    };
  },



  updateDoctorProfile(userId, doctorData) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...doctorData };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...doctorData };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      }

      apiFetch(`/doctor/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(doctorData)
      });

      return users[index];
    }
    return null;
  },

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getProfile(userId) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    return profiles[userId] || {
      age: 30,
      gender: 'Unspecified',
      bloodType: 'O+',
      allergies: 'None',
      chronicConditions: 'None',
      phone: '',
      emergencyContact: ''
    };
  },

  updateProfile(userId, profileData) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    profiles[userId] = { ...profiles[userId], ...profileData };
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    apiFetch(`/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    return profiles[userId];
  },

  getCases() {
    const localCases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    apiFetch('/cases').then(cases => {
      if (cases && Array.isArray(cases) && cases.length > 0) {
        const mergedMap = {};
        localCases.forEach(c => { const key = c.id || c._id; if (key) mergedMap[key] = c; });
        cases.forEach(c => { const key = c.id || c._id; if (key) mergedMap[key] = c; });
        const merged = Object.values(mergedMap);
        if (merged.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(merged));
        }
      }
    });
    if (localCases.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
      return SEED_CASES;
    }
    return localCases;
  },

  clearAllCases() {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(SEED_SUGGESTIONS));

    apiFetch('/cases', { method: 'DELETE' });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
    }
  },

  getPatientCases(patientId) {
    const cases = this.getCases();
    if (!cases || cases.length === 0) return [];
    if (!patientId) return cases.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
    
    const filtered = cases.filter(c => {
      if (c.patientId === patientId) return true;
      if ((patientId === 'user_patient_1' || patientId === 'alex_patient') &&
          (c.patientId === 'user_patient_1' || c.patientId === 'alex_patient')) {
        return true;
      }
      return false;
    });

    return filtered.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
  },



  getDoctorCases(specialty) {
    const cases = this.getCases();
    if (!specialty || specialty === 'General Physician') {
      return cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return cases.filter(c => c.specialty === specialty || c.specialty === 'General Physician').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  createCase(caseData) {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const healthAdvisory = caseData.healthAdvisory || {
      advisoryTitle: `AI Health Advisory Dossier — ${caseData.predictedCondition || 'General Acute Condition'}`,
      disclaimer: '⚠️ AI-Generated Supportive Health Advisory (Informational Guidance — Not an Official Clinical Prescription). Please consult a qualified doctor for official clinical diagnosis.',
      triageCategory: (caseData.riskScore || 75) >= 85 ? '🚨 Immediate Emergency Evaluation Needed' : (caseData.riskScore || 75) >= 65 ? '⚡ Prompt Specialist Consultation Recommended' : '📅 Outpatient Doctor Consultation Advised',
      triageUrgency: (caseData.riskScore || 75) >= 85 ? 'Critical (Level 1)' : (caseData.riskScore || 75) >= 65 ? 'High Priority (Level 2)' : 'Moderate Priority (Level 3)',
      recommendedActionStep: `Schedule clinical evaluation with Dr. ${caseData.specialty || 'Cardiologist'}.`,
      targetSpecialty: `Dr. ${caseData.specialty || 'Cardiologist'}`,
      riskAssessmentSummary: `Calculated Risk Index: ${caseData.riskScore || 75}% (${caseData.riskLevel || 'Moderate'} Risk Level)`,
      monitoringParameters: [
        'Body Temperature & Fever Log (3-4 times daily)',
        'Resting Heart Rate & Pulse Saturation',
        'Blood Pressure Readings (Morning & Evening)',
        'Symptom Progression & Severity Tracker'
      ],
      doctorReviewSummary: `Patient case evaluated by AI engine. Pre-evaluation advisory dossier prepared for Dr. ${caseData.specialty || 'Cardiologist'}.`
    };

    const newCase = {
      id: 'case_' + Date.now(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      healthAdvisory,
      ...caseData
    };
    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));

    apiFetch('/cases', {
      method: 'POST',
      body: JSON.stringify(newCase)
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
      window.dispatchEvent(new Event('casesUpdated'));
    }
    return newCase;
  },

  async getAdvisory(data) {
    const apiRes = await apiFetch('/advisory', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (apiRes) return apiRes;

    const disName = data.predictedDisease || 'General Acute Condition';
    const rLevel = data.riskLevel || 'Moderate';
    const rScore = data.riskScore || 75;
    const spec = data.specialty || 'Cardiologist';

    return {
      advisoryTitle: `AI Health Advisory Dossier — ${disName}`,
      disclaimer: '⚠️ AI-Generated Supportive Health Advisory (Informational Guidance — Not an Official Clinical Prescription). Please consult a qualified doctor for official clinical diagnosis.',
      triageCategory: rScore >= 85 ? '🚨 Immediate Emergency Evaluation Needed' : rScore >= 65 ? '⚡ Prompt Specialist Consultation Recommended' : '📅 Outpatient Doctor Consultation Advised',
      triageUrgency: rScore >= 85 ? 'Critical (Level 1)' : rScore >= 65 ? 'High Priority (Level 2)' : 'Moderate Priority (Level 3)',
      recommendedActionStep: `Schedule clinical evaluation with Dr. ${spec}.`,
      targetSpecialty: `Dr. ${spec}`,
      riskAssessmentSummary: `Calculated Risk Index: ${rScore}% (${rLevel} Risk Level)`,
      monitoringParameters: [
        'Body Temperature & Fever Log (3-4 times daily)',
        'Resting Heart Rate & Pulse Saturation',
        'Blood Pressure Readings (Morning & Evening)',
        'Symptom Progression & Severity Tracker'
      ],
      doctorReviewSummary: `Patient case evaluated by AI engine for ${disName}. Pre-evaluation advisory dossier prepared for Dr. ${spec}.`
    };
  },

  getSuggestions() {

    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
  },

  getCaseSuggestions(caseId) {
    const suggestions = this.getSuggestions();
    return suggestions.filter(s => s.caseId === caseId || s.caseId === String(caseId));
  },

  getDoctorHistory(doctorId) {
    const suggestions = this.getSuggestions();
    const cases = this.getCases();
    
    const doctorSuggs = suggestions.filter(s => s.doctorId === doctorId || !doctorId);
    
    return doctorSuggs.map(s => {
      const caseInfo = cases.find(c => c.id === s.caseId || c._id === s.caseId);
      return {
        ...s,
        caseInfo
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getReportCards(patientId) {
    apiFetch(`/reports${patientId ? `?patientId=${patientId}` : ''}`).then(reports => {
      if (reports && Array.isArray(reports)) {
        localStorage.setItem('medi_ai_report_cards', JSON.stringify(reports));
      }
    });
    const reports = JSON.parse(localStorage.getItem('medi_ai_report_cards') || '[]');
    if (patientId) {
      return reports.filter(r => r.patientId === patientId);
    }
    return reports;
  },

  addDoctorSuggestion(suggestionData) {
    const suggestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
    const newSuggestion = {
      id: 'sug_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...suggestionData
    };
    suggestions.unshift(newSuggestion);
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));

    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const updatedCases = cases.map(c => {
      if (c.id === suggestionData.caseId || c._id === suggestionData.caseId) {
        return { ...c, status: 'Reviewed' };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(updatedCases));

    apiFetch('/suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestionData)
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CASES_UPDATED_EVENT));
      window.dispatchEvent(new Event('casesUpdated'));
    }
    return newSuggestion;
  }

};



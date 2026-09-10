/**
 * MedAssist AI API Client
 * Connects medical_assist React Frontend with FastAPI backend and MongoDB Atlas.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('medassist_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- Auth ---
  async signup(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('Connection timed out. Please check backend server and MongoDB Atlas access.');
      }
      throw err;
    }
  },

  async login(email, password, role) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid email or password');
      }
      return data;
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('Connection timed out. Please check backend server and MongoDB Atlas access.');
      }
      throw err;
    }
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching user profile');
    }
    return data;
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed updating profile');
    }
    return data;
  },

  // --- Diagnostics & AI Model ---
  async predictDisease(symptomPayload) {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(symptomPayload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Prediction failed');
    }
    return data;
  },

  async getRecommendations(disease, riskLevel) {
    const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ disease, risk_level: riskLevel })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching recommendations');
    }
    return data;
  },

  // --- Analytics & Directory ---
  async getAnalytics() {
    const res = await fetch(`${API_BASE_URL}/api/analytics`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching analytics');
    }
    return data;
  },

  async getDoctors() {
    const res = await fetch(`${API_BASE_URL}/api/doctors`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching doctors');
    }
    return data;
  },

  async getPatients() {
    const res = await fetch(`${API_BASE_URL}/api/patients`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching patient records');
    }
    return data;
  },

  // --- Appointments ---
  async bookAppointment(appointmentData) {
    const res = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to book appointment');
    }
    return data;
  },

  async getAppointments(email, role) {
    const res = await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(email)}?role=${encodeURIComponent(role)}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed fetching appointments');
    }
    return data;
  },

  async updateAppointment(apptId, updateData) {
    const res = await fetch(`${API_BASE_URL}/api/appointments/${apptId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed updating appointment');
    }
    return data;
  }
};

import { apiFetch } from './client'

export async function fetchPatientProfile() {
  return apiFetch('/patient/profile')
}

export async function updatePatientProfile(profile) {
  return apiFetch('/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export async function fetchMedicalHistory() {
  return apiFetch('/patient/history')
}

export async function addMedicalHistory(entry) {
  return apiFetch('/patient/history', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export async function deleteMedicalHistory(id) {
  return apiFetch(`/patient/history/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchPatientSymptoms() {
  return apiFetch('/patient/symptoms')
}

export async function searchSymptoms(query) {
  return apiFetch(`/symptoms/search?q=${encodeURIComponent(query)}`)
}

export async function addPatientSymptoms(payload) {
  return apiFetch('/patient/symptoms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deletePatientSymptom(id) {
  return apiFetch(`/patient/symptoms/${id}`, {
    method: 'DELETE',
  })
}

export async function updateMedicalHistory(id, entry) {
  return apiFetch(`/patient/history/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  })
}

export async function updatePatientSymptom(id, payload) {
  return apiFetch(`/patient/symptoms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function runDiseasePrediction(payload) {
  return apiFetch('/patient/prediction', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitPredictionFeedback(payload) {
  return apiFetch('/provider/prediction/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function runRiskAssessment(payload) {
  return apiFetch('/patient/risk', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchRecommendations() {
  return apiFetch('/patient/recommendations')
}

export async function fetchPredictionRecommendations(predictionId) {
  return apiFetch(`/patient/predictions/${predictionId}/recommendations`)
}

export async function reviewRecommendation(payload) {
  return apiFetch('/provider/recommendations/review', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchReports() {
  return apiFetch('/patient/reports')
}

export async function updatePatientSettings(settings) {
  return apiFetch('/patient/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

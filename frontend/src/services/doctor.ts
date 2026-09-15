import api from "./api";

export const getDoctorSummary = async () => {
  const response = await api.get("/doctor/summary");
  return response.data;
};

export const getAssignedPatients = async () => {
  const response = await api.get("/doctor/patients");
  return response.data;
};

export const getPatientProfile = async (
  patientId: number
) => {
  const response = await api.get(
    `/doctor/patient/${patientId}`
  );

  return response.data;
};

export const getPatientSymptoms = async (
  patientId: number
) => {
  const response = await api.get(
    `/doctor/patient/${patientId}/symptoms`
  );

  return response.data;
};

export const getPatientPredictions = async (
  patientId: number
) => {
  const response = await api.get(
    `/doctor/patient/${patientId}/predictions`
  );

  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await api.get("/doctor/profile");
  return response.data;
};


/* =====================================================
   Patient Health Risk Report
===================================================== */

export const getPatientHealthRiskReport = async (
  predictionId: number
) => {
  const response = await api.get(
    `/prediction/${predictionId}/health-report`
  );

  return response.data;
};

export const getDoctorReports = async () => {
  const response = await api.get("/reports/doctor");
  return response.data;
};
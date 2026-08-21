import api from "./api";

// Get all assignments
export const getAssignments = async () => {
  const response = await api.get("/admin/assignments");
  return response.data;
};

// Get all doctors
export const getDoctors = async () => {
  const response = await api.get("/admin/doctors");
  return response.data;
};

// Get all patients
export const getPatients = async () => {
  const response = await api.get("/admin/patients");
  return response.data;
};

// Create assignment
export const assignPatient = async (
  doctor_id: number,
  patient_id: number
) => {
  const response = await api.post("/admin/assign", {
    doctor_id,
    patient_id,
  });

  return response.data;
};

// Delete assignment
export const deleteAssignment = async (
  assignmentId: number
) => {
  const response = await api.delete(
    `/admin/assignment/${assignmentId}`
  );

  return response.data;
};
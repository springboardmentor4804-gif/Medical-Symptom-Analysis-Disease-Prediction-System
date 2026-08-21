import api from "./api";

// ============================================
// ADMIN DASHBOARD
// ============================================

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};


// ============================================
// DOCTORS
// ============================================

export const getDoctors = async () => {
  const response = await api.get("/admin/doctors");
  return response.data;
};


export interface CreateDoctorData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}


export const createDoctor = async (
  data: CreateDoctorData
) => {
  const response = await api.post(
    "/admin/create-doctor",
    {
      ...data,
      role: "doctor",
    }
  );

  return response.data;
};


export const deleteDoctor = async (
  doctorId: number
) => {
  const response = await api.delete(
    `/admin/doctor/${doctorId}`
  );

  return response.data;
};


// ============================================
// PATIENTS
// ============================================

export const getPatients = async () => {
  const response = await api.get("/admin/patients");
  return response.data;
};


// ============================================
// ASSIGNMENTS
// ============================================

export interface AssignmentData {
  doctor_id: number;
  patient_id: number;
}


export const assignPatient = async (
  data: AssignmentData
) => {
  const response = await api.post(
    "/admin/assign",
    data
  );

  return response.data;
};


export const getAssignments = async () => {
  const response = await api.get(
    "/admin/assignments"
  );

  return response.data;
};


export const deleteAssignment = async (
  assignmentId: number
) => {
  const response = await api.delete(
    `/admin/assignment/${assignmentId}`
  );

  return response.data;
};

// ============================================
// ADMIN PROFILE
// ============================================

export interface AdminProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface AdminProfileUpdate {
  full_name: string;
  email: string;
}

export const getAdminProfile = async () => {
  const response = await api.get("/admin/profile");
  return response.data;
};

export const updateAdminProfile = async (
  data: AdminProfileUpdate
) => {
  const response = await api.put(
    "/admin/profile",
    data
  );

  return response.data;
};

// ============================================
// ADMIN SETTINGS
// ============================================

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export const changeAdminPassword = async (
  data: ChangePasswordData
) => {
  const response = await api.put(
    "/admin/change-password",
    data
  );

  return response.data;
};
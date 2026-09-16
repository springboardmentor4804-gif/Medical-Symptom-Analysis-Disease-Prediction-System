import api from "./api";

// Create Caretaker Profile
export const createCaretakerProfile = async (profileData) => {

    const response = await api.post(
        "/caretaker/profile",
        profileData
    );

    return response.data;

};

// Get Caretaker Profile
export const getCaretakerProfile = async () => {

    const response = await api.get(
        "/caretaker/profile"
    );

    return response.data;

};

// Update Caretaker Profile
export const updateCaretakerProfile = async (profileData) => {

    const response = await api.put(
        "/caretaker/profile",
        profileData
    );

    return response.data;

};



export const getAssignedPatients = async () => {

    const response = await api.get(
        "/caretaker/patients"
    );

    return response.data;

};


// Get details of an assigned patient
export const getPatientDetails = async (patientUserId) => {
    const response = await api.get(`/caretaker/patients/${patientUserId}`);
    return response.data;
};

// Get Caretaker Analytics
export const getCaretakerAnalytics = async () => {
    const response = await api.get("/caretaker/analytics");
    return response.data;
};

// Create Clinical Care Plan
export const createCarePlan = async (planData) => {
    const response = await api.post("/caretaker/care-plans", planData);
    return response.data;
};

// Get Care Plans
export const getCarePlans = async (patientId = null) => {
    const url = patientId ? `/caretaker/care-plans?patient_id=${patientId}` : "/caretaker/care-plans";
    const response = await api.get(url);
    return response.data;
};

// Delete Care Plan
export const deleteCarePlan = async (planId) => {
    const response = await api.delete(`/caretaker/care-plans/${planId}`);
    return response.data;
};

// Download Care Plan PDF
export const downloadCarePlanPdf = async (planId, patientName = "Patient") => {
    const response = await api.get(`/caretaker/care-plans/${planId}/pdf`, {
        responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CarePlan_${patientName.replace(/\s+/g, '_')}_${planId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// Get Caretaker Triage Queue
export const getCaretakerTriageQueue = async () => {
    const response = await api.get("/caretaker/triage-queue");
    return response.data;
};




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

    const response = await api.get(
        `/caretaker/patients/${patientUserId}`
    );

    return response.data;
};


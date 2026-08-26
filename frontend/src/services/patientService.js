import api from "./api";

// Create Patient Profile
export const createPatientProfile = async (profileData) => {
    const response = await api.post("/patient/profile", profileData);
    return response.data;
};

// update patient profile
export const updatePatientProfile = async (profileData) => {
    const response = await api.put("/patient/profile", profileData);
    return response.data;
};

// Get Patient Profile
export const getPatientProfile = async () => {
    const response = await api.get("/patient/profile");
    return response.data;
};



// Get Available Symptoms
export const getAvailableSymptoms = async () => {
    const response = await api.get("/patient/available-symptoms");
    return response.data;
};

// add patient symptoms
export const addPatientSymptom = async (symptomData) => {

    const response = await api.post(
        "/patient/symptoms",
        symptomData
    );

    return response.data;

};


// Get Saved Patient Symptoms
export const getPatientSymptoms = async () => {

    const response = await api.get("/patient/symptoms");

    return response.data;

};

// Delete Patient Symptom
export const deletePatientSymptom = async (symptomId) => {

    const response = await api.delete(
        `/patient/symptoms/${symptomId}`
    );

    return response.data;

};


// Predict Disease
export const predictDisease = async (symptoms) => {

    const response = await api.post(
        "/patient/predict-disease",
        {
            symptoms
        }
    );

    return response.data;

};


// Get Disease Prediction History
export const getPatientPredictions = async () => {
    const response = await api.get(
        "/patient/predictions"
    );

    return response.data;
};


// Get Personalized Recommendations
export const getPatientRecommendations = async () => {
    const response = await api.get(
        "/patient/recommendations"
    );

    return response.data;
};



// Patient Risk Assessment
export const assessPatientRisk = async (riskData) => {
    const response = await api.post(
        "/patient/risk-assessment",
        riskData
    );

    return response.data;
};


// Get Patient Risk Assessment History
export const getPatientRiskAssessments = async () => {
    const response = await api.get(
        "/patient/risk-assessments"
    );

    return response.data;
};


// Get Patient Reports
export const getPatientReports = async () => {
    const response = await api.get(
        "/patient/reports"
    );

    return response.data;
};


// Upload Patient Report
export const uploadPatientReport = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
        "/patient/reports",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;
};


// Download Patient Report
export const downloadPatientReport = async (reportId, fileName) => {
    const response = await api.get(
        `/patient/reports/${reportId}/download`,
        { responseType: "blob" }
    );

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "report";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};


// Delete Patient Report
export const deletePatientReport = async (reportId) => {
    const response = await api.delete(
        `/patient/reports/${reportId}`
    );

    return response.data;
};


export const getCaretakers = async () => {

    const response = await api.get("/caretaker/list");

    return response.data;

};


export const selectCaretaker = async (caretaker_user_id) => {

    const response = await api.post(

        "/patient/select-caretaker",

        {

            caretaker_user_id

        }

    );

    return response.data;

};


// Get Treatment Suggestions
export const getTreatmentSuggestions = async () => {
    const response = await api.get(
        "/patient/treatment-suggestions"
    );
    return response.data;
};


// Get Health Advisory
export const getHealthAdvisory = async () => {
    const response = await api.get(
        "/patient/health-advisory"
    );
    return response.data;
};


// Download Disease Prediction Report (PDF)
export const downloadPredictionReport = async () => {
    const response = await api.get(
        "/patient/prediction-report/pdf",
        { responseType: "blob" }
    );

    const blob = new Blob(
        [response.data],
        { type: "application/pdf" }
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "MedAssist_Prediction_Report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
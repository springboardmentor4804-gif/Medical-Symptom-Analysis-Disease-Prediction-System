import api from "./api";


// Get Analytics Summary
export const getAnalyticsSummary = async () => {
    const response = await api.get("/analytics/summary");
    return response.data;
};


// Get Disease Distribution
export const getDiseaseDistribution = async () => {
    const response = await api.get("/analytics/disease-distribution");
    return response.data;
};


// Get Symptom Frequency
export const getSymptomFrequency = async () => {
    const response = await api.get("/analytics/symptom-frequency");
    return response.data;
};


// Get Risk Distribution
export const getRiskDistribution = async () => {
    const response = await api.get("/analytics/risk-distribution");
    return response.data;
};


// Get Monthly Trends
export const getMonthlyTrends = async () => {
    const response = await api.get("/analytics/monthly-trends");
    return response.data;
};


// Get Recent Predictions
export const getRecentPredictions = async () => {
    const response = await api.get("/analytics/recent-predictions");
    return response.data;
};

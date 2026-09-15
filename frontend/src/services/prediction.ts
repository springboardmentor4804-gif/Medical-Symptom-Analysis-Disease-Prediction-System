import api from "./api";


/* =====================================================
   Manual Prediction
===================================================== */

export interface PredictionData {
  predicted_disease: string;
  confidence_score: number;
  risk_level: string;
  recommendation: string;
}


/* =====================================================
   AI Prediction Request
===================================================== */

export interface AIPredictionRequest {
  symptoms: string[];
}


/* =====================================================
   Top Prediction
===================================================== */

export interface TopPrediction {
  disease: string;
  probability: number;
}


/* =====================================================
   AI Prediction Response
===================================================== */

export interface AIPredictionResponse {
  message: string;

  prediction_id: number;

  disease: string;

  confidence: number;

  confidence_level: string;

  risk_score: number;

  risk_level: string;

  risk_factors: string[];

  severity_score: number;

  severity_level: string;

  severity_factors: string[];

  recommendation: string;

recommendations: {
  treatment_suggestions: string[];
  preventive_advice: string[];
  lifestyle_advice: string[];
  warning_signs: string[];
  advisory: string;
};

top_predictions: TopPrediction[];

symptoms: string[];

  created_at: string;
}


/* =====================================================
   Health Risk Report Types
===================================================== */

export interface RiskAssessment {
  score: number;
  level: string;
  factors: string[];
}


export interface SeverityAnalysis {
  score: number;
  level: string;
  factors: string[];
}


export interface HealthRiskPrediction {
  disease: string;
  confidence: number;
  confidence_level: string;
}

export interface HealthRecommendations {
  treatment_suggestions: string[];
  preventive_advice: string[];
  lifestyle_advice: string[];
  warning_signs: string[];
  advisory: string;
}

export interface HealthRiskReport {
  report_id: number;

  patient_id: number;

  generated_at: string;

  symptoms: string[];

  prediction: HealthRiskPrediction;

  top_predictions: TopPrediction[];

  risk_assessment: RiskAssessment;

  severity_analysis: SeverityAnalysis;

  recommendation: string;

  recommendations: HealthRecommendations;

  disclaimer: string;
}


/* =====================================================
   Manual Prediction
===================================================== */

export const createPrediction = async (
  data: PredictionData
) => {

  const token = localStorage.getItem("token");

  const response = await api.post(
    "/prediction",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   AI Disease Prediction
===================================================== */

export const predictDisease = async (
  data: AIPredictionRequest
): Promise<AIPredictionResponse> => {

  const token = localStorage.getItem("token");

  const response = await api.post(
    "/prediction/ai",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Update AI Disease Prediction
===================================================== */

export const updateAIPrediction = async (
  id: number,
  symptoms: string[]
) => {

  const token = localStorage.getItem("token");

  const response = await api.put(
    `/prediction/${id}/ai`,
    {
      symptoms,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Latest Prediction
===================================================== */

export const getLatestPrediction = async () => {

  const token = localStorage.getItem("token");

  const response = await api.get(
    "/prediction",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Prediction History
===================================================== */

export const getPredictionHistory = async () => {

  const token = localStorage.getItem("token");

  const response = await api.get(
    "/prediction/history",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Update Prediction
===================================================== */

export const updatePrediction = async (
  id: number,
  data: PredictionData
) => {

  const token = localStorage.getItem("token");

  const response = await api.put(
    `/prediction/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Delete Prediction
===================================================== */

export const deletePrediction = async (
  id: number
) => {

  const token = localStorage.getItem("token");

  const response = await api.delete(
    `/prediction/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/* =====================================================
   Health Risk Report
===================================================== */

export const getHealthRiskReport = async (
  predictionId: number
): Promise<HealthRiskReport> => {

  const token = localStorage.getItem("token");

  const response = await api.get(
    `/prediction/${predictionId}/health-report`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
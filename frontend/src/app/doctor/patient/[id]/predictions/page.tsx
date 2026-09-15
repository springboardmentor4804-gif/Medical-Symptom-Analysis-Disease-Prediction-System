"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";

import {
  getPatientProfile,
  getPatientPredictions,
} from "@/services/doctor";

interface Prediction {
  id: number;
  symptom_id: number | null;
  patient_id: number;

  predicted_disease: string;
  confidence: string | number;

  risk_score: number | null;
  risk_level: string | null;

  severity_score: number | null;
  severity_level: string | null;

  recommendation: string | null;

  created_at: string;
}

interface Patient {
  id: number;
  full_name: string;
  email: string;
}

export default function PatientPredictionsPage() {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadPredictions();
    }
  }, [id]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError("");

      const patientId = Number(id);

      const [profileData, predictionData] = await Promise.all([
        getPatientProfile(patientId),
        getPatientPredictions(patientId),
      ]);

      setPatient(profileData);
      setPredictions(predictionData);
    } catch (err: any) {
      console.error(err);

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load patient predictions."
        );
      } else {
        setError("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     Risk Badge
  ===================================================== */

  const getRiskClass = (level: string | null) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-300";

      case "High":
        return "bg-orange-100 text-orange-800 border-orange-300";

      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";

      case "Low":
        return "bg-green-100 text-green-800 border-green-300";

      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  /* =====================================================
     Severity Badge
  ===================================================== */

  const getSeverityClass = (level: string | null) => {
    switch (level) {
      case "Severe":
        return "bg-red-100 text-red-800 border-red-300";

      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";

      case "Mild":
        return "bg-blue-100 text-blue-800 border-blue-300";

      case "Minimal":
        return "bg-green-100 text-green-800 border-green-300";

      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  /* =====================================================
     Confidence
  ===================================================== */

  const formatConfidence = (
    confidence: string | number
  ) => {
    const value = Number(confidence);

    if (Number.isNaN(value)) {
      return "-";
    }

    return `${value}%`;
  };

  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-xl font-semibold text-blue-600 animate-pulse">
            Loading AI Predictions...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
     Error
  ===================================================== */

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-xl bg-red-100 px-6 py-4 text-red-700 shadow">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            🤖 AI Prediction History
          </h1>

          <p className="mt-2 text-gray-500">
            Review AI-generated disease predictions and
            health risk assessments for this patient.
          </p>
        </div>

        {/* =================================================
            PATIENT INFORMATION
        ================================================= */}

        {patient && (
          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Patient
                </p>

                <h2 className="text-2xl font-bold text-slate-800">
                  {patient.full_name}
                </h2>

                <p className="mt-1 text-gray-500">
                  {patient.email}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-5 py-3 text-center">
                <p className="text-sm text-gray-500">
                  Total Predictions
                </p>

                <p className="text-2xl font-bold text-blue-700">
                  {predictions.length}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* =================================================
            NO PREDICTIONS
        ================================================= */}

        {predictions.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-md">

            <div className="text-5xl">
              🤖
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              No AI Predictions Found
            </h2>

            <p className="mt-2 text-gray-500">
              This patient does not have any AI prediction
              history yet.
            </p>

          </div>

        ) : (

          /* =================================================
             PREDICTION LIST
          ================================================= */

          <div className="space-y-6">

            {predictions.map((prediction) => (

              <div
                key={prediction.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition hover:shadow-lg"
              >

                {/* =========================================
                   Prediction Header
                ========================================= */}

                <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Prediction #{prediction.id}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-800">
                      {prediction.predicted_disease ||
                        "Unknown Disease"}
                    </h2>

                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-sm text-gray-500">
                      Generated On
                    </p>

                    <p className="font-semibold text-gray-700">
                      {prediction.created_at
                        ? new Date(
                            prediction.created_at
                          ).toLocaleString()
                        : "-"}
                    </p>

                  </div>

                </div>

                {/* =========================================
                   Main Statistics
                ========================================= */}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                  {/* Confidence */}

                  <div className="rounded-xl bg-blue-50 p-5">

                    <p className="text-sm text-gray-500">
                      Prediction Confidence
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-700">
                      {formatConfidence(
                        prediction.confidence
                      )}
                    </p>

                  </div>

                  {/* Risk Score */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Risk Score
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {prediction.risk_score !== null
                        ? prediction.risk_score
                        : "-"}
                    </p>

                  </div>

                  {/* Severity Score */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Severity Score
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {prediction.severity_score !== null
                        ? prediction.severity_score
                        : "-"}
                    </p>

                  </div>

                  {/* Symptom ID */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Symptom Record
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {prediction.symptom_id ?? "-"}
                    </p>

                  </div>

                </div>

                {/* =========================================
                   Risk + Severity
                ========================================= */}

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Risk */}

                  <div className="rounded-xl border p-5">

                    <p className="text-sm text-gray-500">
                      Health Risk Level
                    </p>

                    <div className="mt-3">

                      <span
                        className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getRiskClass(
                          prediction.risk_level
                        )}`}
                      >
                        {prediction.risk_level || "Unknown"}
                      </span>

                    </div>

                  </div>

                  {/* Severity */}

                  <div className="rounded-xl border p-5">

                    <p className="text-sm text-gray-500">
                      Severity Level
                    </p>

                    <div className="mt-3">

                      <span
                        className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getSeverityClass(
                          prediction.severity_level
                        )}`}
                      >
                        {prediction.severity_level || "Not Available"}
                      </span>

                    </div>

                  </div>

                </div>

                {/* =========================================
                   Recommendation
                ========================================= */}

                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                  <p className="text-sm font-semibold text-blue-800">
                    💡 AI Recommendation
                  </p>

                  <p className="mt-2 leading-7 text-gray-700">
                    {prediction.recommendation ||
                      "No recommendation available."}
                  </p>

                </div>

                {/* =========================================
                   Medical Notice
                ========================================= */}

                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                  <p className="text-sm font-semibold text-yellow-800">
                    ⚠️ Medical Notice
                  </p>

                  <p className="mt-1 text-sm leading-6 text-yellow-700">
                    This is an AI-generated prediction and
                    not a confirmed medical diagnosis.
                    Clinical evaluation should be performed
                    by a qualified healthcare professional.
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </DashboardLayout>
  );
}
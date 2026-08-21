"use client";

import { useEffect, useState } from "react";
import { getSummaryReport } from "@/services/report";

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await getSummaryReport();
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-semibold">
        Loading Report...
      </div>
    );
  }

  const profile = report?.profile;
const symptom =
  report?.symptoms?.length > 0
    ? report.symptoms[0]
    : null;

const prediction =
  report?.predictions?.length > 0
    ? report.predictions[0]
    : null;
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-4xl font-bold text-blue-700 mb-8">
            Patient Health Report
          </h1>

          {/* Patient Information */}

          <div className="mb-8">

            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
              Patient Information
            </h2>

            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <p><strong>Name:</strong> {profile.full_name}</p>

<p><strong>Date of Birth:</strong>{" "}
  {profile.date_of_birth || "Not provided"}
</p>
                <p><strong>Gender:</strong> {profile.gender}</p>

                <p><strong>Blood Group:</strong> {profile.blood_group}</p>

                <p><strong>Phone:</strong> {profile.phone}</p>
                <p><strong>Address:</strong> {profile.address}</p>

              </div>
            ) : (
              <p>No patient profile found.</p>
            )}

          </div>

          {/* Latest Symptoms */}

          <div className="mb-8">

            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
              Latest Symptoms
            </h2>

            {symptom ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <p><strong>Fever:</strong> {symptom.fever}</p>

                <p><strong>Cough:</strong> {symptom.cough}</p>

                <p><strong>Headache:</strong> {symptom.headache}</p>

                <p><strong>Fatigue:</strong> {symptom.fatigue}</p>

                <p><strong>Chest Pain:</strong> {symptom.chest_pain}</p>

                <p><strong>Shortness of Breath:</strong> {symptom.shortness_of_breath}</p>

                <p><strong>Blood Pressure:</strong> {symptom.blood_pressure}</p>

                <p><strong>Heart Rate:</strong> {symptom.heart_rate}</p>

                <p><strong>Blood Sugar:</strong> {symptom.blood_sugar}</p>

                <p><strong>Temperature:</strong> {symptom.temperature}</p>

                <div className="md:col-span-2">
                  <p><strong>Notes:</strong></p>
                  <p>{symptom.notes}</p>
                </div>

              </div>
            ) : (
              <p>No symptom records found.</p>
            )}

          </div>

          {/* Latest Prediction */}

          <div className="mb-8">

            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
              Latest Prediction
            </h2>

            {prediction ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <p>
                  <strong>Disease:</strong>{" "}
                  {prediction.predicted_disease}
                </p>

                <p>
                  <strong>Confidence:</strong>{" "}
                 {prediction.confidence}%
                </p>

                <p>
                  <strong>Risk Level:</strong>{" "}
                  <span
                    className={`px-3 py-1 rounded-full text-white ${
                      prediction.risk_level === "High"
                        ? "bg-red-600"
                        : prediction.risk_level === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-600"
                    }`}
                  >
                    {prediction.risk_level}
                  </span>
                </p>

                <div className="md:col-span-2">
                  <p><strong>Recommendation:</strong></p>
                  <p>{prediction.recommendation}</p>
                </div>

              </div>
            ) : (
              <p>No prediction available.</p>
            )}

          </div>

          {/* Health Summary */}

          <div>

            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
              Overall Health Summary
            </h2>

            {prediction ? (
              <div className="bg-slate-50 rounded-lg p-5">

                <p>
                  <strong>Current Disease:</strong>{" "}
                  {prediction.predicted_disease}
                </p>

                <p>
                  <strong>Current Risk:</strong>{" "}
                  {prediction.risk_level}
                </p>

                <p className="mt-4">
                  <strong>Doctor Recommendation:</strong>
                </p>

                <p>{prediction.recommendation}</p>

              </div>
            ) : (
              <p>No health summary available.</p>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
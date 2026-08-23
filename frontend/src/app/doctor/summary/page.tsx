"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import api from "@/services/api";

interface SummaryData {
  profile: any;
  symptoms: any[];
  predictions: any[];
}

export default function SummaryPage() {
  const [summary, setSummary] =
    useState<SummaryData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const token =
          localStorage.getItem("token");

        const response = await api.get(
          "/reports/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSummary(response.data);

      } catch (error) {
        console.error(
          "Failed to load health summary:",
          error
        );

        setError(
          "Unable to load health summary."
        );

      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <p className="mt-4 text-lg font-medium text-gray-600">
              Loading Health Summary...
            </p>

          </div>

        </div>
      </DashboardLayout>
    );
  }


  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">

            <div className="text-4xl">
              ⚠️
            </div>

            <h2 className="mt-3 text-xl font-bold text-red-600">
              Unable to Load Summary
            </h2>

            <p className="mt-2 text-gray-500">
              {error}
            </p>

          </div>

        </div>
      </DashboardLayout>
    );
  }


  const profile =
    summary?.profile;

  const symptoms =
    summary?.symptoms ?? [];

  const predictions =
    summary?.predictions ?? [];


  const latestPrediction =
    predictions.length > 0
      ? predictions[0]
      : null;


  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            📊 Health Summary
          </h1>

          <p className="mt-1 text-gray-500">
            Overview of your health information,
            symptoms and AI predictions.
          </p>

        </div>


        {/* =====================================================
            PROFILE
        ===================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
              👤
            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                {profile?.full_name ||
                  "Patient"}
              </h2>

              <p className="text-sm text-gray-500">
                {profile?.email || ""}
              </p>

            </div>

          </div>

        </div>


        {/* =====================================================
            ANALYTICS CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Total Symptoms
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-700">
              {symptoms.length}
            </h2>

          </div>


          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Total Predictions
            </p>

            <h2 className="mt-2 text-3xl font-bold text-indigo-700">
              {predictions.length}
            </h2>

          </div>


          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Latest Disease
            </p>

            <h2 className="mt-2 text-xl font-bold text-gray-900">
              {latestPrediction?.predicted_disease ||
                "No prediction"}
            </h2>

          </div>


          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Risk Level
            </p>

            <h2 className="mt-2 text-2xl font-bold text-red-600">
              {latestPrediction?.risk_level ||
                "Not available"}
            </h2>

          </div>

        </div>


        {/* =====================================================
            LATEST PREDICTION
        ===================================================== */}

        {latestPrediction && (

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <h2 className="text-xl font-bold text-gray-900">
              🧠 Latest AI Prediction
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

              <div className="rounded-xl bg-blue-50 p-5">

                <p className="text-sm text-gray-500">
                  Predicted Disease
                </p>

                <p className="mt-2 text-lg font-bold text-blue-700">
                  {latestPrediction.predicted_disease}
                </p>

              </div>


              <div className="rounded-xl bg-indigo-50 p-5">

                <p className="text-sm text-gray-500">
                  Confidence
                </p>

                <p className="mt-2 text-lg font-bold text-indigo-700">
                  {latestPrediction.confidence}%
                </p>

              </div>


              <div className="rounded-xl bg-red-50 p-5">

                <p className="text-sm text-gray-500">
                  Risk Level
                </p>

                <p className="mt-2 text-lg font-bold text-red-600">
                  {latestPrediction.risk_level}
                </p>

              </div>

            </div>


            {latestPrediction.recommendation && (

              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">

                <h3 className="font-bold text-green-800">
                  💡 Recommendation
                </h3>

                <p className="mt-2 leading-7 text-green-700">
                  {latestPrediction.recommendation}
                </p>

              </div>

            )}

          </div>

        )}


        {/* =====================================================
            RECENT PREDICTIONS
        ===================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                📈 Prediction Trends
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Recent AI-generated disease predictions.
              </p>

            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {predictions.length} Records
            </span>

          </div>


          {predictions.length === 0 ? (

            <div className="mt-5 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              No prediction history available.
            </div>

          ) : (

            <div className="mt-5 overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b text-left">

                    <th className="p-3 text-sm text-gray-500">
                      Disease
                    </th>

                    <th className="p-3 text-sm text-gray-500">
                      Confidence
                    </th>

                    <th className="p-3 text-sm text-gray-500">
                      Risk
                    </th>

                    <th className="p-3 text-sm text-gray-500">
                      Date
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {predictions
                    .slice(0, 10)
                    .map((prediction) => (

                      <tr
                        key={prediction.id}
                        className="border-b border-gray-100"
                      >

                        <td className="p-3 font-semibold text-gray-800">
                          🧠{" "}
                          {prediction.predicted_disease}
                        </td>

                        <td className="p-3 text-blue-700">
                          {prediction.confidence}%
                        </td>

                        <td className="p-3">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                            {prediction.risk_level}
                          </span>

                        </td>

                        <td className="p-3 text-sm text-gray-500">
                          {prediction.created_at
                            ? new Date(
                                prediction.created_at
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =====================================================
            MEDICAL DISCLAIMER
        ===================================================== */}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <h3 className="font-bold text-amber-900">
            ⚠️ Medical Disclaimer
          </h3>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            AI predictions are provided for educational
            and informational purposes only. They are not
            confirmed medical diagnoses and should not
            replace evaluation by a qualified healthcare
            professional.
          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}
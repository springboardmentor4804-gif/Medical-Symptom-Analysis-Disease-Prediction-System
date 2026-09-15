"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import { getPredictionHistory } from "@/services/prediction";

interface Prediction {
  id: number;
  patient_id: number;
  symptom_id: number;

  predicted_disease: string;

  confidence: string | number;

  risk_score: number;
  risk_level: string;

  severity_score: number;
  severity_level: string;

  recommendation: string;

  symptoms: string[];

  created_at: string;
}

export default function HealthAnalytics() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getPredictionHistory();

      setPredictions(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load analytics:",
        error
      );
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const total = predictions.length;

    const highRisk = predictions.filter(
      (item) =>
        item.risk_level === "High" ||
        item.risk_level === "Critical"
    ).length;

    const diseases = new Set(
      predictions.map(
        (item) => item.predicted_disease
      )
    ).size;

    const averageConfidence =
      total > 0
        ? predictions.reduce(
            (sum, item) =>
              sum +
              Number(item.confidence || 0),
            0
          ) / total
        : 0;

    const diseaseCounts: Record<
      string,
      number
    > = {};

    predictions.forEach((item) => {
      const disease =
        item.predicted_disease ||
        "Unknown";

      diseaseCounts[disease] =
        (diseaseCounts[disease] || 0) + 1;
    });

    const riskCounts: Record<
      string,
      number
    > = {
      Low: 0,
      Moderate: 0,
      High: 0,
      Critical: 0,
    };

    predictions.forEach((item) => {
      const risk =
        item.risk_level;

      if (risk in riskCounts) {
        riskCounts[risk]++;
      }
    });

    const topDiseases =
      Object.entries(diseaseCounts)
        .sort(
          ([, a], [, b]) => b - a
        )
        .slice(0, 5);

    const maxDiseaseCount =
      topDiseases.length > 0
        ? Math.max(
            ...topDiseases.map(
              ([, count]) => count
            )
          )
        : 1;

    return {
      total,
      highRisk,
      diseases,
      averageConfidence,
      riskCounts,
      topDiseases,
      maxDiseaseCount,
    };
  }, [predictions]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <p className="text-gray-500">
          Loading health analytics...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">

      {/* =====================================================
          TITLE
      ===================================================== */}

      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Health Analytics
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your AI prediction history
          and health trends.
        </p>
      </div>


      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Predictions */}

        <div className="rounded-2xl bg-white p-5 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total Predictions
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-800">
                {analytics.total}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Brain
                size={24}
                className="text-purple-600"
              />
            </div>

          </div>

        </div>


        {/* High Risk */}

        <div className="rounded-2xl bg-white p-5 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                High / Critical Risk
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {analytics.highRisk}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle
                size={24}
                className="text-red-600"
              />
            </div>

          </div>

        </div>


        {/* Diseases */}

        <div className="rounded-2xl bg-white p-5 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Diseases Detected
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {analytics.diseases}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Activity
                size={24}
                className="text-blue-600"
              />
            </div>

          </div>

        </div>


        {/* Average Confidence */}

        <div className="rounded-2xl bg-white p-5 shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Avg. Confidence
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {analytics.averageConfidence.toFixed(
                  1
                )}
                %
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp
                size={24}
                className="text-green-600"
              />
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          DISEASE DISTRIBUTION
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center gap-3">

            <BarChart3
              size={24}
              className="text-purple-600"
            />

            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Disease Distribution
              </h3>

              <p className="text-sm text-gray-500">
                Most frequently predicted diseases
              </p>
            </div>

          </div>

          <div className="mt-6 space-y-5">

            {analytics.topDiseases.length === 0 ? (

              <p className="text-sm text-gray-500">
                No prediction data available.
              </p>

            ) : (

              analytics.topDiseases.map(
                ([disease, count]) => {

                  const percentage =
                    (count /
                      analytics.maxDiseaseCount) *
                    100;

                  return (
                    <div key={disease}>

                      <div className="mb-2 flex justify-between">

                        <span className="text-sm font-medium text-gray-700">
                          {disease}
                        </span>

                        <span className="text-sm font-semibold text-gray-800">
                          {count}
                        </span>

                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>


        {/* =================================================
            RISK DISTRIBUTION
        ================================================= */}

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-center gap-3">

            <HeartPulse
              size={24}
              className="text-red-600"
            />

            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Risk Distribution
              </h3>

              <p className="text-sm text-gray-500">
                Distribution of prediction risk levels
              </p>
            </div>

          </div>

          <div className="mt-6 space-y-5">

            {Object.entries(
              analytics.riskCounts
            ).map(
              ([risk, count]) => {

                const percentage =
                  analytics.total > 0
                    ? (count /
                        analytics.total) *
                      100
                    : 0;

                const barClass =
                  risk === "Low"
                    ? "bg-green-500"
                    : risk === "Moderate"
                    ? "bg-yellow-500"
                    : risk === "High"
                    ? "bg-orange-500"
                    : "bg-red-600";

                return (
                  <div key={risk}>

                    <div className="mb-2 flex justify-between">

                      <span className="text-sm font-medium text-gray-700">
                        {risk}
                      </span>

                      <span className="text-sm font-semibold text-gray-800">
                        {count}
                      </span>

                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          RECENT PREDICTIONS
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <div className="flex items-center gap-3">

          <Activity
            size={24}
            className="text-blue-600"
          />

          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Recent Predictions
            </h3>

            <p className="text-sm text-gray-500">
              Latest AI health assessments
            </p>
          </div>

        </div>

        <div className="mt-6 overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr className="border-b border-gray-200">

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Disease
                </th>

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Confidence
                </th>

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Risk
                </th>

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Date
                </th>

              </tr>

            </thead>

            <tbody>

              {predictions
                .slice(0, 5)
                .map((item) => (

                  <tr
                    key={item.id}
                    className="border-b border-gray-100"
                  >

                    <td className="py-4 text-sm font-medium text-gray-800">
                      {item.predicted_disease}
                    </td>

                    <td className="py-4 text-sm text-gray-600">
                      {Number(
                        item.confidence
                      ).toFixed(1)}
                      %
                    </td>

                    <td className="py-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.risk_level ===
                          "Low"
                            ? "bg-green-100 text-green-700"
                            : item.risk_level ===
                              "Moderate"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.risk_level ===
                              "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.risk_level}
                      </span>

                    </td>

                    <td className="py-4 text-sm text-gray-500">
                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}
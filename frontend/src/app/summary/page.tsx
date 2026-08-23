"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import api from "@/services/api";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SummaryData {
  total_patients: number;
  total_predictions: number;
  total_reports: number;
  high_risk_patients: number;
  critical_risk_patients: number;
  average_risk_score: number;
  average_severity_score: number;

  disease_distribution: {
    disease: string;
    count: number;
  }[];

  risk_distribution: {
    level: string;
    count: number;
  }[];

  health_trends: {
    date: string;
    disease: string;
    risk_score: number;
    severity_score: number;
  }[];
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
        const response =
          await api.get("/doctor/summary");
        console.log("DOCTOR SUMMARY API:", response.data);
        setSummary(response.data);
      } catch (error) {
        console.error(
          "Failed to load doctor analytics:",
          error
        );

        setError(
          "Unable to load doctor analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  /* =====================================================
      LOADING
  ===================================================== */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <p className="mt-4 text-lg font-medium text-gray-600">
              Loading Healthcare Analytics...
            </p>

          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
      ERROR
  ===================================================== */

  if (error || !summary) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">

            <div className="text-4xl">
              ⚠️
            </div>

            <h2 className="mt-3 text-xl font-bold text-red-600">
              Analytics Unavailable
            </h2>

            <p className="mt-2 text-gray-500">
              {error ||
                "Unable to load analytics."}
            </p>

          </div>

        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
      CHART DATA
  ===================================================== */

  const healthTrendData =
    summary.health_trends
      .slice()
      .reverse();

  const diseaseChartData =
    summary.disease_distribution
      .slice()
      .sort(
        (a, b) =>
          b.count - a.count
      );

  const riskChartData =
    summary.risk_distribution.filter(
      (item) => item.count > 0
    );

  /* =====================================================
      RISK COLORS
  ===================================================== */

  const riskColors: Record<
    string,
    string
  > = {
    Low: "#22c55e",
    Moderate: "#eab308",
    High: "#f97316",
    Critical: "#ef4444",
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            📊 Healthcare Analytics
          </h1>

          <p className="mt-1 text-gray-500">
            Patient health trends, disease predictions and
            risk analytics.
          </p>

        </div>


        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          {/* Assigned Patients */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Assigned Patients
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-700">
              {summary.total_patients}
            </h2>

          </div>


          {/* Total Predictions */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Total Predictions
            </p>

            <h2 className="mt-2 text-3xl font-bold text-indigo-700">
              {summary.total_predictions}
            </h2>

          </div>


          {/* High Risk */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              High Risk Patients
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {summary.high_risk_patients}
            </h2>

          </div>


          {/* Critical Risk */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Critical Risk Patients
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {summary.critical_risk_patients}
            </h2>

          </div>

        </div>


        {/* =====================================================
            SCORE CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          {/* Reports */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Healthcare Reports
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {summary.total_reports}
            </h2>

          </div>


          {/* Average Risk */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Average Risk Score
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {summary.average_risk_score}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Out of 100
            </p>

          </div>


          {/* Average Severity */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">

            <p className="text-sm font-medium text-gray-500">
              Average Severity Score
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {summary.average_severity_score}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Out of 100
            </p>

          </div>

        </div>


        {/* =====================================================
            DISEASE DISTRIBUTION
        ===================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              🧠 Disease Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Diseases identified across assigned patients.
            </p>

          </div>


          {summary.disease_distribution.length === 0 ? (

            <div className="mt-5 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              No disease data available.
            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {summary.disease_distribution.map(
                (item, index) => {

                  const maxCount =
                    Math.max(
                      ...summary.disease_distribution.map(
                        (disease) =>
                          disease.count
                      ),
                      1
                    );

                  const percentage =
                    (item.count /
                      maxCount) *
                    100;

                  return (

                    <div
                      key={`${item.disease}-${index}`}
                    >

                      <div className="mb-1 flex items-center justify-between">

                        <span className="text-sm font-semibold text-gray-700">
                          {item.disease}
                        </span>

                        <span className="text-sm font-bold text-blue-700">
                          {item.count}
                        </span>

                      </div>


                      <div className="h-3 overflow-hidden rounded-full bg-gray-200">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
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

          )}

        </div>


        {/* =====================================================
            RISK DISTRIBUTION
        ===================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              ⚠️ Risk Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Distribution of prediction risk levels.
            </p>

          </div>


          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {summary.risk_distribution.map(
              (item) => {

                const level =
                  item.level.toLowerCase();

                let style =
                  "bg-gray-50 text-gray-700 border-gray-200";

                if (level === "low") {
                  style =
                    "bg-green-50 text-green-700 border-green-200";
                }

                if (level === "moderate") {
                  style =
                    "bg-yellow-50 text-yellow-700 border-yellow-200";
                }

                if (level === "high") {
                  style =
                    "bg-orange-50 text-orange-700 border-orange-200";
                }

                if (level === "critical") {
                  style =
                    "bg-red-50 text-red-700 border-red-200";
                }

                return (

                  <div
                    key={item.level}
                    className={`rounded-xl border p-5 ${style}`}
                  >

                    <p className="text-sm font-semibold">
                      {item.level}
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {item.count}
                    </p>

                    <p className="mt-1 text-xs">
                      Predictions
                    </p>

                  </div>

                );
              }
            )}

          </div>

        </div>


        {/* =====================================================
            HEALTH TRENDS
        ===================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          {/* Header */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                📈 Health Trends
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Interactive disease prediction and health
                risk analytics.
              </p>

            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {summary.health_trends.length} Records
            </span>

          </div>


          {summary.health_trends.length === 0 ? (

            <div className="mt-5 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              No health trend data available.
            </div>

          ) : (

            <div className="mt-8 space-y-10">


              {/* =================================================
                  CHART 1
                  RISK & SEVERITY TREND
              ================================================= */}

              <div>

                <div className="mb-4">

                  <h3 className="text-lg font-semibold text-gray-800">
                    Risk & Severity Trend
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Risk and severity scores across prediction
                    records.
                  </p>

                </div>


                <div className="h-[380px] w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={healthTrendData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 10,
                        bottom: 10,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(
                            String(value)
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )
                        }
                      />

                      <YAxis
                        domain={[0, 100]}
                        unit="%"
                      />

                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(
                            String(value)
                          ).toLocaleString()
                        }
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="risk_score"
                        name="Risk Score"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="severity_score"
                        name="Severity Score"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* =================================================
                  CHART 2
                  DISEASE FREQUENCY
              ================================================= */}

              <div>

                <div className="mb-4">

                  <h3 className="text-lg font-semibold text-gray-800">
                    Disease Prediction Trend
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Number of times each disease has been
                    predicted.
                  </p>

                </div>


                <div className="h-[400px] w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={diseaseChartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 10,
                        bottom: 80,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="disease"
                        angle={-25}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        label={{
                          value: "Predictions",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="count"
                        name="Predictions"
                        fill="#6366f1"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* =================================================
                  CHART 3
                  RISK DISTRIBUTION PIE
              ================================================= */}

              <div>

                <div className="mb-4">

                  <h3 className="text-lg font-semibold text-gray-800">
                    Risk Level Overview
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Interactive distribution of prediction
                    risk levels.
                  </p>

                </div>


                <div className="h-[400px] w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={riskChartData}
                        dataKey="count"
                        nameKey="level"
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        innerRadius={70}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} ${(
                            (percent ?? 0) *
                            100
                          ).toFixed(0)}%`
                        }
                      >

                        {riskChartData.map(
                          (entry, index) => (

                            <Cell
                              key={`cell-${index}`}
                              fill={
                                riskColors[
                                  entry.level
                                ] ||
                                "#64748b"
                              }
                            />

                          )
                        )}

                      </Pie>

                      <Tooltip />

                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* =================================================
                  RECENT HEALTH RECORDS
              ================================================= */}

              <div>

                <div className="mb-4">

                  <h3 className="text-lg font-semibold text-gray-800">
                    Recent Health Records
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest patient prediction records.
                  </p>

                </div>


                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b text-left">

                        <th className="p-3 text-sm text-gray-500">
                          Date
                        </th>

                        <th className="p-3 text-sm text-gray-500">
                          Disease
                        </th>

                        <th className="p-3 text-sm text-gray-500">
                          Risk Score
                        </th>

                        <th className="p-3 text-sm text-gray-500">
                          Severity Score
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {summary.health_trends
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map(
                          (
                            item,
                            index
                          ) => (

                            <tr
                              key={`${item.date}-${index}`}
                              className="border-b border-gray-100"
                            >

                              <td className="p-3 text-sm text-gray-500">

                                {item.date
                                  ? new Date(
                                      item.date
                                    ).toLocaleDateString()
                                  : "-"}

                              </td>


                              <td className="p-3 font-semibold text-gray-800">

                                🧠{" "}
                                {item.disease}

                              </td>


                              <td className="p-3">

                                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">

                                  {
                                    item.risk_score
                                  }
                                  /100

                                </span>

                              </td>


                              <td className="p-3">

                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">

                                  {
                                    item.severity_score
                                  }
                                  /100

                                </span>

                              </td>

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              </div>

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
            AI-generated analytics are provided for
            educational and informational purposes only.
            They are not medical diagnoses and should not
            replace evaluation by a qualified healthcare
            professional.
          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Brain,
  AlertTriangle,
  Activity,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getDoctorSummary } from "@/services/doctor";

export default function DoctorAnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getDoctorSummary();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center text-xl">
          Loading Analytics...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-red-100 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const diseaseDistribution =
    summary?.disease_distribution ?? [];

  const riskDistribution =
    summary?.risk_distribution ?? [];

  const healthTrends =
    summary?.health_trends ?? [];

  const maxDiseaseCount = Math.max(
    ...diseaseDistribution.map(
      (item: any) => item.count
    ),
    1
  );

  const maxRiskCount = Math.max(
    ...riskDistribution.map(
      (item: any) => item.count
    ),
    1
  );

  /*
   * Prepare data for the line chart.
   *
   * We reverse the data so the chart goes
   * from oldest prediction -> newest prediction.
   */
  const chartData = [...healthTrends]
    .reverse()
    .map((trend: any, index: number) => ({
      index: index + 1,
      date: trend.date,
      displayDate: trend.date
        ? new Date(trend.date).toLocaleDateString()
        : `Record ${index + 1}`,
      disease: trend.disease || "Unknown Disease",
      risk_score: Number(trend.risk_score ?? 0),
      severity_score: Number(
        trend.severity_score ?? 0
      ),
    }));

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ================= Header ================= */}

        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Doctor Analytics
          </h1>

          <p className="mt-2 text-gray-600">
            Analyze patient health data, AI predictions,
            risk levels and health trends.
          </p>
        </div>

        {/* ================= Overview ================= */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <AnalyticsCard
            title="Assigned Patients"
            value={summary?.total_patients ?? 0}
            icon={Users}
            iconClass="bg-blue-100 text-blue-700"
          />

          <AnalyticsCard
            title="Total Predictions"
            value={summary?.total_predictions ?? 0}
            icon={Brain}
            iconClass="bg-green-100 text-green-700"
          />

          <AnalyticsCard
            title="High Risk Patients"
            value={summary?.high_risk_patients ?? 0}
            icon={AlertTriangle}
            iconClass="bg-orange-100 text-orange-700"
          />

          <AnalyticsCard
            title="Critical Risk Patients"
            value={summary?.critical_risk_patients ?? 0}
            icon={ShieldAlert}
            iconClass="bg-red-100 text-red-700"
          />

        </div>

        {/* ================= Average Scores ================= */}

        <div className="grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
                <Activity size={24} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Average Risk Score
                </p>

                <p className="text-3xl font-bold text-gray-800">
                  {summary?.average_risk_score ?? 0}
                </p>
              </div>

            </div>

            <p className="mt-4 text-sm text-gray-500">
              Average risk score across available AI predictions.
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <TrendingUp size={24} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Average Severity Score
                </p>

                <p className="text-3xl font-bold text-gray-800">
                  {summary?.average_severity_score ?? 0}
                </p>
              </div>

            </div>

            <p className="mt-4 text-sm text-gray-500">
              Average severity score across available AI predictions.
            </p>

          </div>

        </div>

        {/* ================= Disease Distribution ================= */}

        <div className="rounded-2xl bg-white p-8 shadow-md">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Disease Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Distribution of predicted diseases among assigned patients.
            </p>

          </div>

          {diseaseDistribution.length === 0 ? (

            <div className="py-10 text-center text-gray-500">
              No disease data available.
            </div>

          ) : (

            <div className="space-y-5">

              {diseaseDistribution.map(
                (item: any, index: number) => {

                  const percentage =
                    (item.count / maxDiseaseCount) * 100;

                  return (
                    <div key={`${item.disease}-${index}`}>

                      <div className="mb-2 flex items-center justify-between">

                        <span className="font-medium text-gray-700">
                          {item.disease}
                        </span>

                        <span className="font-semibold text-blue-700">
                          {item.count}
                        </span>

                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">

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

        {/* ================= Risk Distribution ================= */}

        <div className="rounded-2xl bg-white p-8 shadow-md">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Risk Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Distribution of AI prediction risk levels.
            </p>

          </div>

          {riskDistribution.length === 0 ? (

            <div className="py-10 text-center text-gray-500">
              No risk data available.
            </div>

          ) : (

            <div className="space-y-5">

              {riskDistribution.map(
                (item: any, index: number) => {

                  const percentage =
                    (item.count / maxRiskCount) * 100;

                  let barClass =
                    "bg-green-500";

                  if (item.level === "Medium") {
                    barClass = "bg-yellow-500";
                  }

                  if (item.level === "High") {
                    barClass = "bg-orange-500";
                  }

                  if (item.level === "Critical") {
                    barClass = "bg-red-500";
                  }

                  return (
                    <div key={`${item.level}-${index}`}>

                      <div className="mb-2 flex items-center justify-between">

                        <span className="font-medium text-gray-700">
                          {item.level}
                        </span>

                        <span className="font-semibold text-gray-800">
                          {item.count}
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

          )}

        </div>

        {/* ================= Health Trends Line Chart ================= */}

        <div className="rounded-2xl bg-white p-8 shadow-md">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Health Trends
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Risk and severity scores from patient predictions over time.
            </p>

          </div>

          {chartData.length === 0 ? (

            <div className="py-10 text-center text-gray-500">
              No health trend data available.
            </div>

          ) : (

            <div className="w-full">

              <ResponsiveContainer
                width="100%"
                height={400}
              >

                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    domain={[0, "auto"]}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip
                    formatter={(
                      value: any,
                      name: any
                    ) => [
                      value,
                      name === "risk_score"
                        ? "Risk Score"
                        : "Severity Score",
                    ]}
                    labelFormatter={(label, payload) => {
  const item = payload?.[0]?.payload as any;

  if (item?.disease) {
    return `${label} - ${item.disease}`;
  }

  return label;
}}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="risk_score"
                    name="Risk Score"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="severity_score"
                    name="Severity Score"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

      </div>
    </DashboardLayout>
  );
}


/* ================= Analytics Card ================= */

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: any;
  iconClass: string;
}

function AnalyticsCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: AnalyticsCardProps) {

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-800">
            {value}
          </p>

        </div>

        <div className={`rounded-xl p-4 ${iconClass}`}>
          <Icon size={28} />
        </div>

      </div>

    </div>
  );
}
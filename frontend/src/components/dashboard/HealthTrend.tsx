"use client";

import { useEffect, useState } from "react";

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
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getPredictionHistory } from "@/services/prediction";

interface Prediction {
  id: number;
  predicted_disease: string;
  confidence: string | number;
  risk_level: string;
  created_at: string;
}

interface TrendData {
  date: string;
  confidence: number;
  disease: string;
  risk: number;
}

interface DiseaseData {
  disease: string;
  count: number;
}

interface RiskData {
  name: string;
  value: number;
}

export default function HealthTrend() {
  const [data, setData] = useState<TrendData[]>([]);
  const [diseaseData, setDiseaseData] = useState<DiseaseData[]>([]);
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrend();
  }, []);

  const loadTrend = async () => {
    try {
      const response = await getPredictionHistory();

      if (!Array.isArray(response)) {
        setData([]);
        setDiseaseData([]);
        setRiskData([]);
        return;
      }

      /* ============================================
         TREND DATA
      ============================================ */

      const trendData: TrendData[] = response
        .slice()
        .reverse()
        .map((item: Prediction) => ({
          date: new Date(item.created_at).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
            }
          ),

          confidence: Number(item.confidence) || 0,

          disease: item.predicted_disease,

          risk:
            item.risk_level === "Critical"
              ? 100
              : item.risk_level === "High"
              ? 75
              : item.risk_level === "Moderate"
              ? 50
              : 25,
        }));

      setData(trendData);

      /* ============================================
         DISEASE DISTRIBUTION
      ============================================ */

      const diseaseCounts: Record<string, number> = {};

      response.forEach((item: Prediction) => {
        const disease = item.predicted_disease || "Unknown";

        diseaseCounts[disease] =
          (diseaseCounts[disease] || 0) + 1;
      });

      const diseases: DiseaseData[] = Object.entries(
        diseaseCounts
      )
        .map(([disease, count]) => ({
          disease,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setDiseaseData(diseases);

      /* ============================================
         RISK DISTRIBUTION
      ============================================ */

      const riskCounts: Record<string, number> = {};

      response.forEach((item: Prediction) => {
        const risk = item.risk_level || "Unknown";

        riskCounts[risk] =
          (riskCounts[risk] || 0) + 1;
      });

      const risks: RiskData[] = Object.entries(
        riskCounts
      ).map(([name, value]) => ({
        name,
        value,
      }));

      setRiskData(risks);

    } catch (error) {
      console.error(
        "Unable to load health trend:",
        error
      );

      setData([]);
      setDiseaseData([]);
      setRiskData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================
     LOADING
  ============================================ */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800">
          Health Analytics
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Loading health analytics...
        </p>
      </div>
    );
  }

  /* ============================================
     EMPTY STATE
  ============================================ */

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800">
          Health Analytics
        </h3>

        <div className="flex h-[300px] items-center justify-center">
          <p className="text-gray-500">
            No prediction history available.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================
     CHART
  ============================================ */

  return (
    <div className="space-y-6">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Health Analytics
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Interactive analysis of your AI prediction history.
        </p>
      </div>

      {/* ==========================================
          CHART 1
          CONFIDENCE + RISK TREND
      ========================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            📈 Prediction Confidence & Risk Trend
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            AI prediction confidence and risk level over time.
          </p>
        </div>

        <div className="h-[350px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{
                  fontSize: 12,
                }}
              />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="confidence"
                name="Confidence"
                strokeWidth={3}
                dot={{
                  r: 5,
                }}
                activeDot={{
                  r: 8,
                }}
              />

              <Line
                type="monotone"
                dataKey="risk"
                name="Risk Level"
                strokeWidth={3}
                dot={{
                  r: 5,
                }}
                activeDot={{
                  r: 8,
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* ==========================================
          CHART 2
          DISEASE DISTRIBUTION
      ========================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            🧠 Disease Prediction Distribution
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Number of predictions generated for each disease.
          </p>
        </div>

        <div className="h-[380px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={diseaseData}
              layout="vertical"
              margin={{
                top: 10,
                right: 20,
                left: 20,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="disease"
                width={180}
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Predictions"
                radius={[0, 8, 8, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* ==========================================
          CHART 3
          RISK DISTRIBUTION
      ========================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            ⚠️ Risk Level Distribution
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Distribution of predictions across different risk levels.
          </p>
        </div>

        <div className="h-[350px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={65}
                paddingAngle={3}
                label={({ name, percent }) =>
                  `${name} ${(
                    (percent || 0) * 100
                  ).toFixed(0)}%`
                }
              >

                {riskData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
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

    </div>
  );
}
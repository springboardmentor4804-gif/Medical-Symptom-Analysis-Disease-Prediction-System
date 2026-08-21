"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
}

export default function HealthTrend() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrend();
  }, []);

  const loadTrend = async () => {
    try {
      const response =
        await getPredictionHistory();

      if (!Array.isArray(response)) {
        setData([]);
        return;
      }

      const trendData: TrendData[] =
        response
          .slice()
          .reverse()
          .map(
            (item: Prediction) => ({
              date: new Date(
                item.created_at
              ).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                }
              ),

              confidence: Number(
                item.confidence
              ),

              disease:
                item.predicted_disease,
            })
          );

      setData(trendData);

    } catch (error) {

      console.error(
        "Unable to load health trend:",
        error
      );

      setData([]);

    } finally {

      setLoading(false);

    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md">

        <h3 className="text-lg font-bold text-gray-800">
          Health Prediction Trend
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Loading trend data...
        </p>

      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">

        <h3 className="text-lg font-bold text-gray-800">
          Health Prediction Trend
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          AI prediction confidence over time
        </p>

      </div>


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {data.length === 0 ? (

        <div className="flex h-[300px] items-center justify-center">

          <p className="text-gray-500">
            No prediction history available.
          </p>

        </div>

      ) : (

        /* ===================================================
           CHART
        =================================================== */

        <div className="h-[320px] w-full">

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
                domain={[
                  0,
                  100,
                ]}
                tick={{
                  fontSize: 12,
                }}
                unit="%"
              />

              <Tooltip/>

              <Line
                type="monotone"
                dataKey="confidence"
                strokeWidth={3}
                dot={{
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      )}

    </div>
  );
}
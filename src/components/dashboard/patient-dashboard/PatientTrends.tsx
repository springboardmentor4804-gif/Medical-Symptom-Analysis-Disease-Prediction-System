/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { UserData } from "@/app/dashboard/page";
import { API_URL } from "@/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Activity, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PatientTrendsProps {
  user: UserData;
}

const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#64748b"];

const parseJSDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0);
  const parts = dateStr.includes("/") ? dateStr.split("/") : dateStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].length === 4) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
    }
  }
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? new Date(0) : new Date(parsed);
};

export default function PatientTrends({ user }: PatientTrendsProps) {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // We fetch from the specific trends endpoint since the user is a patient,
  // the backend will automatically filter to just their own data.
  const fetchMyTrends = async () => {
    setLoading(true);
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);

      const response = await fetch(
        `${API_URL}/api/analytics/trends?granularity=weekly&timeRange=365`,
        {
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTrendsData(data);
      } else {
        toast.error("Failed to fetch health trends.");
      }
    } catch (err) {
      toast.error("Network error fetching trends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading your personal health trends...</p>
      </div>
    );
  }

  // Check if we have enough data
  const hasData = trendsData && trendsData.assessmentTrends.length > 0;

  // Extract history for the table
  const diagnosticReports = (user.medicalHistory || []).filter(
    (item) => item.details !== undefined,
  );
  // Sort descending by date
  diagnosticReports.sort((a, b) => parseJSDate(b.date).getTime() - parseJSDate(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">My Health Trends</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your AI risk assessments and predictions over time
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment Activity */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                <Calendar className="h-4.5 w-4.5 text-blue-500" />
                My Assessment Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendsData.assessmentTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Assessments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Trend */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                <Activity className="h-4.5 w-4.5 text-rose-500" />
                AI Risk Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendsData.riskTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="High"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Moderate"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Low"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Confidence Trend */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500" />
                My Prediction Confidence
              </CardTitle>
              <CardDescription className="text-xs">
                Confidence represents how strongly the AI favored its prediction. It does not
                represent medical certainty.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendsData.confidenceTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="AverageConfidence"
                    name="Confidence %"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Disease Prediction History Table */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
              <CardTitle className="text-base font-bold text-slate-855 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                My Disease Prediction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur">
                  <tr className="border-b border-slate-100 dark:border-slate-855 text-[10px] uppercase font-bold text-slate-400">
                    <th className="px-5 py-4">Assessment Date</th>
                    <th className="px-5 py-4">Predicted Condition</th>
                    <th className="px-4 py-4 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {diagnosticReports.map((report, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/30 transition-all"
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-slate-550 font-mono">
                        {report.date}
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {report.condition}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
                          {report.details?.primaryProb || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p>
            Limited historical data is available. Trends will become more meaningful as additional
            assessments are recorded.
          </p>
        </div>
      )}
    </div>
  );
}

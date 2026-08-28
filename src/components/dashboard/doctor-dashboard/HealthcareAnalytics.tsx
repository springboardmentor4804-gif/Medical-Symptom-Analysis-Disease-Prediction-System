/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  RefreshCw,
  Filter,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  totalAssessments: number;
  mostPredictedDisease: string | null;
  averageConfidence: number;
  highRisk: number;
  moderateRisk: number;
  lowRisk: number;
  diseaseDistribution: { name: string; value: number }[];
  riskDistribution: { name: string; value: number }[];
  confidenceDistribution: { name: string; value: number }[];
  symptomDistribution: { name: string; value: number }[];
  highRiskCases: any[];
}

interface TrendsData {
  diseaseTrends: any[];
  riskTrends: any[];
  assessmentTrends: any[];
  confidenceTrends: any[];
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#64748b", // Slate
  "#e11d48", // Rose
  "#0284c7", // Sky
  "#d97706", // Dark Amber
  "#059669", // Dark Emerald
];
const RISK_COLORS: Record<string, string> = {
  "High Risk": "#ef4444",
  "Moderate Risk": "#f59e0b",
  "Low Risk": "#10b981",
};

export default function HealthcareAnalytics({
  onOpenAdvisory,
}: {
  onOpenAdvisory: (patient: any, report: any, index: number) => void;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart view modes & hover states
  const [diseaseViewMode, setDiseaseViewMode] = useState<"donut" | "bar">("donut");
  const [hoveredDiseaseIndex, setHoveredDiseaseIndex] = useState<number | null>(null);
  const [hoveredRiskIndex, setHoveredRiskIndex] = useState<number | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState("30");
  const [granularity, setGranularity] = useState("daily");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      // Fetch base analytics
      const baseRes = await fetch(`${API_URL}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch trends with filters
      const queryParams = new URLSearchParams({
        granularity,
        timeRange,
        ...(diseaseFilter !== "all" && { disease: diseaseFilter }),
        ...(riskFilter !== "all" && { riskLevel: riskFilter }),
      });

      const trendsRes = await fetch(`${API_URL}/api/analytics/trends?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (baseRes.ok && trendsRes.ok) {
        setData(await baseRes.json());
        setTrends(await trendsRes.json());
      } else {
        toast.error("Unable to load healthcare analytics.");
      }
    } catch (err) {
      toast.error("Network error while fetching analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, granularity, diseaseFilter, riskFilter]); // Refetch when filters change

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Aggregating Population Health Data...</p>
      </div>
    );
  }

  if (!data || !trends) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>No health assessments available yet or unable to fetch data.</p>
        <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const totalDiseaseAssessments =
    data.diseaseDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0;
  const totalRiskAssessments =
    data.riskDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Healthcare Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated population insights and clinical trends
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100 dark:border-slate-800">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Filters</span>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-0">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-[110px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-0">
              <SelectValue placeholder="Grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-0">
              <SelectValue placeholder="Disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diseases</SelectItem>
              {data.diseaseDistribution.map((d, i) => (
                <SelectItem key={i} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs border-none bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-0">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="High Risk">High Risk</SelectItem>
              <SelectItem value="Moderate Risk">Moderate Risk</SelectItem>
              <SelectItem value="Low Risk">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-apple shadow-apple rounded-[20px] p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Assessments</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">
                {data.totalAssessments}
              </h4>
            </div>
          </div>
        </Card>

        <Card className="border-apple shadow-apple rounded-[20px] p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/50 rounded-xl flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Most Predicted</p>
              <h4
                className="text-sm font-black text-slate-800 dark:text-white line-clamp-1 break-all"
                title={data.mostPredictedDisease || "N/A"}
              >
                {data.mostPredictedDisease || "N/A"}
              </h4>
            </div>
          </div>
        </Card>

        <Card className="border-apple shadow-apple rounded-[20px] p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Avg Confidence</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">
                {data.averageConfidence}%
              </h4>
            </div>
          </div>
        </Card>

        <Card className="border-apple shadow-apple rounded-[20px] p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Risk Cases</p>
              <div className="flex gap-2 text-xs font-bold mt-1">
                <span className="text-rose-500" title="High Risk">
                  {data.highRisk}
                </span>{" "}
                /
                <span className="text-amber-500" title="Moderate Risk">
                  {" "}
                  {data.moderateRisk}
                </span>{" "}
                /
                <span className="text-emerald-500" title="Low Risk">
                  {" "}
                  {data.lowRisk}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {data.totalAssessments > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disease Trends */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
                  Disease Prediction Trends
                </CardTitle>
                <CardDescription className="text-xs">
                  Frequency of predictions over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {trends.diseaseTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trends.diseaseTrends}
                      margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      {/* Extract top 5 diseases dynamically from the chart data */}
                      {Array.from(new Set(trends.diseaseTrends.flatMap(Object.keys)))
                        .filter((k) => k !== "date")
                        .slice(0, 5)
                        .map((diseaseName, i) => (
                          <Line
                            key={diseaseName}
                            type="monotone"
                            dataKey={diseaseName}
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No disease trend data for this period.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Trends */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                  Risk Level Trends
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of risk classifications over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {trends.riskTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trends.riskTrends}
                      margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Line
                        type="monotone"
                        dataKey="High"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Moderate"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Low"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No risk trend data for this period.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment Volume Trend */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  Assessment Volume
                </CardTitle>
                <CardDescription className="text-xs">
                  Total number of AI assessments performed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trends.assessmentTrends}
                    margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      minTickGap={30}
                    />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="Volume" fill="#6366f1" radius={[4, 4, 0, 0]} name="Assessments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Confidence Trend */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  Average Prediction Confidence
                </CardTitle>
                <CardDescription className="text-xs">
                  Model confidence over time (not medical certainty)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trends.confidenceTrends}
                    margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      minTickGap={30}
                    />
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
                      name="Avg Confidence %"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Disease Distribution Chart */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                    <Activity className="h-4.5 w-4.5 text-blue-500" />
                    Disease Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Percentage breakdown of AI-predicted conditions
                  </CardDescription>
                </div>
                {/* View switcher */}
                {data.diseaseDistribution.length > 0 && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-850 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDiseaseViewMode("donut")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        diseaseViewMode === "donut"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                      title="Donut Chart View"
                    >
                      <PieChartIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Donut</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiseaseViewMode("bar")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        diseaseViewMode === "bar"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                      title="Ranked Bar View"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ranked</span>
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {data.diseaseDistribution.length > 0 ? (
                  diseaseViewMode === "donut" ? (
                    <div className="flex flex-col sm:flex-row items-center h-full gap-4">
                      {/* Left: Donut Chart with center summary */}
                      <div className="w-full sm:w-[46%] h-[250px] relative flex items-center justify-center shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const item = payload[0];
                                  const val = Number(item.value) || 0;
                                  const pct =
                                    totalDiseaseAssessments > 0
                                      ? ((val / totalDiseaseAssessments) * 100).toFixed(1)
                                      : "0";
                                  return (
                                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-xs z-50">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{
                                            backgroundColor: item.payload?.fill || COLORS[0],
                                          }}
                                        />
                                        <span className="font-bold text-slate-800 dark:text-slate-100 max-w-[180px] truncate">
                                          {item.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                                        <span>Occurrences:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                                          {val} ({pct}%)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Pie
                              data={data.diseaseDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                              onMouseEnter={(_, index) => setHoveredDiseaseIndex(index)}
                              onMouseLeave={() => setHoveredDiseaseIndex(null)}
                            >
                              {data.diseaseDistribution.map((entry, index) => {
                                const isHovered = hoveredDiseaseIndex === index;
                                const isAnyHovered = hoveredDiseaseIndex !== null;
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    opacity={isAnyHovered ? (isHovered ? 1 : 0.35) : 1}
                                    stroke={isHovered ? "#ffffff" : "transparent"}
                                    strokeWidth={isHovered ? 2 : 0}
                                    className="transition-all duration-200 cursor-pointer"
                                  />
                                );
                              })}
                            </Pie>
                          </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Center Ring Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          {hoveredDiseaseIndex !== null &&
                          data.diseaseDistribution[hoveredDiseaseIndex] ? (
                            <div className="px-2 transition-all">
                              <span
                                className="text-lg font-black block font-mono leading-none"
                                style={{
                                  color: COLORS[hoveredDiseaseIndex % COLORS.length],
                                }}
                              >
                                {totalDiseaseAssessments > 0
                                  ? (
                                      (data.diseaseDistribution[hoveredDiseaseIndex].value /
                                        totalDiseaseAssessments) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block max-w-[80px] truncate mt-0.5">
                                {data.diseaseDistribution[hoveredDiseaseIndex].name}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xl font-black text-slate-800 dark:text-white block font-mono leading-none">
                                {totalDiseaseAssessments}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mt-0.5">
                                Total Cases
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Scrollable breakdown legend list (Eliminates overlap) */}
                      <div className="w-full sm:w-[54%] max-h-[250px] overflow-y-auto pr-1 space-y-1.5">
                        {data.diseaseDistribution.map((entry, index) => {
                          const percentage =
                            totalDiseaseAssessments > 0
                              ? ((entry.value / totalDiseaseAssessments) * 100).toFixed(1)
                              : "0";
                          const isHovered = hoveredDiseaseIndex === index;
                          const isAnyHovered = hoveredDiseaseIndex !== null;
                          const color = COLORS[index % COLORS.length];

                          return (
                            <div
                              key={index}
                              onMouseEnter={() => setHoveredDiseaseIndex(index)}
                              onMouseLeave={() => setHoveredDiseaseIndex(null)}
                              className={`group relative p-2 rounded-xl transition-all duration-150 cursor-pointer border ${
                                isHovered
                                  ? "bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs"
                                  : isAnyHovered
                                  ? "opacity-40 border-transparent"
                                  : "bg-slate-50/70 dark:bg-slate-850/40 border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              {/* Background proportional tint bar */}
                              <div
                                className="absolute left-0 top-0 bottom-0 rounded-xl pointer-events-none transition-all duration-300"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: color,
                                  opacity: isHovered ? 0.2 : 0.08,
                                }}
                              />

                              <div className="relative flex items-center justify-between gap-2 z-10">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs transition-transform group-hover:scale-125"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span
                                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                                    title={entry.name}
                                  >
                                    {entry.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {entry.value}
                                  </span>
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono"
                                    style={{
                                      backgroundColor: `${color}20`,
                                      color: color,
                                    }}
                                  >
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Ranked Horizontal Progress List View */
                    <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2.5">
                      {data.diseaseDistribution.map((entry, index) => {
                        const maxVal = Math.max(
                          ...data.diseaseDistribution.map((d) => d.value),
                          1
                        );
                        const percentageOfTotal =
                          totalDiseaseAssessments > 0
                            ? ((entry.value / totalDiseaseAssessments) * 100).toFixed(1)
                            : "0";
                        const relativeBarWidth = (entry.value / maxVal) * 100;
                        const color = COLORS[index % COLORS.length];

                        return (
                          <div key={index} className="space-y-1 group">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  #{index + 1}
                                </span>
                                <span
                                  className="font-bold text-slate-700 dark:text-slate-200 truncate"
                                  title={entry.name}
                                >
                                  {entry.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  {entry.value} {entry.value === 1 ? "case" : "cases"}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono"
                                  style={{
                                    backgroundColor: `${color}18`,
                                    color: color,
                                  }}
                                >
                                  {percentageOfTotal}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${relativeBarWidth}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No disease data available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Distribution Pie Chart */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                  Risk Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Proportion of high, moderate, and low risk assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {data.riskDistribution.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center h-full gap-4">
                    {/* Left: Donut Chart with center label */}
                    <div className="w-full sm:w-[46%] h-[250px] relative flex items-center justify-center shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0];
                                const val = Number(item.value) || 0;
                                const pct =
                                  totalRiskAssessments > 0
                                    ? ((val / totalRiskAssessments) * 100).toFixed(1)
                                    : "0";
                                return (
                                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-xs z-50">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{
                                          backgroundColor:
                                            RISK_COLORS[item.name as string] || COLORS[0],
                                        }}
                                      />
                                      <span className="font-bold text-slate-800 dark:text-slate-100">
                                        {item.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                                      <span>Assessments:</span>
                                      <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                                        {val} ({pct}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Pie
                            data={data.riskDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            onMouseEnter={(_, index) => setHoveredRiskIndex(index)}
                            onMouseLeave={() => setHoveredRiskIndex(null)}
                          >
                            {data.riskDistribution.map((entry, index) => {
                              const isHovered = hoveredRiskIndex === index;
                              const isAnyHovered = hoveredRiskIndex !== null;
                              const color =
                                RISK_COLORS[entry.name] || COLORS[index % COLORS.length];
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={color}
                                  opacity={isAnyHovered ? (isHovered ? 1 : 0.35) : 1}
                                  stroke={isHovered ? "#ffffff" : "transparent"}
                                  strokeWidth={isHovered ? 2 : 0}
                                  className="transition-all duration-200 cursor-pointer"
                                />
                              );
                            })}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>

                      {/* Center summary inside donut */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        {hoveredRiskIndex !== null && data.riskDistribution[hoveredRiskIndex] ? (
                          <div className="px-2 transition-all">
                            <span
                              className="text-lg font-black block font-mono leading-none"
                              style={{
                                color:
                                  RISK_COLORS[data.riskDistribution[hoveredRiskIndex].name] ||
                                  COLORS[0],
                              }}
                            >
                              {totalRiskAssessments > 0
                                ? (
                                    (data.riskDistribution[hoveredRiskIndex].value /
                                      totalRiskAssessments) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block max-w-[80px] truncate mt-0.5">
                              {data.riskDistribution[hoveredRiskIndex].name}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xl font-black text-slate-800 dark:text-white block font-mono leading-none">
                              {totalRiskAssessments}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mt-0.5">
                              Assessed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Clean Risk Status Cards */}
                    <div className="w-full sm:w-[54%] max-h-[250px] overflow-y-auto pr-1 flex flex-col justify-center space-y-2.5">
                      {data.riskDistribution.map((entry, index) => {
                        const percentage =
                          totalRiskAssessments > 0
                            ? ((entry.value / totalRiskAssessments) * 100).toFixed(1)
                            : "0";
                        const isHovered = hoveredRiskIndex === index;
                        const isAnyHovered = hoveredRiskIndex !== null;
                        const color = RISK_COLORS[entry.name] || COLORS[index % COLORS.length];

                        return (
                          <div
                            key={index}
                            onMouseEnter={() => setHoveredRiskIndex(index)}
                            onMouseLeave={() => setHoveredRiskIndex(null)}
                            className={`group relative p-3 rounded-xl transition-all duration-150 cursor-pointer border ${
                              isHovered
                                ? "bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs"
                                : isAnyHovered
                                ? "opacity-40 border-transparent"
                                : "bg-slate-50/70 dark:bg-slate-850/40 border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 rounded-xl pointer-events-none transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                                opacity: isHovered ? 0.18 : 0.08,
                              }}
                            />
                            <div className="relative flex items-center justify-between gap-2 z-10">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="h-3 w-3 rounded-full shrink-0 shadow-xs transition-transform group-hover:scale-125"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {entry.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {entry.value} {entry.value === 1 ? "case" : "cases"}
                                </span>
                                <span
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-md font-mono"
                                  style={{
                                    backgroundColor: `${color}18`,
                                    color: color,
                                  }}
                                >
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No risk data available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Symptom Distribution Bar Chart */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <Users className="h-4.5 w-4.5 text-indigo-500" />
                  Top Reported Symptoms
                </CardTitle>
                <CardDescription className="text-xs">
                  Most frequently logged symptoms across all assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {data.symptomDistribution && data.symptomDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.symptomDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        width={80}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        name="Occurrences"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No symptom data available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confidence Distribution Bar Chart */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px]">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-white">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  Confidence Ranges
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of AI prediction confidence scores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                {data.confidenceDistribution && data.confidenceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.confidenceDistribution}
                      margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name="Assessments"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    No confidence data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* High-Risk Cases Table */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden mt-6">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-855 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                  High-Risk Cases Monitor
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Assessments flagged as High Risk requiring immediate attention
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-855 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Disease</th>
                    <th className="px-4 py-4 text-center">Confidence</th>
                    <th className="px-4 py-4 text-center">Severity</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {data.highRiskCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">
                        No high-risk cases detected.
                      </td>
                    </tr>
                  ) : (
                    data.highRiskCases.map((caseData) => (
                      <tr
                        key={caseData.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-850/30 transition-all"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-855 dark:text-white truncate">
                            {caseData.patient_name}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {caseData.condition}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
                            {caseData.confidence}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-xs font-semibold text-rose-600">
                          {caseData.severity}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-550 font-mono">
                          {caseData.date || "Unknown"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const minimalPatient = {
                                _id: caseData.patient_id,
                                name: caseData.patient_name,
                                medicalHistory: [caseData.report],
                              };
                              onOpenAdvisory(minimalPatient, caseData.report, 0);
                            }}
                            className="h-8 rounded-xl text-xs font-semibold border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500">
          More assessment data is required to display meaningful trends and distribution charts.
        </div>
      )}
    </div>
  );
}

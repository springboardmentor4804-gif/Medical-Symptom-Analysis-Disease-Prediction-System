"use client";

import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Stethoscope,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { UserData } from "@/app/dashboard/page";

interface SummaryProps {
  user: UserData;
  setActiveTab?: (tab: string) => void;
}

export default function DashboardSummary({ user, setActiveTab }: SummaryProps) {
  // Extract AI diagnostic reports from medical history
  const historyList = user.medicalHistory || [];
  const diagnosticReports = historyList.filter(
    (item) => item.details && item.details.riskScore !== undefined,
  );
  const latestAssessment = diagnosticReports[0] || null;

  // Time of day greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  // Date formatting helpers
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return new Date(dateStr).toLocaleDateString("en-US", options);
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 0) return "Upcoming";
      return `${diffDays} days ago`;
    } catch {
      return dateStr;
    }
  };

  // Vitals replacement: MedAssist-specific clinical metric cards (excluding Health Score)
  const riskLevel = latestAssessment?.details?.riskCat || "Low Risk";
  const isHighRisk = riskLevel.toLowerCase().includes("high");
  const isModRisk = riskLevel.toLowerCase().includes("moderate");

  const clinicalMetrics = [
    {
      title: "Health Risk",
      value: latestAssessment ? latestAssessment.details.riskCat : "Low",
      subtext: "Based on your latest assessment",
      icon: isHighRisk ? ShieldAlert : isModRisk ? AlertTriangle : ShieldCheck,
      color: isHighRisk
        ? "bg-rose-500/10 text-rose-500"
        : isModRisk
          ? "bg-amber-500/10 text-amber-500"
          : "bg-emerald-500/10 text-emerald-500",
      textColor: isHighRisk
        ? "text-rose-600 dark:text-rose-455"
        : isModRisk
          ? "text-amber-600 dark:text-amber-455"
          : "text-emerald-600 dark:text-emerald-455",
      gradient: isHighRisk
        ? "from-rose-500/[0.04] to-rose-500/[0.00] hover:bg-rose-500/[0.02]"
        : isModRisk
          ? "from-amber-500/[0.04] to-amber-500/[0.00] hover:bg-amber-500/[0.02]"
          : "from-emerald-500/[0.04] to-emerald-500/[0.00] hover:bg-emerald-500/[0.02]",
    },
    {
      title: "Last Assessment",
      value: latestAssessment ? getRelativeTime(latestAssessment.date) : "None yet",
      subtext: latestAssessment ? formatDate(latestAssessment.date) : "No diagnostic records",
      icon: Calendar,
      color: "bg-blue-500/10 text-blue-500",
      textColor: "text-blue-600 dark:text-blue-455",
      gradient: "from-blue-500/[0.04] to-blue-500/[0.00] hover:bg-blue-500/[0.02]",
    },
    {
      title: "Assessment Status",
      value: latestAssessment ? "Stable" : "Inactive",
      subtext: latestAssessment ? "No immediate concerns" : "Start symptom analysis",
      icon: Activity,
      color: "bg-indigo-500/10 text-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-455",
      gradient: "from-indigo-500/[0.04] to-indigo-500/[0.00] hover:bg-indigo-500/[0.02]",
    },
  ];

  // Assessment Trend Chart Data
  // If we have history points, map them; otherwise use the specified clean 7-day trend
  const baseTrendData = [
    { day: "Mon", score: 72 },
    { day: "Tue", score: 75 },
    { day: "Wed", score: 78 },
    { day: "Thu", score: 74 },
    { day: "Fri", score: 82 },
    { day: "Sat", score: 80 },
    { day: "Sun", score: 82 },
  ];

  const chartData =
    diagnosticReports.length >= 3
      ? [...diagnosticReports]
          .slice(0, 7)
          .reverse()
          .map((item, idx) => {
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            return {
              day: days[idx % 7] || formatDate(item.date),
              score: item.details?.primaryProb || 80,
            };
          })
      : baseTrendData;

  // Build compact activity records
  const recentActivities = historyList.slice(0, 4).map((item) => {
    let desc = "Medical record updated";
    if (item.type === "Diagnosis" || item.details !== undefined) {
      desc = `Symptom assessment completed (${item.condition})`;
    } else if (item.condition) {
      desc = `Health condition report generated (${item.condition})`;
    }
    return {
      dateText: formatDate(item.date),
      description: desc,
    };
  });

  // Default activities fallback if history is empty
  const defaultActivities = [
    { dateText: "Aug 12", description: "Symptom assessment completed" },
    { dateText: "Aug 10", description: "Health report generated" },
    { dateText: "Aug 08", description: "Medical history updated" },
    { dateText: "Aug 05", description: "Risk assessment completed" },
  ];

  const activitiesToShow = recentActivities.length > 0 ? recentActivities : defaultActivities;

  return (
    <div className="space-y-8">
      {/* Redesigned Hero Section */}
      <div className="bg-gradient-to-r from-blue-500/[0.08] via-indigo-500/[0.04] to-transparent rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-blue-100/10 shadow-apple relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 relative flex-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-850 dark:text-white">
            {getGreeting()}, {user.name.split(" ")[0]}
          </h2>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            Get a preliminary AI-powered assessment based on your symptoms and medical history.
          </p>
          <div className="flex flex-wrap gap-3.5 pt-2">
            <button
              onClick={() => setActiveTab && setActiveTab("symptoms")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              Start Symptom Analysis <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab("reports")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              View Health Report
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {clinicalMetrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card
                className={`border-apple shadow-apple bg-gradient-to-b ${metric.gradient} backdrop-blur-md hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 rounded-[24px] relative overflow-hidden group`}
              >
                <CardContent className="p-6 flex flex-col justify-between h-36">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {metric.title}
                    </span>
                    <div className={`p-2.5 rounded-2xl ${metric.color} shrink-0`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-850 dark:text-white">
                        {metric.value}
                      </h3>
                      <p className={`text-xs font-semibold mt-1 ${metric.textColor}`}>
                        {metric.subtext}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Analytics & Right Stack Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest AI Assessment Card */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 pb-5 p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
                    Latest AI Assessment
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Preliminary clinical evaluation details
                  </CardDescription>
                </div>
                {latestAssessment && (
                  <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
                    {formatDate(latestAssessment.date)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {latestAssessment ? (
                <div className="space-y-6">
                  {/* Reported Symptoms */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Reported Symptoms
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {latestAssessment.details?.symptoms ? (
                        latestAssessment.details.symptoms.map((symptom: string, i: number) => (
                          <span
                            key={i}
                            className="bg-blue-50/50 dark:bg-slate-850 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100/30 dark:border-slate-800"
                          >
                            {symptom}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          No symptoms documented
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Possible Conditions Progress Bar List */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Possible Conditions
                    </span>
                    <div className="space-y-3">
                      {/* Primary Condition */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">
                            {latestAssessment.condition}
                          </span>
                          <span className="text-blue-600 font-bold">
                            {latestAssessment.details?.primaryProb ||
                              latestAssessment.details?.riskScore ||
                              70}
                            %
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${latestAssessment.details?.primaryProb || latestAssessment.details?.riskScore || 70}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Secondary Predictions */}
                      {latestAssessment.details?.secondaryPredictions?.map(
                        (pred: { name: string; probability: number }, i: number) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-650 dark:text-slate-400">
                                {pred.name}
                              </span>
                              <span className="text-slate-500 font-bold">{pred.probability}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${pred.probability}%` }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Risk Level & Prediction Confidence row */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Risk Level
                      </span>
                      <span
                        className={`font-bold ${
                          isHighRisk
                            ? "text-rose-600"
                            : isModRisk
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {latestAssessment.details?.riskCat || "Low"}
                      </span>
                    </div>
                    <div className="space-y-1 border-l border-slate-200/50 dark:border-slate-800 pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Prediction Confidence
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-350">
                        {latestAssessment.details?.primaryProb || 82}%
                      </span>
                    </div>
                  </div>

                  {/* Footer Action & Disclaimer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      onClick={() => setActiveTab && setActiveTab("reports")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Full Assessment <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 italic">
                      * Preliminary Assessment. AI Predictions are not confirmed medical diagnoses.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-slate-850 dark:text-white">
                      No AI Assessments Yet
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Start a symptom analysis to generate your first preliminary assessment.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab && setActiveTab("symptoms")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Start Symptom Analysis
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Assessment Trend Chart */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 overflow-hidden rounded-[24px]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-5 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
                  Health Assessment Trend
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Track your assessment and risk trends over time
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="rgba(0, 0, 0, 0.03)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                      domain={[50, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(8px)",
                        borderColor: "rgba(0, 0, 0, 0.05)",
                        borderRadius: "16px",
                        color: "#1e293b",
                        fontSize: "12px",
                        fontWeight: 650,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.03)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Assessment Score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Stack */}
        <div className="space-y-6">
          {/* AI Clinical recommendations widget */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 pb-4 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                  AI Health Advisory
                </CardTitle>
                {latestAssessment?.details?.riskCat && (
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      latestAssessment.details.riskCat === "High Risk"
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                        : latestAssessment.details.riskCat === "Moderate Risk"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                    }`}
                  >
                    {latestAssessment.details.riskCat}
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-slate-400">
                Personalized guidance from latest health assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3.5">
              {/* Healthcare suggestion */}
              <div className="p-3.5 bg-gradient-to-br from-blue-50/50 to-blue-100/5 dark:from-slate-850 rounded-2xl border border-blue-100/20 shadow-sm space-y-1">
                <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-3 w-3" /> Healthcare Suggestions
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  {latestAssessment?.details?.recommendations?.healthcare ||
                    "Consult a qualified healthcare provider for clinical evaluation."}
                </p>
              </div>

              {/* Preventive Care */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-50/50 to-indigo-100/5 dark:from-slate-850 rounded-2xl border border-indigo-100/20 shadow-sm space-y-1">
                <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> Preventive Care
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  {latestAssessment?.details?.recommendations?.preventive ||
                    "Monitor vitals twice daily and track symptom progression."}
                </p>
              </div>

              {/* Lifestyle Guidance */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/5 dark:from-slate-850 rounded-2xl border border-emerald-100/20 shadow-sm space-y-1">
                <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-3 w-3" /> Lifestyle & Recovery
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  {latestAssessment?.details?.recommendations?.lifestyle ||
                    "Ensure adequate hydration and 8+ hours of restorative sleep."}
                </p>
              </div>

              {/* Follow-up Guidance */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50/50 to-amber-100/5 dark:from-slate-850 rounded-2xl border border-amber-100/20 shadow-sm space-y-1">
                <h5 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Follow-Up Timeline
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  {latestAssessment?.details?.recommendations?.followUp ||
                    "Re-evaluate in 48-72 hours; seek medical care if symptoms persist."}
                </p>
              </div>

              {/* Warning signs if present */}
              {latestAssessment?.details?.recommendations?.warningSigns &&
                latestAssessment.details.recommendations.warningSigns.length > 0 && (
                  <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200/50 dark:border-rose-900/30 space-y-1">
                    <h5 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-rose-600" /> Critical Red Flags
                    </h5>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                      {latestAssessment.details.recommendations.warningSigns[0]}
                    </p>
                  </div>
                )}

              <button
                onClick={() => setActiveTab && setActiveTab("reports")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                View Full Assessment & Guidance <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>

          {/* Quick Actions grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab && setActiveTab("symptoms")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/10 border border-blue-150/10 hover:scale-[1.03] transition-all duration-200 cursor-pointer shadow-sm text-center gap-2 group"
              >
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Symptom Analysis
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  Analyze your current symptoms
                </span>
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab("symptoms")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-indigo-100/10 border border-indigo-150/10 hover:scale-[1.03] transition-all duration-200 cursor-pointer shadow-sm text-center gap-2 group"
              >
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Risk Assessment
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  Check your health risk
                </span>
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab("reports")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/10 border border-emerald-150/10 hover:scale-[1.03] transition-all duration-200 cursor-pointer shadow-sm text-center gap-2 group"
              >
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Health Reports
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  View and download reports
                </span>
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab("reports")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-rose-100/10 border border-rose-150/10 hover:scale-[1.03] transition-all duration-200 cursor-pointer shadow-sm text-center gap-2 group"
              >
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-full group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  AI Advisory
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  View recommendations
                </span>
              </button>
            </div>
          </div>

          {/* Recent Activity Section */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 pb-5">
              <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                {activitiesToShow.map((activity, idx) => (
                  <div key={idx} className="flex gap-4 items-start text-xs">
                    <span className="font-bold text-slate-400 shrink-0 min-w-[50px]">
                      {activity.dateText}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-slate-700 dark:text-slate-350">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab && setActiveTab("medical-history")}
                className="text-xs font-bold text-blue-600 hover:text-blue-755 inline-flex items-center gap-1 pt-2 cursor-pointer"
              >
                View Medical History <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

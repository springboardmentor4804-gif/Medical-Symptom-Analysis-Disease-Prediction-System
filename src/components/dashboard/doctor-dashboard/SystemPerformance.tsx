"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Cpu, Activity, Clock, Zap, ShieldCheck } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const responseTimeData = [
  { time: "10:00", duration: 38 },
  { time: "11:00", duration: 45 },
  { time: "12:00", duration: 42 },
  { time: "13:00", duration: 39 },
  { time: "14:00", duration: 41 },
  { time: "15:00", duration: 42 },
  { time: "16:00", duration: 40 },
];

const modelAccuracyHistory = [
  { epoch: "v1.0", accuracy: 68 },
  { epoch: "v1.1", accuracy: 74 },
  { epoch: "v1.2", accuracy: 79 },
  { epoch: "v2.0 (Latest)", accuracy: 84.58 },
];

export default function SystemPerformance() {
  const categories = [
    {
      title: "AI Model Performance",
      description: "Core disease classification model metrics",
      icon: Brain,
      color: "text-indigo-500 bg-indigo-500/10",
      metrics: [
        { label: "Prediction Accuracy", value: "84.58%", target: "80.0%", progress: 84.58 },
        { label: "Precision", value: "81.20%", target: "80.0%", progress: 81.2 },
        { label: "Recall", value: "79.50%", target: "75.0%", progress: 79.5 },
        { label: "F1-Score", value: "80.30%", target: "78.0%", progress: 80.3 },
      ],
    },
    {
      title: "Healthcare Performance",
      description: "Clinical evaluation and patient safety benchmarks",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10",
      metrics: [
        {
          label: "Disease Prediction Confidence",
          value: "78.40%",
          target: "70.0%",
          progress: 78.4,
        },
        { label: "Risk Assessment Accuracy", value: "99.17%", target: "95.0%", progress: 99.17 },
        { label: "Recommendation Relevance", value: "94.80%", target: "90.0%", progress: 94.8 },
      ],
    },
    {
      title: "System Performance",
      description: "Server infrastructure and response latencies",
      icon: Cpu,
      color: "text-blue-500 bg-blue-500/10",
      metrics: [
        { label: "API Response Time", value: "42 ms", target: "< 100 ms", progress: 92 },
        { label: "Dashboard Loading Speed", value: "180 ms", target: "< 300 ms", progress: 88 },
        { label: "Concurrent User Handling", value: "12,500/s", target: "10,000/s", progress: 95 },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-500/[0.08] via-indigo-500/[0.04] to-transparent rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-blue-100/10 shadow-apple relative overflow-hidden">
        <div className="space-y-2 z-10 relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-850 dark:text-white flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-blue-600 animate-pulse" />
            Performance & Diagnostics Analytics
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            Real-time verification of machine learning models, clinical advisor engines, and global
            application server response latencies.
          </p>
        </div>
      </div>

      {/* Grid containing performance indicators */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {categories.map((category, i) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden h-full flex flex-col justify-between">
                <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${category.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 dark:text-white">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400 mt-0.5">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 space-y-5">
                  {category.metrics.map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-655 dark:text-slate-350">
                          {metric.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-white">
                            {metric.value}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({metric.target})
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-550 ${
                            category.title.includes("AI")
                              ? "bg-indigo-500"
                              : category.title.includes("Health")
                                ? "bg-emerald-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${metric.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Accuracy Evolution */}
        <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
            <CardTitle className="text-sm font-bold text-slate-855 dark:text-white flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-indigo-500" />
              AI Model Classification Accuracy Trend
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Training optimization updates across production releases
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelAccuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="epoch"
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
                      borderRadius: "12px",
                      color: "#1e293b",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="accuracy"
                    name="Accuracy (%)"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* API Response times */}
        <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
            <CardTitle className="text-sm font-bold text-slate-855 dark:text-white flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-500" />
              API Server Response Latency Monitor
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Real-time response tracking (in milliseconds)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="time"
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      borderColor: "rgba(0, 0, 0, 0.05)",
                      borderRadius: "12px",
                      color: "#1e293b",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="duration"
                    name="Latency (ms)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLatency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

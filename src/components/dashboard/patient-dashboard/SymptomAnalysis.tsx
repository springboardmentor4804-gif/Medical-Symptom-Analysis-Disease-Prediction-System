/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { API_URL } from "@/config";
import { useState } from "react";
import { motion } from "framer-motion";
import { UserData } from "@/app/dashboard/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  TrendingUp,
  Brain,
  ShieldCheck,
  FileCheck,
  Search,
  X,
  Lock,
  Thermometer,
  Activity,
  Battery,
  Wind,
  MessageSquare,
  AlertCircle,
  Plus,
  Info,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

interface SymptomAnalysisProps {
  user: UserData;
  onUpdate: (updatedUser: UserData) => void;
}

interface Symptom {
  id: string;
  name: string;
  category: string;
  icon?: any;
}

const AVAILABLE_SYMPTOMS: Symptom[] = [
  { id: "chest_pain", name: "Chest Pain", category: "Cardiology", icon: HeartIcon },
  { id: "palpitations", name: "Heart Palpitations", category: "Cardiology", icon: Activity },
  { id: "shortness_of_breath", name: "Difficulty Breathing", category: "Respiratory", icon: Wind },
  { id: "cough", name: "Cough", category: "Respiratory", icon: Wind },
  { id: "sore_throat", name: "Sore Throat", category: "Respiratory", icon: MessageSquare },
  { id: "runny_nose", name: "Runny Nose", category: "Respiratory", icon: Wind },
  { id: "headache", name: "Severe Headache", category: "Neurology", icon: Brain },
  { id: "dizziness", name: "Dizziness/Vertigo", category: "Neurology", icon: Activity },
  { id: "abdominal_pain", name: "Abdominal Pain", category: "Gastrointestinal", icon: AlertCircle },
  { id: "nausea", name: "Nausea/Vomiting", category: "Gastrointestinal", icon: AlertCircle },
  { id: "fever", name: "Fever", category: "General", icon: Thermometer },
  { id: "fatigue", name: "Fatigue", category: "General", icon: Battery },
  { id: "muscle_aches", name: "Muscle Aches", category: "General", icon: Activity },
  { id: "joint_pain", name: "Joint Pain", category: "Rheumatology", icon: Activity },
  { id: "rash", name: "Rash", category: "Dermatology", icon: AlertCircle },
  { id: "itching", name: "Itching", category: "Dermatology", icon: AlertCircle },
];

function HeartIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

const POPULAR_SYMPTOMS = [
  { id: "fever", label: "Fever", icon: Thermometer },
  { id: "headache", label: "Headache", icon: Brain },
  { id: "fatigue", label: "Fatigue", icon: Battery },
  { id: "cough", label: "Cough", icon: Wind },
  { id: "sore_throat", label: "Sore Throat", icon: MessageSquare },
  { id: "muscle_aches", label: "Body Pain", icon: AlertCircle },
  { id: "nausea", label: "Nausea", icon: Activity },
  { id: "chest_pain", label: "Chest Pain", icon: HeartIcon },
  { id: "shortness_of_breath", label: "Difficulty Breathing", icon: Wind },
  { id: "abdominal_pain", label: "Abdominal Pain", icon: AlertCircle },
  { id: "dizziness", label: "Dizziness", icon: Activity },
];

export default function SymptomAnalysis({ user, onUpdate }: SymptomAnalysisProps) {
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [bloodPressure, setBloodPressure] = useState("Normal");
  const [cholesterolLevel, setCholesterolLevel] = useState("Normal");

  const [symptomSearch, setSymptomSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleRunAnalysis = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error("Please select at least one symptom.");
      return;
    }

    setAnalyzing(true);
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) {
        toast.error("Session expired. Please log in again.");
        setAnalyzing(false);
        return;
      }
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const symptomsNames = selectedSymptoms.map(
        (id) => AVAILABLE_SYMPTOMS.find((s) => s.id === id)?.name || id,
      );

      const response = await fetch(`${API_URL}/api/prediction/predict-symptom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptoms: symptomsNames,
          age: user.age || 30,
          gender: user.sex || "female",
          blood_pressure: bloodPressure.toLowerCase(),
          cholesterol_level: cholesterolLevel.toLowerCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setSaved(false);
        setStep(2);
        await handleSaveReport(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Prediction engine error.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to the prediction server.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReport = async (reportData?: any) => {
    const reportToSave = reportData || result;
    if (!reportToSave) return;
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;
      const isDoctor = parsedUser.role === "doctor";

      if (isDoctor && !reportToSave.notes.includes("Dr.")) {
        reportToSave.notes = `AI diagnostic classification ran by Dr. ${parsedUser.name}. ${reportToSave.notes}`;
      }

      const updatedHistory = [reportToSave, ...(user.medicalHistory || [])];

      const saveEndpoint = isDoctor
        ? `${API_URL}/api/auth/patients/${user._id}`
        : `${API_URL}/api/auth/me`;

      const response = await fetch(saveEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        if (!isDoctor) {
          const newLocalStorageUser = { ...parsedUser, ...updatedData };
          localStorage.setItem("user", JSON.stringify(newLocalStorageUser));
        }
        onUpdate(updatedData);
        setSaved(true);
      } else {
        toast.error("Failed to save report.");
      }
    } catch (e) {
      toast.error("Database connection lost.");
    }
  };

  // Simplified 2-step progress steps
  const steps = [
    { num: 1, title: "Symptom & Health Info", subtitle: "Tell us how you feel & add details" },
    { num: 2, title: "Get Results", subtitle: "AI analysis & recommendations" },
  ];

  return (
    <div className="space-y-8 flex flex-col min-h-full">
      {/* 2-Step progress indicators */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 max-w-2xl mx-auto mb-4 w-full">
        {steps.map((s, idx) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center w-full md:w-auto">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 border shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/20 scale-105"
                      : isDone
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200/40 dark:border-slate-700"
                  }`}
                >
                  {s.num}
                </div>
                <div className="text-left">
                  <p
                    className={`text-xs font-bold ${
                      isActive
                        ? "text-blue-600 dark:text-blue-450"
                        : isDone
                          ? "text-slate-800 dark:text-white"
                          : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">{s.subtitle}</p>
                </div>
              </div>
              {idx < 1 && (
                <div className="hidden md:block h-[1px] w-20 bg-slate-200 dark:bg-slate-800 ml-8" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Workspace layout */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: How It Works Info */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-1">
                How it works
              </h3>
              <p className="text-xs text-slate-400">
                Complete the quick 2-step diagnostic assessment.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-blue-650 dark:text-blue-400">
                  1. Select Symptoms & Context
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Choose symptoms and provide vital details like Blood Pressure and Cholesterol.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-350">
                  2. Get AI Analysis
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Receive possible conditions, risk level and healthcare recommendations.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-normal">
              <Lock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-500">
                  Your data is secure and confidential.
                </span>
                <span>MedAssist follows strict privacy protocols.</span>
              </div>
            </div>
          </Card>

          {/* Right Column: Symptom Picker Workspace */}
          <Card className="lg:col-span-2 border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-between min-h-[460px]">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8">
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">
                What symptoms are you experiencing?
              </CardTitle>
              <CardDescription className="text-slate-400">
                Search or select all symptoms that apply to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Widened Search bar */}
                <div className="relative">
                  <Input
                    placeholder="Search symptoms..."
                    value={symptomSearch}
                    onChange={(e: any) => {
                      setSymptomSearch(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold placeholder:text-slate-400"
                  />
                  <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />

                  {/* Dropdown search panel */}
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute z-20 w-full max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-2 mt-1">
                        {(() => {
                          const filtered = AVAILABLE_SYMPTOMS.filter((s) =>
                            s.name.toLowerCase().includes(symptomSearch.toLowerCase()),
                          );
                          if (filtered.length === 0) {
                            return (
                              <p className="text-xs text-slate-400 p-3 italic">
                                No matching symptoms found.
                              </p>
                            );
                          }
                          return filtered.map((symptom) => {
                            const isSelected = selectedSymptoms.includes(symptom.id);
                            return (
                              <button
                                key={symptom.id}
                                type="button"
                                onClick={() => {
                                  toggleSymptom(symptom.id);
                                  setSymptomSearch("");
                                  setDropdownOpen(false);
                                }}
                                className={`w-full text-left p-3 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between cursor-pointer ${
                                  isSelected ? "text-blue-600 bg-blue-500/5 font-bold" : ""
                                }`}
                              >
                                <span>{symptom.name}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-400">
                                  {symptom.category}
                                </span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}
                </div>

                {/* Popular Symptoms section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Popular Symptoms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SYMPTOMS.map((pop) => {
                      const isSelected = selectedSymptoms.includes(pop.id);
                      const SymptomIcon = pop.icon;
                      return (
                        <button
                          key={pop.id}
                          type="button"
                          onClick={() => toggleSymptom(pop.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 border-transparent text-white font-bold shadow-sm"
                              : "bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-850 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                          }`}
                        >
                          <SymptomIcon
                            className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-slate-400"}`}
                          />
                          {pop.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-850 border-slate-200/50 dark:border-slate-800 text-slate-500 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> View More
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4" />

                {/* Selected Symptoms chips area */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Selected Symptoms ({selectedSymptoms.length})
                    </h4>
                    {selectedSymptoms.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSymptoms([])}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {selectedSymptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSymptoms.map((id) => {
                        const sym = AVAILABLE_SYMPTOMS.find((s) => s.id === id);
                        if (!sym) return null;
                        return (
                          <span
                            key={id}
                            className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30 flex items-center gap-1.5"
                          >
                            {sym.name}
                            <button
                              type="button"
                              onClick={() => toggleSymptom(id)}
                              className="hover:text-rose-600 focus:outline-none transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Your selected symptoms will appear here
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4" />

                {/* Combined Health Details Section */}
                <div className="space-y-5">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Health Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Blood Pressure selector */}
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Blood Pressure:
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Low", "Normal", "High"].map((bp) => (
                          <button
                            key={bp}
                            type="button"
                            onClick={() => setBloodPressure(bp)}
                            className={`py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                              bloodPressure === bp
                                ? bp === "High"
                                  ? "border-rose-500 bg-rose-50 text-rose-600 font-bold dark:bg-rose-950/20"
                                  : "border-blue-600 bg-blue-500/5 text-blue-600 font-bold"
                                : "border-slate-200/60 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350"
                            }`}
                          >
                            {bp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cholesterol level selector */}
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Cholesterol Level:
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Low", "Normal", "High"].map((chol) => (
                          <button
                            key={chol}
                            type="button"
                            onClick={() => setCholesterolLevel(chol)}
                            className={`py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                              cholesterolLevel === chol
                                ? chol === "High"
                                  ? "border-rose-500 bg-rose-50 text-rose-600 font-bold dark:bg-rose-950/20"
                                  : "border-blue-600 bg-blue-500/5 text-blue-600 font-bold"
                                : "border-slate-200/60 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350"
                            }`}
                          >
                            {chol}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={selectedSymptoms.length === 0 || analyzing}
                  className={`rounded-2xl font-semibold px-6 py-3 shadow-apple flex items-center gap-1.5 text-xs transition-all hover:scale-[1.01] duration-200 ${
                    selectedSymptoms.length > 0 && !analyzing
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer"
                      : "bg-slate-100 text-slate-450 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60"
                  }`}
                >
                  {analyzing ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Analyzing Health Mesh...
                    </>
                  ) : (
                    <>
                      Run AI Diagnostics <TrendingUp className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2 Results */}
      {step === 2 && result && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          {/* Emergency Alert Banner */}
          {result.details.isEmergency && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-600 text-white rounded-3xl p-6 shadow-lg flex items-start gap-4 animate-pulse border border-rose-500"
            >
              <AlertOctagon className="h-8 w-8 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">
                  EMERGENCY PROTOCOL TRIGGERED
                </h3>
                <p className="text-xs opacity-95 leading-relaxed mt-1">
                  Your inputs indicate a potential acute clinical risk. Please seek immediate
                  emergency medical evaluation or proceed to the nearest emergency department.
                </p>
              </div>
            </motion.div>
          )}

          {/* Low-Confidence Uncertainty Banner */}
          {(result.details.uncertaintyNote || result.details.primaryProb < 60) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-start gap-3.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Preliminary / Low-Confidence Indication
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    Confidence: {result.details.primaryProb}%
                  </span>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                  {result.details.uncertaintyNote ||
                    "This AI-generated assessment exhibits symptom overlap across multiple conditions. A clinical physical examination and laboratory testing are necessary for accurate diagnosis."}
                </p>
              </div>
            </div>
          )}

          {/* Primary Assessment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Assessment Gauge */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-855 p-6">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center justify-between">
                  <span>Risk Assessment</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      result.details.riskCat === "High Risk"
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                        : result.details.riskCat === "Moderate Risk"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                    }`}
                  >
                    {result.details.riskCat}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-5">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      className="text-slate-100 dark:text-slate-850"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="72"
                      cy="72"
                    />
                    <circle
                      className={
                        result.details.riskCat === "High Risk"
                          ? "text-rose-500"
                          : result.details.riskCat === "Moderate Risk"
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }
                      strokeWidth="8"
                      strokeDasharray="351.8"
                      strokeDashoffset={351.8 - (351.8 * result.details.riskScore) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="72"
                      cy="72"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">
                      {result.details.riskScore}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Risk Index
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 w-full">
                  <div className="flex justify-between items-center text-xs px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-850">
                    <span className="text-slate-400 font-medium">Severity:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {result.details.severity || "Moderate"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-850">
                    <span className="text-slate-400 font-medium">Assessed on:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {result.date}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disease Classification Card */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden md:col-span-2 flex flex-col justify-between">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                      <Brain className="h-4.5 w-4.5 text-primary" />
                      AI Health Assessment
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-405">
                      Preliminary condition identified from reported symptoms & profile baseline
                    </CardDescription>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full shrink-0 ${
                      result.details.primaryProb >= 75
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                        : result.details.primaryProb >= 60
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                    }`}
                  >
                    {result.details.confidenceTier || `Confidence: ${result.details.primaryProb}%`}{" "}
                    ({result.details.primaryProb}%)
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2 shadow-sm">
                  <div className="flex justify-between text-[10px] font-bold text-primary uppercase tracking-wider">
                    <span>Possible Condition Identified</span>
                    <span>{result.details.primaryProb}% Match Probability</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-855 dark:text-white">
                    {result.condition}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Reported symptoms:
                    </span>
                    {result.details.symptoms.map((s: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white/80 dark:bg-slate-800 font-semibold px-2 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Alternative Possibilities */}
                {result.details.secondaryPredictions &&
                  result.details.secondaryPredictions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Alternative Possibilities Considered
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.details.secondaryPredictions.map((pred: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl border border-apple bg-slate-50/50 dark:bg-slate-800/50 text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-350 truncate">
                              {pred.name}
                            </span>
                            <span className="font-bold text-slate-500 font-mono bg-slate-200/50 dark:bg-slate-750 px-2 py-0.5 rounded-lg text-[10px] shrink-0 ml-2">
                              {pred.probability}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {result.details.correlations && result.details.correlations.length > 0 && (
                  <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                    <h4 className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Health Profile Correlations
                    </h4>
                    {result.details.correlations.map((corr: string, i: number) => (
                      <p key={i} className="text-xs text-slate-500 leading-relaxed">
                        {corr}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Warning Signs Section (Red Flags) */}
          {result.details.recommendations?.warningSigns &&
            result.details.recommendations.warningSigns.length > 0 && (
              <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between border-b border-rose-100 dark:border-rose-900/20">
                  <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-600" />
                    Warning Signs & Critical Red Flags
                  </CardTitle>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">
                    Seek Immediate Care If Present
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    If you experience any of the following warning symptoms, seek immediate
                    professional medical attention:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.details.recommendations.warningSigns.map((sign: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-rose-100 dark:border-rose-900/30"
                      >
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{sign}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* 4 Core Recommendation Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category A: Healthcare Suggestions */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <Stethoscope className="h-4.5 w-4.5 text-blue-600" />
                  Healthcare & Treatment Suggestions
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Clinical consultation & indicated diagnostic guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {result.details.recommendations?.healthcareSuggestions ? (
                  result.details.recommendations.healthcareSuggestions.map(
                    (item: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350"
                      >
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {result.details.recommendations?.healthcare || "Consult a qualified physician."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category B: Preventive Care */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  Preventive Care & Vitals Tracking
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Condition-specific prevention and risk reduction
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {result.details.recommendations?.preventiveCare ? (
                  result.details.recommendations.preventiveCare.map((item: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {result.details.recommendations?.preventive ||
                      "Monitor resting vitals regularly."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category C: Lifestyle Recommendations */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <HeartHandshake className="h-4.5 w-4.5 text-indigo-600" />
                  Lifestyle, Hydration & Nutrition
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Rest, fluid intake, diet, and recovery guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {result.details.recommendations?.lifestyleRecommendations ? (
                  result.details.recommendations.lifestyleRecommendations.map(
                    (item: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350"
                      >
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {result.details.recommendations?.lifestyle ||
                      "Maintain adequate rest and hydration."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category D: Follow-Up Guidance */}
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <Clock className="h-4.5 w-4.5 text-amber-600" />
                  Follow-Up & Monitoring Timeline
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Reassessment triggers and doctor consultation schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {result.details.recommendations?.followUpGuidance ? (
                  result.details.recommendations.followUpGuidance.map((item: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350"
                    >
                      <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {result.details.recommendations?.followUp || "Follow up if symptoms persist."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 dark:bg-slate-900 border border-apple p-5 rounded-3xl gap-4 shadow-apple">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setStep(1);
                setSelectedSymptoms([]);
              }}
              className="rounded-2xl border-apple hover:bg-slate-50 text-xs font-semibold px-6 py-2.5 cursor-pointer w-full sm:w-auto"
            >
              Start New Analysis
            </Button>
            <Button
              disabled={saved}
              onClick={() => handleSaveReport()}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/20 disabled:text-emerald-500 text-white font-semibold px-6 py-2.5 shadow-apple flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-transform w-full sm:w-auto"
            >
              <FileCheck className="h-4.5 w-4.5" />{" "}
              {saved ? "Report Saved to Health Catalog ✓" : "Save Assessment Report"}
            </Button>
          </div>
        </div>
      )}

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="w-full p-5 mt-auto rounded-3xl bg-blue-50/50 dark:bg-slate-900 border border-blue-100/60 dark:border-slate-800 flex gap-3.5 items-start text-left shadow-sm">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-950 dark:text-blue-300">
            Medical & Legal Disclaimer — Educational Health Insights Only
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            MedAssist AI is an artificial intelligence decision-support tool. This output does not
            constitute a formal medical diagnosis, prescription, or clinical treatment plan. Never
            start, stop, or adjust prescription medication without consulting a qualified healthcare
            professional. If you believe you are experiencing a medical emergency, call your local
            emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

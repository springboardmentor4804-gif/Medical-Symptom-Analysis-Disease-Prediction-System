/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { API_URL } from "@/config";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  History,
  Brain,
  ShieldCheck,
  FileText,
  AlertTriangle,
  PlusCircle,
  X,
  Plus,
  Activity,
  Heart,
  TrendingUp,
  Check,
  ThumbsUp,
  ThumbsDown,
  Upload,
  User,
  Eye,
  Stethoscope,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  Info,
  AlertOctagon,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SymptomAnalysis from "../patient-dashboard/SymptomAnalysis";
import ActivePatientHeader from "./ActivePatientHeader";
import ProfileManagement from "../patient-dashboard/ProfileManagement";
import SystemPerformance from "./SystemPerformance";
import HealthcareAnalytics from "./HealthcareAnalytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface DoctorDashboardProps {
  user: any;
  activeTab?: string;
  selectedPatient?: Patient | null;
  setSelectedPatient?: (p: Patient | null) => void;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  age: number;
  sex: string;
  phone: string;
  bloodType: string;
  weight: number;
  height: number;
  chronicConditions: string[];
  allergies: string[];
  medications: string[];
  medicalHistory: Array<{
    date: string;
    condition: string;
    notes: string;
    type: string;
    details?: any;
    approvalStatus?: "approved" | "disapproved";
    doctorNotes?: string;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#64748b"];

export default function DoctorDashboard({
  user,
  activeTab = "dashboard",
  selectedPatient = null,
  setSelectedPatient = () => {},
}: DoctorDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Timeline form
  const [newHistDate, setNewHistDate] = useState("");
  const [newHistType, setNewHistType] = useState("Diagnosis");
  const [newHistCond, setNewHistCond] = useState("");
  const [newHistNotes, setNewHistNotes] = useState("");

  // Advisory Form
  const [healthcareRec, setHealthcareRec] = useState("");
  const [preventiveRec, setPreventiveRec] = useState("");
  const [lifestyleRec, setLifestyleRec] = useState("");
  const [followupRec, setFollowupRec] = useState("");
  const [clinicianNote, setClinicianNote] = useState("");

  // AI Verification Review notes
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  // History Timeline Active Filter
  const [timelineFilter, setTimelineFilter] = useState("All Events");

  // Registration form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    email: "",
    password: "Password123!",
    age: 35,
    sex: "male",
    phone: "",
    bloodType: "O+",
    weight: 75,
    height: 175,
  });

  const [advisoryModal, setAdvisoryModal] = useState<{
    open: boolean;
    patient: Patient | null;
    report: any | null;
    reportIdx: number | null;
  }>({
    open: false,
    patient: null,
    report: null,
    reportIdx: null,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async (patientId: string, report: any, idx: number) => {
    setIsDownloading(true);
    const storedUserStr = localStorage.getItem("user");
    let token = "";
    if (storedUserStr) {
      token = JSON.parse(storedUserStr).token;
    }

    try {
      toast.info("Generating PDF report...", { id: "pdf-gen" });
      const res = await fetch(`${API_URL}/api/reports/${patientId}/${idx}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MedAssist_Report_${report.date?.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully", { id: "pdf-gen" });
    } catch (err) {
      toast.error("Unable to generate the report. Please try again.", { id: "pdf-gen" });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const response = await fetch(`${API_URL}/api/auth/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not fetch patients.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdvisory = (patient: Patient, report?: any, reportIdx?: number) => {
    let rep = report;
    let idx = reportIdx ?? null;
    if (!rep) {
      const reportsWithIdx = (patient.medicalHistory || [])
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => item.details !== undefined);
      if (reportsWithIdx.length > 0) {
        rep = reportsWithIdx[0].item;
        idx = reportsWithIdx[0].i;
      }
    }
    setAdvisoryModal({ open: true, patient, report: rep, reportIdx: idx });
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const response = await fetch(`${API_URL}/api/auth/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPatientData),
      });

      if (response.ok) {
        const created = await response.json();
        toast.success("Patient registered successfully!");
        setShowAddModal(false);
        setPatients([created, ...patients]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create patient.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!newHistDate || !newHistCond) {
      toast.error("Please fill in Date and Event Description.");
      return;
    }

    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const newHistoryItem = {
        date: newHistDate,
        type: newHistType,
        condition: newHistCond,
        notes: newHistNotes,
      };

      const updatedHistory = [newHistoryItem, ...(selectedPatient.medicalHistory || [])];

      const response = await fetch(`${API_URL}/api/auth/patients/${selectedPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setSelectedPatient(updatedData);
        setPatients(patients.map((p) => (p._id === updatedData._id ? updatedData : p)));
        toast.success("Event added successfully!");
        setNewHistDate("");
        setNewHistCond("");
        setNewHistNotes("");
      } else {
        toast.error("Failed to add event to medical timeline.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach server.");
    }
  };

  const handleRemoveTimeline = async (idxToRemove: number) => {
    if (!selectedPatient) return;
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const updatedHistory = (selectedPatient.medicalHistory || []).filter(
        (_, idx) => idx !== idxToRemove,
      );

      const response = await fetch(`${API_URL}/api/auth/patients/${selectedPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setSelectedPatient(updatedData);
        setPatients(patients.map((p) => (p._id === updatedData._id ? updatedData : p)));
        toast.success("Event removed from medical timeline.");
      } else {
        toast.error("Failed to remove event.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach server.");
    }
  };

  const handleSaveRecommendations = async () => {
    if (!selectedPatient) return;
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const newHistoryItem = {
        date: new Date().toISOString().split("T")[0],
        type: "Clinical Advisory",
        condition: "Healthcare Advisory & Recommendations",
        notes: clinicianNote
          ? `Clinical advisory review by Dr. ${parsedUser.name}: "${clinicianNote}"`
          : `Clinical advisory review recorded by Dr. ${parsedUser.name}`,
        doctorNotes: clinicianNote || "Reviewed and approved by attending clinician.",
        approvalStatus: "approved" as const,
        details: {
          recommendations: {
            healthcare: healthcareRec || "Clinical consultation review conducted.",
            preventive: preventiveRec || "Continue routine preventive health monitoring.",
            lifestyle: lifestyleRec || "Maintain appropriate nutrition, hydration, and rest.",
            followUp: followupRec || "Re-evaluate as scheduled.",
            healthcareSuggestions: healthcareRec
              ? [healthcareRec]
              : ["Clinical consultation review conducted."],
            preventiveCare: preventiveRec
              ? [preventiveRec]
              : ["Continue routine preventive health monitoring."],
            lifestyleRecommendations: lifestyleRec
              ? [lifestyleRec]
              : ["Maintain appropriate nutrition, hydration, and rest."],
            followUpGuidance: followupRec ? [followupRec] : ["Re-evaluate as scheduled."],
          },
        },
      };

      const updatedHistory = [newHistoryItem, ...(selectedPatient.medicalHistory || [])];

      const response = await fetch(`${API_URL}/api/auth/patients/${selectedPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setSelectedPatient(updatedData);
        setPatients(patients.map((p) => (p._id === updatedData._id ? updatedData : p)));
        toast.success("Advisory successfully saved and transmitted to patient file.");
        setHealthcareRec("");
        setPreventiveRec("");
        setLifestyleRec("");
        setFollowupRec("");
        setClinicianNote("");
      } else {
        toast.error("Failed to save recommendations.");
      }
    } catch (e) {
      toast.error("Server connection lost.");
    }
  };

  const handleReviewAnalysis = async (
    index: number,
    approval: "approved" | "disapproved",
    patientOverride?: Patient,
  ) => {
    const targetPatient = patientOverride || selectedPatient || advisoryModal.patient;
    if (!targetPatient) return;
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const noteText =
        reviewNotes[index] ||
        (approval === "approved"
          ? `Clinical verification completed by Dr. ${parsedUser.name}. Assessment and advisory validated.`
          : `Clinical review by Dr. ${parsedUser.name}: Disapproved pending additional diagnostic investigation.`);

      const updatedHistory = (targetPatient.medicalHistory || []).map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            approvalStatus: approval,
            doctorNotes: noteText,
          };
        }
        return item;
      });

      const response = await fetch(`${API_URL}/api/auth/patients/${targetPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        if (selectedPatient?._id === updatedData._id) {
          setSelectedPatient(updatedData);
        }
        if (advisoryModal.patient?._id === updatedData._id) {
          const updatedReport = updatedData.medicalHistory[index];
          setAdvisoryModal((prev) => ({
            ...prev,
            patient: updatedData,
            report: updatedReport,
          }));
        }
        setPatients(patients.map((p) => (p._id === updatedData._id ? updatedData : p)));
        toast.success(`Assessment report marked as ${approval}.`);
        setReviewNotes({ ...reviewNotes, [index]: "" });
      } else {
        toast.error("Failed to update report verification status.");
      }
    } catch (e) {
      toast.error("Could not reach backend.");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Clinical Decision Support Disclaimer Header */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex items-center justify-between gap-4 text-left shadow-sm">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              AI-Generated Healthcare Advisory — Clinical Decision Support
            </span>
            <span className="text-[11px] text-slate-500 leading-normal">
              AI-generated advisory information. This output does not constitute a medical diagnosis
              or prescription and should be reviewed by a qualified healthcare professional.
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
          Decision Support
        </span>
      </div>

      {/* Active patient overview header context if selected */}
      {selectedPatient && (
        <ActivePatientHeader
          patient={selectedPatient}
          onChangePatient={() => setSelectedPatient(null)}
        />
      )}

      {/* Render Analytics Tab */}
      {activeTab === "analytics" && <HealthcareAnalytics onOpenAdvisory={handleOpenAdvisory} />}

      {/* Render Tab 1: Patient Files */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: "Total Patients",
                val: patients.length.toString(),
                trend: "Registered profiles",
                theme: "text-blue-600",
              },
              {
                title: "High Risk Cases",
                val: patients
                  .filter((p) => p.medicalHistory?.some((h) => h.details?.riskCat === "High Risk"))
                  .length.toString(),
                trend: "Prioritized attention",
                theme: "text-rose-600",
              },
              {
                title: "Moderate Risk",
                val: patients
                  .filter((p) =>
                    p.medicalHistory?.some((h) => h.details?.riskCat === "Moderate Risk"),
                  )
                  .length.toString(),
                trend: "Active monitoring",
                theme: "text-amber-600",
              },
              {
                title: "Clinician Verified",
                val: patients
                  .filter((p) => p.medicalHistory?.some((h) => h.approvalStatus === "approved"))
                  .length.toString(),
                trend: "Approved advisory",
                theme: "text-emerald-600",
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-5"
              >
                <p className="text-[10px] uppercase font-bold text-slate-400">{stat.title}</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {stat.val}
                </h4>
                <p className={`text-[10px] font-bold mt-1 ${stat.theme}`}>{stat.trend}</p>
              </Card>
            ))}
          </div>

          {/* Search bar & registry */}
          <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-855 dark:text-white flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-blue-600" />
                  Patient Files & AI Health Assessments
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Select a record to set as active patient or click "View Advisory" for complete
                  Recommendation Engine output
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/40 dark:border-slate-800 text-xs font-semibold focus:outline-none transition-all"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-855 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-4 py-4">Age / Sex</th>
                    <th className="px-5 py-4">Condition Indication</th>
                    <th className="px-4 py-4 text-center">Confidence</th>
                    <th className="px-4 py-4 text-center">Risk Level</th>
                    <th className="px-4 py-4 text-center">Severity</th>
                    <th className="px-4 py-4">Last Assessment</th>
                    <th className="px-5 py-4 text-right">AI Advisory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-xs text-slate-400 font-semibold"
                      >
                        Loading patient catalog...
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400 italic">
                        No patient records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => {
                      const latestDiag = (p.medicalHistory || []).find(
                        (h) => h.details !== undefined,
                      );
                      const lastVisit =
                        latestDiag?.date ||
                        (p.medicalHistory?.length > 0 ? p.medicalHistory[0].date : "None logged");
                      const isSelected = selectedPatient?._id === p._id;
                      const hasHighRisk =
                        latestDiag?.details?.riskCat === "High Risk" ||
                        p.medicalHistory?.some((h) => h.details?.riskCat === "High Risk");
                      const hasModRisk =
                        latestDiag?.details?.riskCat === "Moderate Risk" ||
                        p.medicalHistory?.some((h) => h.details?.riskCat === "Moderate Risk");

                      const riskText = hasHighRisk
                        ? "High Risk"
                        : hasModRisk
                          ? "Moderate Risk"
                          : "Low Risk";
                      const riskClass = hasHighRisk
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 border-rose-200/50"
                        : hasModRisk
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 border-amber-200/50"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 border-emerald-200/50";

                      const confidenceVal = latestDiag?.details?.primaryProb;
                      const severityVal = latestDiag?.details?.severity || "Moderate";

                      return (
                        <tr
                          key={p._id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/30 transition-all ${
                            isSelected ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                          }`}
                        >
                          {/* Patient name & avatar */}
                          <td
                            className="px-5 py-4 flex items-center gap-3 cursor-pointer"
                            onClick={() => setSelectedPatient(p)}
                          >
                            <div
                              className={`h-9 w-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                hasHighRisk
                                  ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-950/40"
                              }`}
                            >
                              {p.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-855 dark:text-white truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{p.email}</p>
                            </div>
                          </td>

                          {/* Age / Sex */}
                          <td className="px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {p.age} / {p.sex}
                          </td>

                          {/* Condition */}
                          <td className="px-5 py-4">
                            {latestDiag ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                                  {latestDiag.condition}
                                </span>
                                {latestDiag.approvalStatus === "approved" && (
                                  <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" /> Verified
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                No AI assessments
                              </span>
                            )}
                          </td>

                          {/* Confidence */}
                          <td className="px-4 py-4 text-center">
                            {confidenceVal !== undefined ? (
                              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
                                {confidenceVal}%
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Risk Level */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${riskClass}`}
                            >
                              {riskText}
                            </span>
                          </td>

                          {/* Severity */}
                          <td className="px-4 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {latestDiag ? severityVal : "—"}
                          </td>

                          {/* Last Visit */}
                          <td className="px-4 py-4 text-xs font-semibold text-slate-550 font-mono">
                            {lastVisit}
                          </td>

                          {/* AI Advisory Action Button */}
                          <td className="px-5 py-4 text-right">
                            {latestDiag ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAdvisory(p, latestDiag, 0);
                                }}
                                className="h-8 rounded-xl text-xs font-semibold border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Advisory
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedPatient(p);
                                  toast.info(
                                    `Selected ${p.name}. Go to AI Diagnostics to run assessment.`,
                                  );
                                }}
                                className="h-8 rounded-xl text-xs text-slate-400 hover:text-slate-600"
                              >
                                Run Analysis
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Bottom Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-6 flex flex-row items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Add New Patient
                </h4>
                <p className="text-xs text-slate-450 mt-1">Register a new patient record</p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </Card>
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-6 flex flex-row items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Import Records</h4>
                <p className="text-xs text-slate-450 mt-1">Upload patient files in bulk</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toast.info("Bulk import utility available via API pipeline.")}
                className="h-10 w-10 rounded-full border-apple hover:bg-slate-50 text-slate-500 shrink-0 cursor-pointer"
              >
                <Upload className="h-5 w-5" />
              </Button>
            </Card>
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-6 flex flex-row items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Clinical Guidelines
                </h4>
                <p className="text-xs text-slate-450 mt-1">Evidence-based decision protocols</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  toast.info("Clinical guidelines synchronized with WHO & CDC protocols.")
                }
                className="h-10 w-10 rounded-full border-apple hover:bg-slate-50 text-slate-500 shrink-0 cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Render Tab 2: AI Diagnostics */}
      {activeTab === "ai-diagnostics" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Symptom Picker */}
              <div className="lg:col-span-2">
                <SymptomAnalysis
                  user={{ ...selectedPatient, role: "patient" }}
                  onUpdate={(updatedData: any) => {
                    setSelectedPatient(updatedData);
                    setPatients(patients.map((p) => (p._id === updatedData._id ? updatedData : p)));
                  }}
                />
              </div>

              {/* Right Column: AI Diagnostics history verification */}
              <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden flex flex-col h-[700px]">
                <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 shrink-0">
                  <CardTitle className="text-base font-bold text-slate-855 dark:text-white flex items-center gap-2">
                    <Brain className="h-4.5 w-4.5 text-primary" />
                    AI Diagnostics & Advisory History
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Review and clinically verify AI-generated advisories
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto flex-1 space-y-4">
                  {(() => {
                    const analysesWithIndexes = (selectedPatient.medicalHistory || [])
                      .map((item, idx) => ({ item, idx }))
                      .filter(({ item }) => item.details !== undefined);

                    if (analysesWithIndexes.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-400 italic">
                          No previous AI diagnostic reports logged for this patient.
                        </div>
                      );
                    }

                    return analysesWithIndexes.map(({ item, idx }) => {
                      const recs = item.details?.recommendations;
                      return (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/25">
                                  {item.date}
                                </span>
                                {item.details?.primaryProb !== undefined && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">
                                    {item.details.primaryProb}% Match
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1.5 truncate">
                                {item.condition}
                              </h4>
                              {item.details?.riskScore !== undefined && (
                                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                  Risk:{" "}
                                  <span
                                    className={
                                      item.details.riskCat === "High Risk"
                                        ? "text-rose-500 font-bold"
                                        : "text-amber-500 font-bold"
                                    }
                                  >
                                    {item.details.riskCat} ({item.details.riskScore}%)
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Status badge */}
                            {item.approvalStatus === "approved" && (
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1 shrink-0">
                                <Check className="h-3 w-3" /> Approved
                              </span>
                            )}
                            {item.approvalStatus === "disapproved" && (
                              <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-1 shrink-0">
                                <X className="h-3 w-3" /> Disapproved
                              </span>
                            )}
                            {!item.approvalStatus && (
                              <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-amber-100 dark:border-amber-900/30 shrink-0">
                                Pending
                              </span>
                            )}
                          </div>

                          {/* Quick summary of recommendations */}
                          {recs && (
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-350 space-y-1">
                              <span className="font-bold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                AI Healthcare Advisory Summary
                              </span>
                              <p className="line-clamp-2">
                                {recs.healthcareSuggestions
                                  ? recs.healthcareSuggestions[0]
                                  : recs.healthcare}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAdvisory(selectedPatient, item, idx)}
                                className="h-6 text-[10px] text-indigo-600 font-bold p-0 hover:underline cursor-pointer"
                              >
                                View full 5-category advisory →
                              </Button>
                            </div>
                          )}

                          {item.approvalStatus ? (
                            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Clinician Note
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                "{item.doctorNotes || "No notes."}"
                              </p>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-slate-200/20 dark:border-slate-800/50 space-y-3">
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`note-${idx}`}
                                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                >
                                  Verification Note
                                </Label>
                                <Input
                                  id={`note-${idx}`}
                                  placeholder="Clinical verification feedback..."
                                  value={reviewNotes[idx] || ""}
                                  onChange={(e) =>
                                    setReviewNotes({ ...reviewNotes, [idx]: e.target.value })
                                  }
                                  className="h-9 rounded-xl text-xs"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReviewAnalysis(idx, "approved")}
                                  className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReviewAnalysis(idx, "disapproved")}
                                  variant="outline"
                                  className="flex-1 h-9 rounded-xl border-rose-200/50 text-rose-500 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  Disapprove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Default Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Analyses",
                    val: "142",
                    trend: "+18 this week",
                    theme: "text-blue-600",
                  },
                  {
                    title: "High Risk Cases",
                    val: "12",
                    trend: "Needs attention",
                    theme: "text-rose-600",
                  },
                  {
                    title: "AI Accuracy",
                    val: "94%",
                    trend: "This month",
                    theme: "text-emerald-600",
                  },
                  {
                    title: "Avg. Response Time",
                    val: "2.4s",
                    trend: "This month",
                    theme: "text-blue-600",
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-5"
                  >
                    <p className="text-[10px] uppercase font-bold text-slate-400">{stat.title}</p>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                      {stat.val}
                    </h4>
                    <p className={`text-[10px] font-bold mt-1 ${stat.theme}`}>{stat.trend}</p>
                  </Card>
                ))}
              </div>

              {/* Default Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
                  <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                    <CardTitle className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
                      Diagnostics Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { name: "4 May", Analyses: 40, HighRisk: 10 },
                            { name: "5 May", Analyses: 36, HighRisk: 12 },
                            { name: "6 May", Analyses: 48, HighRisk: 8 },
                            { name: "7 May", Analyses: 45, HighRisk: 15 },
                            { name: "8 May", Analyses: 42, HighRisk: 11 },
                            { name: "9 May", Analyses: 50, HighRisk: 13 },
                            { name: "10 May", Analyses: 62, HighRisk: 18 },
                          ]}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(0,0,0,0.03)"
                          />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="Analyses"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="HighRisk"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
                  <CardHeader className="border-b border-slate-50 dark:border-slate-855 p-6">
                    <CardTitle className="text-sm font-bold text-slate-855 dark:text-white">
                      Top Conditions Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="h-[180px] w-[180px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Respiratory", value: 32 },
                              { name: "Cardiovascular", value: 24 },
                              { name: "Neurology", value: 18 },
                              { name: "Endocrine", value: 14 },
                              { name: "Others", value: 12 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-800 dark:text-white">
                          142
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[
                        { name: "Respiratory", val: "32%", col: "bg-blue-500" },
                        { name: "Cardiovascular", val: "24%", col: "bg-emerald-500" },
                        { name: "Neurology", val: "18%", col: "bg-indigo-500" },
                        { name: "Endocrine", val: "14%", col: "bg-amber-500" },
                        { name: "Others", val: "12%", col: "bg-slate-500" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.col}`} />
                            <span className="font-semibold text-slate-655 dark:text-slate-350">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-700 dark:text-white">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Render Tab 3: Clinical Advisory */}
      {activeTab === "clinical-advisory" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Latest AI Recommendation Preview */}
              <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col justify-between">
                <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        AI-Generated Advisory Review
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Generated recommendations based on patient's latest assessment
                      </CardDescription>
                    </div>
                    {(() => {
                      const latestDiag = (selectedPatient.medicalHistory || []).find(
                        (h) => h.details !== undefined,
                      );
                      if (!latestDiag) return null;
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const recs = latestDiag.details?.recommendations;
                            if (recs) {
                              setHealthcareRec(
                                recs.healthcareSuggestions
                                  ? recs.healthcareSuggestions[0]
                                  : recs.healthcare || "",
                              );
                              setPreventiveRec(
                                recs.preventiveCare
                                  ? recs.preventiveCare[0]
                                  : recs.preventive || "",
                              );
                              setLifestyleRec(
                                recs.lifestyleRecommendations
                                  ? recs.lifestyleRecommendations[0]
                                  : recs.lifestyle || "",
                              );
                              setFollowupRec(
                                recs.followUpGuidance
                                  ? recs.followUpGuidance[0]
                                  : recs.followUp || "",
                              );
                              toast.success("Auto-filled editor with AI recommendations.");
                            }
                          }}
                          className="rounded-xl text-xs font-semibold text-indigo-600 border-indigo-200 dark:border-indigo-900/40"
                        >
                          Auto-Populate Form
                        </Button>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-4 flex-1 overflow-y-auto">
                  {(() => {
                    const latestDiag = (selectedPatient.medicalHistory || []).find(
                      (h) => h.details !== undefined,
                    );

                    if (!latestDiag) {
                      return (
                        <div className="py-12 text-center text-xs text-slate-400 italic">
                          No AI diagnostic assessments found for {selectedPatient.name}. Please run
                          a symptom analysis first.
                        </div>
                      );
                    }

                    const recs = latestDiag.details?.recommendations;

                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/30 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 dark:text-white">
                              Condition: {latestDiag.condition}
                            </span>
                            <span className="font-bold text-blue-600">
                              Confidence: {latestDiag.details?.primaryProb || 80}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Risk Index: {latestDiag.details?.riskScore || 50}% (
                            {latestDiag.details?.riskCat || "Moderate Risk"}) | Severity:{" "}
                            {latestDiag.details?.severity || "Moderate"}
                          </p>
                        </div>

                        {recs?.warningSigns && recs.warningSigns.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                            <span className="font-bold uppercase text-[10px] text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Critical Red Flags
                            </span>
                            <p>{recs.warningSigns[0]}</p>
                          </div>
                        )}

                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-blue-600 block mb-1">
                              Healthcare Suggestion:
                            </span>
                            <p className="text-slate-600 dark:text-slate-350">
                              {recs?.healthcareSuggestions
                                ? recs.healthcareSuggestions[0]
                                : recs?.healthcare || "Consult GP."}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-emerald-600 block mb-1">
                              Preventive Advice:
                            </span>
                            <p className="text-slate-600 dark:text-slate-350">
                              {recs?.preventiveCare
                                ? recs.preventiveCare[0]
                                : recs?.preventive || "Monitor vitals."}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-indigo-600 block mb-1">
                              Lifestyle & Recovery:
                            </span>
                            <p className="text-slate-600 dark:text-slate-350">
                              {recs?.lifestyleRecommendations
                                ? recs.lifestyleRecommendations[0]
                                : recs?.lifestyle || "Rest and hydrate."}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-amber-600 block mb-1">
                              Follow-Up Guidance:
                            </span>
                            <p className="text-slate-600 dark:text-slate-350">
                              {recs?.followUpGuidance
                                ? recs.followUpGuidance[0]
                                : recs?.followUp || "Follow up if symptoms persist."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Right Column: Clinician Customization Form */}
              <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col justify-between">
                <CardHeader className="border-b border-slate-50 dark:border-slate-855 p-6 sm:p-8">
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Clinician-Reviewed Advisory & Plan
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Customize and approve advisory recommendations to transmit to the patient
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rec-health"
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Healthcare Guidance
                      </Label>
                      <Input
                        id="rec-health"
                        placeholder="e.g. Consult Pulmonologist, Chest X-ray"
                        value={healthcareRec}
                        onChange={(e) => setHealthcareRec(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rec-prev"
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Preventive Care
                      </Label>
                      <Input
                        id="rec-prev"
                        placeholder="e.g. Daily BP & SpO2 tracking"
                        value={preventiveRec}
                        onChange={(e) => setPreventiveRec(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rec-life"
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Diet & Lifestyle
                      </Label>
                      <Input
                        id="rec-life"
                        placeholder="e.g. Hydration 2.5L, Low sodium nutrition"
                        value={lifestyleRec}
                        onChange={(e) => setLifestyleRec(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rec-follow"
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Follow-up Timeline
                      </Label>
                      <Input
                        id="rec-follow"
                        placeholder="e.g. Clinical review in 3 days"
                        value={followupRec}
                        onChange={(e) => setFollowupRec(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="rec-clinician-note"
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      Attending Clinician's Notes
                    </Label>
                    <Input
                      id="rec-clinician-note"
                      placeholder="e.g. Patient advised on red-flag symptoms. Inhaler technique reviewed."
                      value={clinicianNote}
                      onChange={(e) => setClinicianNote(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <Button
                    onClick={handleSaveRecommendations}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold shadow-apple text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Save & Transmit Clinician Advisory
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Default Clinical Advisory Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Treatment Protocols", desc: "Evidence-based guidelines" },
                  { title: "Drug Interactions", desc: "Contraindications & risks" },
                  { title: "Clinical Pathways", desc: "Standardized care steps" },
                  { title: "Safety Red Flags", desc: "Emergency escalation triggers" },
                ].map((card, i) => (
                  <Card
                    key={i}
                    className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[20px] p-5"
                  >
                    <h4 className="text-xs font-bold text-slate-855 dark:text-white">
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1">{card.desc}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Evidence-Based Clinical Guidelines
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Hypertension Clinical Guidelines 2025",
                        desc: "Target BP < 130/80 mmHg; DASH dietary protocol & monitoring.",
                      },
                      {
                        title: "Dengue Clinical Management Protocols",
                        desc: "Fluid maintenance, daily platelet logs, strict avoidance of NSAIDs.",
                      },
                      {
                        title: "Type 2 Diabetes Glycemic Targets",
                        desc: "HbA1c target < 7.0%, SMBG tracking, annual microvascular screening.",
                      },
                    ].map((rec, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-slate-855 dark:text-white">
                            {rec.title}
                          </h5>
                          <p className="text-[10px] text-slate-450 mt-0.5">{rec.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Clinical Decision Alerts
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        text: "Dengue alert: Monitor critical phase closely (Days 3-7) for plasma leakage.",
                        type: "warning",
                      },
                      {
                        text: "Cardiovascular alert: High risk detected in patient baseline profile.",
                        type: "error",
                      },
                      {
                        text: "Respiratory alert: Seasonal influenza & RSV advisory in effect.",
                        type: "info",
                      },
                    ].map((alert, i) => (
                      <div
                        key={i}
                        className={`p-4 border rounded-2xl flex items-center gap-3 ${
                          alert.type === "error"
                            ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-955/20"
                            : alert.type === "warning"
                              ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-955/20"
                              : "bg-sky-50 border-sky-100 text-sky-600 dark:bg-sky-955/20"
                        }`}
                      >
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                        <span className="text-xs font-semibold">{alert.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Render Tab 4: History Timeline */}
      {activeTab === "history-timeline" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Timeline Sidebar Filters */}
              <Card className="lg:col-span-1 border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl p-4 flex flex-col gap-2 shrink-0 h-fit">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white px-2 mb-2">
                  Filters
                </h4>
                {["All Events", "Consultation", "Prescription", "Lab Report", "Diagnosis"].map(
                  (filter) => {
                    const isActive = timelineFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setTimelineFilter(filter)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-50/80 text-blue-600 dark:bg-blue-955/20"
                            : "hover:bg-slate-50 text-slate-500"
                        }`}
                      >
                        {filter}s
                      </button>
                    );
                  },
                )}
              </Card>

              {/* Timeline content & event log form */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                  <CardHeader className="border-b border-slate-50 dark:border-slate-855 p-6 sm:p-8">
                    <CardTitle className="text-base font-bold text-slate-855 dark:text-white flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-indigo-500" />
                      Add Timeline Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <form onSubmit={handleAddTimeline} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="add-hdate"
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                          >
                            Date
                          </Label>
                          <Input
                            id="add-hdate"
                            type="date"
                            value={newHistDate}
                            onChange={(e) => setNewHistDate(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="add-htype"
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                          >
                            Type
                          </Label>
                          <select
                            id="add-htype"
                            value={newHistType}
                            onChange={(e) => setNewHistType(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-transparent text-xs"
                          >
                            <option value="Diagnosis">Diagnosis</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Prescription">Prescription</option>
                            <option value="Lab Report">Lab Report</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="add-hcond"
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                          >
                            Description
                          </Label>
                          <Input
                            id="add-hcond"
                            placeholder="e.g. Pneumonia"
                            value={newHistCond}
                            onChange={(e) => setNewHistCond(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="add-hnotes"
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Details
                        </Label>
                        <Input
                          id="add-hnotes"
                          placeholder="e.g. Complete recovery..."
                          value={newHistNotes}
                          onChange={(e) => setNewHistNotes(e.target.value)}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs px-5 shadow-apple flex items-center gap-1.5"
                      >
                        <Plus className="h-4.5 w-4.5" /> Add to Timeline
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                  <CardHeader className="border-b border-slate-50 dark:border-slate-855 p-6">
                    <CardTitle className="text-base font-bold text-slate-855 dark:text-white">
                      Patient History Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 overflow-y-auto max-h-[500px]">
                    <div className="relative border-l border-slate-100 dark:border-slate-800 ml-4 space-y-6 py-2">
                      {(() => {
                        const list = (selectedPatient.medicalHistory || []).filter(
                          (h) => timelineFilter === "All Events" || h.type === timelineFilter,
                        );

                        if (list.length === 0) {
                          return (
                            <div className="pl-6 text-slate-400 text-xs italic">
                              No entries match this filter.
                            </div>
                          );
                        }

                        return list.map((item, idx) => (
                          <div key={idx} className="relative pl-6 md:pl-8 group">
                            <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-sm" />

                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-550 font-mono bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg">
                                    {item.date}
                                  </span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-600">
                                    {item.type}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-850 dark:text-white">
                                  {item.condition}
                                </h4>
                                {item.notes && (
                                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => handleRemoveTimeline(idx)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-650 cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 rounded-[28px] border border-apple shadow-apple text-center">
              <Users className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                No Patient Selected
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a patient from Patient Files to view records.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Render Tab 5: Profile Management */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <ProfileManagement
              user={{ ...selectedPatient, role: "patient" }}
              onUpdate={(updatedPatient: any) => {
                setSelectedPatient(updatedPatient);
                setPatients(
                  patients.map((p) => (p._id === updatedPatient._id ? updatedPatient : p)),
                );
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 rounded-[28px] border border-apple shadow-apple text-center">
              <Users className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                No Patient Selected
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a patient from Patient Files to view records.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Render Tab 6: Patient Analytics */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {selectedPatient ? (
            <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6">
                <CardTitle className="text-sm font-bold text-slate-855 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
                  Patient Health & Risk Score Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Historical tracking of AI diagnostics severity index
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {(() => {
                  const chartData = (selectedPatient.medicalHistory || [])
                    .filter((item: any) => item.details?.riskScore !== undefined)
                    .map((item: any) => ({
                      date: item.date,
                      riskScore: item.details.riskScore,
                    }))
                    .reverse();

                  if (chartData.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        No risk score progression metrics cataloged.
                      </div>
                    );
                  }

                  return (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="patientLatency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(0,0,0,0.03)"
                          />
                          <XAxis
                            dataKey="date"
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
                          <RechartsTooltip />
                          <Area
                            type="monotone"
                            dataKey="riskScore"
                            name="Risk Score (%)"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#patientLatency)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <SystemPerformance />
          )}
        </div>
      )}

      {/* DEDICATED "VIEW ADVISORY" MODAL */}
      {advisoryModal.open && advisoryModal.patient && advisoryModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6 flex flex-row items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
                    AI-Generated Healthcare Advisory — Decision Support
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Assessment for {advisoryModal.patient.name} ({advisoryModal.patient.age} y/o{" "}
                  {advisoryModal.patient.sex}) • Date: {advisoryModal.report.date}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {advisoryModal.reportIdx !== null && (
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-8"
                    onClick={() =>
                      handleDownloadPDF(
                        advisoryModal.patient!._id,
                        advisoryModal.report,
                        advisoryModal.reportIdx!,
                      )
                    }
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setAdvisoryModal({ open: false, patient: null, report: null, reportIdx: null })
                  }
                  className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Modal Body */}
            <CardContent className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
              {/* Decision support banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
                <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  AI-generated advisory information. This output does not constitute a medical
                  diagnosis or prescription and should be reviewed by a qualified healthcare
                  professional.
                </span>
              </div>

              {/* Assessment Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Condition Indication
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-white truncate block">
                    {advisoryModal.report.condition}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Model Confidence
                  </span>
                  <span className="text-sm font-black text-blue-600">
                    {advisoryModal.report.details?.primaryProb || 80}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Risk Evaluation
                  </span>
                  <span
                    className={`text-xs font-extrabold uppercase ${
                      advisoryModal.report.details?.riskCat === "High Risk"
                        ? "text-rose-600"
                        : advisoryModal.report.details?.riskCat === "Moderate Risk"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {advisoryModal.report.details?.riskCat || "Low Risk"} (
                    {advisoryModal.report.details?.riskScore || 50}%)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Severity Level
                  </span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                    {advisoryModal.report.details?.severity || "Moderate"}
                  </span>
                </div>
              </div>

              {/* Reported Symptoms */}
              {advisoryModal.report.details?.symptoms && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-400 text-[10px] uppercase mr-1">
                    Reported Symptoms:
                  </span>
                  {advisoryModal.report.details.symptoms.map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[11px] border border-slate-200/40"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Uncertainty Warning if low confidence */}
              {advisoryModal.report.details?.uncertaintyNote && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{advisoryModal.report.details.uncertaintyNote}</span>
                </div>
              )}

              {/* Warning signs if present */}
              {advisoryModal.report.details?.recommendations?.warningSigns &&
                advisoryModal.report.details.recommendations.warningSigns.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 space-y-2">
                    <h5 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-600" /> Critical Warning Signs / Red
                      Flags
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {advisoryModal.report.details.recommendations.warningSigns.map(
                        (sign: string, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2 text-xs text-rose-850 dark:text-rose-300"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{sign}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* 4 Core Recommendation Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Healthcare suggestions */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5" /> Healthcare Suggestions
                  </span>
                  {advisoryModal.report.details?.recommendations?.healthcareSuggestions ? (
                    <ul className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                      {advisoryModal.report.details.recommendations.healthcareSuggestions.map(
                        (item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {advisoryModal.report.details?.recommendations?.healthcare}
                    </p>
                  )}
                </div>

                {/* Preventive Care */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Preventive Care
                  </span>
                  {advisoryModal.report.details?.recommendations?.preventiveCare ? (
                    <ul className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                      {advisoryModal.report.details.recommendations.preventiveCare.map(
                        (item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {advisoryModal.report.details?.recommendations?.preventive}
                    </p>
                  )}
                </div>

                {/* Lifestyle & Recovery */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Lifestyle Recommendations
                  </span>
                  {advisoryModal.report.details?.recommendations?.lifestyleRecommendations ? (
                    <ul className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                      {advisoryModal.report.details.recommendations.lifestyleRecommendations.map(
                        (item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {advisoryModal.report.details?.recommendations?.lifestyle}
                    </p>
                  )}
                </div>

                {/* Follow-up Guidance */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Follow-Up Timeline
                  </span>
                  {advisoryModal.report.details?.recommendations?.followUpGuidance ? (
                    <ul className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                      {advisoryModal.report.details.recommendations.followUpGuidance.map(
                        (item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {advisoryModal.report.details?.recommendations?.followUp}
                    </p>
                  )}
                </div>
              </div>

              {/* Clinician Review & Verification Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Clinician Verification & Review
                  </span>
                  {advisoryModal.report.approvalStatus === "approved" && (
                    <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-emerald-100">
                      ✓ Approved
                    </span>
                  )}
                  {advisoryModal.report.approvalStatus === "disapproved" && (
                    <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-rose-100">
                      ✕ Disapproved
                    </span>
                  )}
                </div>

                {advisoryModal.report.doctorNotes && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
                    <span className="font-bold text-slate-800 dark:text-slate-200 not-italic block mb-0.5">
                      Existing Clinician Note:
                    </span>
                    "{advisoryModal.report.doctorNotes}"
                  </div>
                )}

                {advisoryModal.reportIdx !== null && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Doctor Verification Note
                      </Label>
                      <Input
                        placeholder="Add clinician verification or diagnostic guidance note..."
                        value={reviewNotes[advisoryModal.reportIdx] || ""}
                        onChange={(e) =>
                          setReviewNotes({
                            ...reviewNotes,
                            [advisoryModal.reportIdx!]: e.target.value,
                          })
                        }
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          handleReviewAnalysis(
                            advisoryModal.reportIdx!,
                            "approved",
                            advisoryModal.patient!,
                          )
                        }
                        className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Approve & Sign Advisory
                      </Button>
                      <Button
                        onClick={() =>
                          handleReviewAnalysis(
                            advisoryModal.reportIdx!,
                            "disapproved",
                            advisoryModal.patient!,
                          )
                        }
                        variant="outline"
                        className="flex-1 h-10 rounded-xl border-rose-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="h-4 w-4" /> Disapprove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-855 dark:text-white">
                  Register New Patient
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Create new patient profile
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Full Name
                    </Label>
                    <Input
                      required
                      value={newPatientData.name}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Email Address
                    </Label>
                    <Input
                      required
                      type="email"
                      value={newPatientData.email}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, email: e.target.value })
                      }
                      placeholder="john@doe.com"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Age
                    </Label>
                    <Input
                      required
                      type="number"
                      value={newPatientData.age}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, age: Number(e.target.value) })
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sex
                    </Label>
                    <select
                      value={newPatientData.sex}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, sex: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-transparent text-xs"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Height (cm)
                    </Label>
                    <Input
                      required
                      type="number"
                      value={newPatientData.height}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, height: Number(e.target.value) })
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Weight (kg)
                    </Label>
                    <Input
                      required
                      type="number"
                      value={newPatientData.weight}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, weight: Number(e.target.value) })
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold mt-4 cursor-pointer"
                >
                  Register Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

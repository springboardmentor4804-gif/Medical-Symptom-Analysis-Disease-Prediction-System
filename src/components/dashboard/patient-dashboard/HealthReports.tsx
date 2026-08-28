/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { UserData } from "@/app/dashboard/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  Check,
  X,
  Clock,
  Stethoscope,
  ShieldCheck,
  Heart,
  AlertTriangle,
  Info,
  ShieldAlert,
  Brain,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ReportsProps {
  user: UserData;
}

export default function HealthReports({ user }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<{ report: any; idx: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const reports = (user.medicalHistory || []).filter(
    (item) => item.type === "Diagnosis" || item.details !== undefined,
  );

  const handleDownloadPDF = async (report: any, idx: number) => {
    setIsDownloading(true);
    const storedUserStr = localStorage.getItem("user");
    let token = "";
    if (storedUserStr) {
      token = JSON.parse(storedUserStr).token;
    }

    try {
      toast.info("Generating PDF report...", { id: "pdf-gen" });
      const res = await fetch(`${API_URL}/api/reports/${user._id}/${idx}/pdf`, {
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

  return (
    <>
      <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8">
          <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-800 dark:text-white">
            <FileText className="h-5 w-5 text-indigo-500" />
            Health Reports & AI Diagnoses
          </CardTitle>
          <CardDescription className="text-slate-400">
            Access diagnostic reports, AI advisory summaries, and clinical verification
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No diagnostic reports logged yet. Run a symptom analysis to generate your first
              report.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report, idx) => {
                const isHighRisk = report.details?.riskCat === "High Risk";
                const isModRisk = report.details?.riskCat === "Moderate Risk";

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-5 shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/25">
                          {report.date}
                        </span>
                        {report.details?.riskCat && (
                          <span
                            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isHighRisk
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                                : isModRisk
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                            }`}
                          >
                            {report.details.riskCat} ({report.details.riskScore || 50}%)
                          </span>
                        )}
                        {report.details?.primaryProb !== undefined && (
                          <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            Confidence: {report.details.primaryProb}%
                          </span>
                        )}
                        {report.approvalStatus === "approved" && (
                          <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Clinician Approved
                          </span>
                        )}
                        {report.approvalStatus === "disapproved" && (
                          <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-100 dark:border-rose-900/30 flex items-center gap-1">
                            <X className="h-3 w-3" /> Clinician Refused
                          </span>
                        )}
                        {!report.approvalStatus && report.details !== undefined && (
                          <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/20 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-100 dark:border-amber-900/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pending Review
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        {report.condition} Diagnostic Report
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl line-clamp-1">
                        {report.notes || "Report processed with AI medical classification engine."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport({ report, idx })}
                        className="rounded-xl text-xs font-semibold px-3 py-1.5 h-8 cursor-pointer flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Report
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadPDF(report, idx)}
                        disabled={isDownloading}
                        className="rounded-xl text-xs font-semibold px-3 py-1.5 h-8 cursor-pointer flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview Modal */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-apple shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-row justify-between items-start space-y-0">
            <div>
              <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
                MEDASSIST AI
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium mt-1">
                AI Medical Symptom Analysis & Disease Prediction Report
              </DialogDescription>
            </div>
            {selectedReport && (
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                onClick={() => handleDownloadPDF(selectedReport.report, selectedReport.idx)}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            {selectedReport &&
              (() => {
                const { report, idx } = selectedReport;
                const details = report.details || {};
                const recs = details.recommendations || {};
                const reportId = `MED-${new Date().getFullYear()}-${user._id.slice(-4)}-${idx.toString().padStart(3, "0")}`;
                const isEmergency = details.isEmergency;

                return (
                  <div className="space-y-8 pb-10">
                    {/* Report Info */}
                    <div className="flex flex-wrap gap-x-12 gap-y-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white mb-1">Report ID</p>
                        <p className="text-slate-600 dark:text-slate-400 font-mono">{reportId}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white mb-1">
                          Assessment Date
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {report.date || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Patient Info */}
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white mb-1">
                            Patient ID
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 truncate">{user._id}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white mb-1">
                            Patient Name
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {user.name || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white mb-1">Age</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {user.age || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white mb-1">Gender</p>
                          <p className="text-slate-600 dark:text-slate-400 capitalize">
                            {user.sex === "m"
                              ? "Male"
                              : user.sex === "f"
                                ? "Female"
                                : user.sex || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Symptoms & Medical History */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">
                          Reported Symptoms
                        </h3>
                        {details.symptoms && details.symptoms.length > 0 ? (
                          <ul className="space-y-1.5">
                            {details.symptoms.map((s: string, i: number) => (
                              <li
                                key={i}
                                className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                              >
                                <span className="text-indigo-400">•</span>{" "}
                                <span className="capitalize">{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500">Not provided</p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">
                          Medical History
                        </h3>
                        {user.chronicConditions?.length || user.allergies?.length ? (
                          <div className="space-y-3">
                            {user.chronicConditions && user.chronicConditions.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Chronic Conditions:
                                </p>
                                <ul className="space-y-1">
                                  {user.chronicConditions.map((c: string, i: number) => (
                                    <li
                                      key={i}
                                      className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                                    >
                                      <span className="text-indigo-400">•</span> <span>{c}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {user.allergies && user.allergies.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Allergies:
                                </p>
                                <ul className="space-y-1">
                                  {user.allergies.map((a: string, i: number) => (
                                    <li
                                      key={i}
                                      className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                                    >
                                      <span className="text-indigo-400">•</span> <span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Not provided</p>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* AI Prediction & Risk */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                        <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Brain className="h-4 w-4" /> AI Disease Prediction
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-indigo-700/70 dark:text-indigo-400 mb-0.5">
                              Possible Condition:
                            </p>
                            <p className="text-base font-black text-indigo-950 dark:text-white">
                              {report.condition || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-700/70 dark:text-indigo-400 mb-0.5">
                              Model Confidence:
                            </p>
                            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                              {details.primaryProb}%
                            </p>
                          </div>

                          {details.secondaryPredictions &&
                            details.secondaryPredictions.length > 0 && (
                              <div className="pt-2">
                                <p className="text-xs font-bold text-indigo-700/70 dark:text-indigo-400 mb-1">
                                  Other Probabilities:
                                </p>
                                <ul className="space-y-1">
                                  {details.secondaryPredictions.map((p: any, i: number) => (
                                    <li
                                      key={i}
                                      className="text-xs text-indigo-900 dark:text-indigo-200 flex justify-between"
                                    >
                                      <span>{p.name}</span>
                                      <span className="font-bold">{p.probability}%</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>

                      <div
                        className={`p-5 rounded-2xl border ${isEmergency || details.riskCat === "High Risk" ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30" : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800"}`}
                      >
                        <h3
                          className={`text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${isEmergency || details.riskCat === "High Risk" ? "text-rose-700 dark:text-rose-400" : "text-slate-800 dark:text-slate-300"}`}
                        >
                          <AlertTriangle className="h-4 w-4" /> Risk Assessment
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-slate-500 mb-0.5">Risk Level:</p>
                            <p
                              className={`text-base font-black ${isEmergency || details.riskCat === "High Risk" ? "text-rose-700 dark:text-rose-400" : "text-slate-800 dark:text-white"}`}
                            >
                              {details.riskCat || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 mb-0.5">Risk Score:</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {details.riskScore || 0} / 100
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 mb-0.5">Severity:</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {details.severity || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* AI Healthcare Advisory */}
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                        AI Healthcare Advisory
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recs.warningSigns && recs.warningSigns.length > 0 && (
                          <div className="md:col-span-2 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30">
                            <h4 className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <ShieldAlert className="h-4 w-4" /> Warning Signs & Red Flags
                            </h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {recs.warningSigns.map((sign: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300"
                                >
                                  <span className="text-rose-500">•</span> {sign}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recs.healthcareSuggestions && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2">
                              <Stethoscope className="h-3.5 w-3.5" /> Healthcare Suggestions
                            </h4>
                            <ul className="space-y-1.5">
                              {recs.healthcareSuggestions.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                                >
                                  <span className="text-blue-500 font-bold">•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recs.preventiveCare && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                              <ShieldCheck className="h-3.5 w-3.5" /> Preventive Care
                            </h4>
                            <ul className="space-y-1.5">
                              {recs.preventiveCare.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                                >
                                  <span className="text-emerald-500 font-bold">•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recs.lifestyleRecommendations && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                              <Heart className="h-3.5 w-3.5" /> Lifestyle & Nutrition
                            </h4>
                            <ul className="space-y-1.5">
                              {recs.lifestyleRecommendations.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                                >
                                  <span className="text-indigo-500 font-bold">•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recs.followUpGuidance && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                              <Clock className="h-3.5 w-3.5" /> Follow-Up Timeline
                            </h4>
                            <ul className="space-y-1.5">
                              {recs.followUpGuidance.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                                >
                                  <span className="text-amber-500 font-bold">•</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {details.uncertaintyNote && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{details.uncertaintyNote}</span>
                      </div>
                    )}

                    {/* Medical Disclaimer */}
                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        <strong>Medical Disclaimer:</strong> This report contains AI-generated
                        information intended for educational and informational purposes only. AI
                        predictions are not a medical diagnosis, prescription, or substitute for
                        professional medical advice. The prediction confidence represents the
                        model's output and does not indicate medical certainty. Consult a qualified
                        healthcare professional for diagnosis, treatment, and medical decisions.
                      </p>
                    </div>
                  </div>
                );
              })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
  ChevronDown,
  ChevronUp,
  Stethoscope,
  ShieldCheck,
  Heart,
  AlertTriangle,
  Info,
  ShieldAlert,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportsProps {
  user: UserData;
}

export default function HealthReports({ user }: ReportsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const reports = (user.medicalHistory || []).filter(
    (item) => item.type === "Diagnosis" || item.details !== undefined,
  );

  const toggleExpand = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  const handleDownload = (report: any) => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MedAssist_${report.condition?.replace(/\s+/g, "_")}_${report.date?.replace(/\//g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
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
            No diagnostic reports logged yet. Run a symptom analysis to generate your first report.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, idx) => {
              const isExpanded = expandedIdx === idx;
              const recs = report.details?.recommendations;
              const isHighRisk = report.details?.riskCat === "High Risk";
              const isModRisk = report.details?.riskCat === "Moderate Risk";

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-5 space-y-4 shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1.5 flex-1">
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
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {report.notes || "Report processed with AI medical classification engine."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(idx)}
                        className="rounded-xl text-xs font-semibold px-3 py-1.5 h-8 cursor-pointer flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Hide Advisory <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            View Advisory <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(report)}
                        className="h-8 w-8 rounded-xl border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 cursor-pointer shrink-0"
                        title="Download JSON Report"
                      >
                        <Download className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Clinician Note */}
                  {report.doctorNotes && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      <span className="font-bold text-slate-800 dark:text-slate-200 not-italic block mb-0.5">
                        Clinician Note:
                      </span>
                      "{report.doctorNotes}"
                    </div>
                  )}

                  {/* Expandable Recommendation Details */}
                  {isExpanded && recs && (
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                      {/* Warning signs if present */}
                      {recs.warningSigns && recs.warningSigns.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 space-y-1.5">
                          <h5 className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 text-rose-600" /> Warning Signs & Red
                            Flags
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {recs.warningSigns.map((sign: string, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300"
                              >
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span>{sign}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Healthcare suggestions */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Stethoscope className="h-3.5 w-3.5" /> Healthcare Suggestions
                          </span>
                          {recs.healthcareSuggestions ? (
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-350">
                              {recs.healthcareSuggestions.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-blue-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {recs.healthcare || "Consult GP."}
                            </p>
                          )}
                        </div>

                        {/* Preventive Care */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Preventive Care
                          </span>
                          {recs.preventiveCare ? (
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-350">
                              {recs.preventiveCare.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {recs.preventive || "Monitor vitals."}
                            </p>
                          )}
                        </div>

                        {/* Lifestyle Advice */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> Lifestyle & Nutrition
                          </span>
                          {recs.lifestyleRecommendations ? (
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-350">
                              {recs.lifestyleRecommendations.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-indigo-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {recs.lifestyle || "Rest and hydrate."}
                            </p>
                          )}
                        </div>

                        {/* Follow-Up Guidance */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Follow-Up Timeline
                          </span>
                          {recs.followUpGuidance ? (
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-350">
                              {recs.followUpGuidance.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {recs.followUp || "Follow up if symptoms persist."}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Uncertainty Note if applicable */}
                      {report.details?.uncertaintyNote && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{report.details.uncertaintyNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

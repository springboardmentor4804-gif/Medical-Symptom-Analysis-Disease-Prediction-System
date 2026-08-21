"use client";

import { API_URL } from "@/config";
import { useState } from "react";
import { UserData } from "@/app/dashboard/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { History, PlusCircle, X, Plus } from "lucide-react";

interface MedicalHistoryProps {
  user: UserData;
  onUpdate: (updatedUser: UserData) => void;
}

export default function MedicalHistory({ user, onUpdate }: MedicalHistoryProps) {
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("Diagnosis");
  const [newCond, setNewCond] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newCond) {
      toast.error("Please fill in Date and Event Description.");
      return;
    }

    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const newHistoryItem = {
        date: newDate,
        type: newType,
        condition: newCond,
        notes: newNotes,
      };

      const updatedHistory = [newHistoryItem, ...(user.medicalHistory || [])];

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        const newLocalStorageUser = { ...parsedUser, ...updatedData };
        localStorage.setItem("user", JSON.stringify(newLocalStorageUser));
        onUpdate(updatedData);
        toast.success("Event added successfully!");
        setNewDate("");
        setNewCond("");
        setNewNotes("");
      } else {
        toast.error("Failed to add event to medical timeline.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach server.");
    }
  };

  const handleRemoveEvent = async (idxToRemove: number) => {
    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;

      const updatedHistory = (user.medicalHistory || []).filter((_, idx) => idx !== idxToRemove);

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicalHistory: updatedHistory }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        const newLocalStorageUser = { ...parsedUser, ...updatedData };
        localStorage.setItem("user", JSON.stringify(newLocalStorageUser));
        onUpdate(updatedData);
        toast.success("Event removed.");
      } else {
        toast.error("Failed to remove event.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach server.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Add History Form */}
      <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-500" />
            Add Historical Event
          </CardTitle>
          <CardDescription className="text-slate-400">
            Keep your clinical milestones up to date
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="hist-date"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Event Date
                </Label>
                <Input
                  id="hist-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="hist-type"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Event Type
                </Label>
                <select
                  id="hist-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none"
                >
                  <option value="Diagnosis">Diagnosis</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Hospitalization">Hospitalization</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="hist-desc"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Event Description
                </Label>
                <Input
                  id="hist-desc"
                  placeholder="e.g. Allergy treatment"
                  value={newCond}
                  onChange={(e) => setNewCond(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="hist-notes"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Clinical Details / Treatment Notes
              </Label>
              <Input
                id="hist-notes"
                placeholder="e.g. Completed course of antihistamines..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs px-5 shadow-apple flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Add to Timeline
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: History Timeline List */}
      <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col max-h-[500px]">
        <CardHeader className="border-b border-slate-50 dark:border-slate-850 p-6 sm:p-8 shrink-0">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Clinical Reports & Analysis Records
          </CardTitle>
          <CardDescription className="text-slate-405">
            Chronological history of diagnostic and clinical updates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 overflow-y-auto flex-1">
          <div className="relative border-l border-slate-100 dark:border-slate-800 ml-4 space-y-6 py-2">
            {(user.medicalHistory || []).length === 0 ? (
              <div className="pl-6 text-slate-400 text-xs italic">No timeline entries found.</div>
            ) : (
              (user.medicalHistory || []).map((item, idx) => (
                <div key={idx} className="relative pl-6 md:pl-8 group">
                  <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-sm" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-855 px-2 py-0.5 rounded-lg border border-slate-200/25">
                          {item.date}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.type === "Surgery"
                              ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20"
                              : item.type === "Vaccination"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20"
                                : item.type === "Hospitalization"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20"
                                  : "bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/20"
                          }`}
                        >
                          {item.type}
                        </span>

                        {/* Approval Badges */}
                        {item.approvalStatus === "approved" && (
                          <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-0.5">
                            Approved
                          </span>
                        )}
                        {item.approvalStatus === "disapproved" && (
                          <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30 flex items-center gap-0.5">
                            Disapproved
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-white">
                        {item.condition}
                      </h4>
                      {item.notes && (
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          {item.notes}
                        </p>
                      )}
                      {item.doctorNotes && (
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic mt-1 max-w-xl">
                          <strong className="not-italic text-slate-600 dark:text-slate-350">
                            Clinician:{" "}
                          </strong>
                          "{item.doctorNotes}"
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveEvent(idx)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 cursor-pointer transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

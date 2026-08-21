/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivePatientHeaderProps {
  patient: any;
  onChangePatient: () => void;
}

export default function ActivePatientHeader({
  patient,
  onChangePatient,
}: ActivePatientHeaderProps) {
  if (!patient) return null;
  return (
    <div className="bg-gradient-to-r from-blue-500/[0.06] to-transparent p-6 rounded-[24px] border border-blue-100/10 shadow-apple flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
          {patient.name
            ? patient.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)
            : "P"}
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2">
            {patient.name}
            <span className="text-xs font-bold bg-blue-100/60 dark:bg-blue-950/60 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100/40">
              Active Patient
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Age: {patient.age} | Sex: {patient.sex} | Phone: {patient.phone || "N/A"} | ID: #
            {patient._id?.substring(0, 8)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
        <div className="flex gap-4 text-center bg-white/70 dark:bg-slate-900/70 border border-apple p-3.5 rounded-2xl shadow-sm shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Type</span>
            <span className="text-sm font-extrabold text-blue-600">
              {patient.bloodType || "O+"}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Weight</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">
              {patient.weight || 70} kg
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Height</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">
              {patient.height || 170} cm
            </span>
          </div>
        </div>

        <Button
          onClick={onChangePatient}
          variant="outline"
          className="h-10 rounded-xl border-rose-200/50 hover:bg-rose-50 hover:text-rose-600 text-rose-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <X className="h-3.5 w-3.5" /> Change Patient
        </Button>
      </div>
    </div>
  );
}

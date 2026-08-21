"use client";

import Link from "next/link";
import { UserCircle, Mail, Activity } from "lucide-react";

interface PatientCardProps {
  patient: any;
}

export default function PatientCard({
  patient,
}: PatientCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl">

      <div className="flex items-center gap-4">

        <UserCircle
          size={60}
          className="text-sky-700"
        />

        <div>

          <h3 className="text-xl font-bold">
            {patient.full_name}
          </h3>

          <p className="mt-1 flex items-center gap-2 text-gray-500">
            <Mail size={16} />
            {patient.email}
          </p>

        </div>

      </div>

      <div className="mt-6 space-y-3">

        <Link
          href={`/doctor/patient/${patient.id}`}
          className="block rounded-xl bg-sky-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-800"
        >
          View Profile
        </Link>

        <Link
          href={`/doctor/patient/${patient.id}/symptoms`}
          className="block rounded-xl border border-sky-700 px-4 py-3 text-center font-semibold text-sky-700 transition hover:bg-sky-50"
        >
          Symptoms
        </Link>

        <Link
          href={`/doctor/patient/${patient.id}/predictions`}
          className="flex items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 transition hover:bg-green-50"
        >
          <Activity size={18} />
          AI Predictions
        </Link>

      </div>

    </div>
  );
}
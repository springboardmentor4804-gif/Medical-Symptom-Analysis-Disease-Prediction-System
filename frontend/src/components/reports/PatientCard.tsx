"use client";

interface Props {
  patientId: number;
}

export default function PatientCard({
  patientId,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-4">

        {/* Icon */}

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
          👤
        </div>

        {/* Patient Information */}

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Patient
          </p>

          <h2 className="mt-1 text-lg font-bold text-gray-900">
            Patient #{patientId}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Health risk assessment for the authenticated patient.
          </p>

        </div>

      </div>

    </div>
  );
}
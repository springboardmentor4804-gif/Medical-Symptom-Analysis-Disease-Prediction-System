"use client";

import { useState } from "react";
import { assignPatient } from "@/services/assignment";

interface AssignmentFormProps {
  doctors: any[];
  patients: any[];
  onSuccess: () => void;
}

export default function AssignmentForm({
  doctors,
  patients,
  onSuccess,
}: AssignmentFormProps) {
  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!doctorId || !patientId) {
      alert("Please select both doctor and patient.");
      return;
    }

    try {
      setLoading(true);

      await assignPatient(
        Number(doctorId),
        Number(patientId)
      );

      alert("Patient assigned successfully!");

      setDoctorId("");
      setPatientId("");

      onSuccess();
    } catch (error: any) {
      alert(
        error?.response?.data?.detail ||
          "Assignment failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      <h2 className="mb-6 text-2xl font-bold">
        Assign Patient
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Doctor Dropdown */}
        <div>
          <label className="mb-2 block font-medium">
            Doctor
          </label>

          <select
            value={doctorId}
            onChange={(e) =>
              setDoctorId(e.target.value)
            }
            className="w-full rounded-xl border p-3"
          >
            <option value="">
              Select Doctor
            </option>

            {doctors.map((doctor: any) => (
              <option
                key={doctor.id}
                value={doctor.id}
              >
                {doctor.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Patient Dropdown */}
        <div>
          <label className="mb-2 block font-medium">
            Patient
          </label>

          <select
            value={patientId}
            onChange={(e) =>
              setPatientId(e.target.value)
            }
            className="w-full rounded-xl border p-3"
          >
            <option value="">
              Select Patient
            </option>

            {patients.map((patient: any) => (
              <option
                key={patient.id}
                value={patient.id}
              >
                {patient.full_name}
              </option>
            ))}
          </select>
        </div>

      </div>

      <button
        onClick={handleAssign}
        disabled={loading}
        className="mt-6 rounded-xl bg-sky-700 px-6 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
      >
        {loading ? "Assigning..." : "Assign Patient"}
      </button>

    </div>
  );
}
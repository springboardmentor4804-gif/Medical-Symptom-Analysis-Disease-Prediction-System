"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import PatientCard from "@/components/doctor/PatientCard";

import { getAssignedPatients } from "@/services/doctor";

export default function DoctorPatientsPage() {

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await getAssignedPatients();
      setPatients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          Loading Patients...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <h1 className="mb-8 text-3xl font-bold">
        My Patients
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {patients.length === 0 ? (

          <div className="rounded-xl bg-white p-8 shadow text-center">
            No assigned patients.
          </div>

        ) : (

          patients.map((patient) => (

            <PatientCard
              key={patient.id}
              patient={patient}
            />

          ))

        )}

      </div>

    </DashboardLayout>
  );
}
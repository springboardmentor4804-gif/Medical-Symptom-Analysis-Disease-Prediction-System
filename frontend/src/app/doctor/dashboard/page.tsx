"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import WelcomeBanner from "@/components/dashboard/welcomeBanner";
import StatsGrid from "@/components/dashboard/StatsGrid";

import PatientCard from "@/components/doctor/PatientCard";

import {
  getDoctorSummary,
  getAssignedPatients,
} from "@/services/doctor";

export default function DoctorDashboardPage() {

  const [summary, setSummary] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {

      const summaryData = await getDoctorSummary();
      const patientData = await getAssignedPatients();

      setSummary(summaryData);
      setPatients(patientData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center text-xl">
          Loading Dashboard...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <WelcomeBanner
        name="Doctor"
        role="Doctor"
        message="Manage your assigned patients and review AI predictions."
      />

      <div className="mt-8">

        <StatsGrid
          role="doctor"
          summary={summary}
        />

      </div>

      <div className="mt-10">

        <h2 className="mb-6 text-2xl font-bold">
          My Patients
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {patients.length === 0 ? (

            <div className="rounded-xl bg-white p-8 shadow text-center text-gray-500">
              No patients assigned yet.
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

      </div>

    </DashboardLayout>
  );
}
"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import AssignmentForm from "@/components/assignment/AssignmentForm";
import AssignmentTable from "@/components/assignment/AssignmentTable";

import {
  getDoctors,
  getPatients,
  getAssignments,
} from "@/services/assignment";

export default function AssignmentPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const doctorData = await getDoctors();
      const patientData = await getPatients();
      const assignmentData = await getAssignments();

      setDoctors(doctorData);
      setPatients(patientData);
      setAssignments(assignmentData);
    } catch (error) {
      console.error("Failed to load assignment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          Loading assignments...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Patient Assignments
          </h1>

          <p className="mt-2 text-gray-500">
            Assign patients to doctors and manage existing assignments.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <AssignmentForm
            doctors={doctors}
            patients={patients}
            onSuccess={loadData}
          />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <AssignmentTable
            assignments={assignments}
            onRefresh={loadData}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}
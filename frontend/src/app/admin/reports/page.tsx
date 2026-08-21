"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import { getAdminDashboard } from "@/services/admin";

import {
  Users,
  UserRound,
  Brain,
  Link2,
  BarChart3,
  Activity,
} from "lucide-react";

interface DashboardData {
  total_doctors: number;
  total_patients: number;
  total_predictions: number;
  total_assignments: number;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);

      const result = await getAdminDashboard();

      setData(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load admin report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">
            Loading admin report...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="rounded-xl bg-red-50 p-6 text-red-600">
            {error || "No report data available."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalUsers =
    data.total_doctors + data.total_patients;

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* Header */}

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">
              <BarChart3
                size={28}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Admin Reports
              </h1>

              <p className="mt-1 text-gray-500">
                Overview of users, predictions and patient
                assignments.
              </p>
            </div>

          </div>

        </div>


        {/* Main Statistics */}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

          {/* Doctors */}

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Doctors
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {data.total_doctors}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3">
                <UserRound
                  size={28}
                  className="text-blue-600"
                />
              </div>

            </div>

          </div>


          {/* Patients */}

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Patients
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {data.total_patients}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3">
                <Users
                  size={28}
                  className="text-green-600"
                />
              </div>

            </div>

          </div>


          {/* Predictions */}

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Predictions
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {data.total_predictions}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3">
                <Brain
                  size={28}
                  className="text-orange-600"
                />
              </div>

            </div>

          </div>


          {/* Assignments */}

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Assignments
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {data.total_assignments}
                </p>
              </div>

              <div className="rounded-xl bg-purple-100 p-3">
                <Link2
                  size={28}
                  className="text-purple-600"
                />
              </div>

            </div>

          </div>

        </div>


        {/* System Overview */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="mb-6 flex items-center gap-3">

              <Activity
                size={24}
                className="text-blue-600"
              />

              <h2 className="text-xl font-bold text-gray-800">
                System Overview
              </h2>

            </div>

            <div className="space-y-5">

              <div className="flex items-center justify-between border-b pb-4">

                <span className="text-gray-500">
                  Total Registered Users
                </span>

                <span className="font-bold text-gray-800">
                  {totalUsers}
                </span>

              </div>

              <div className="flex items-center justify-between border-b pb-4">

                <span className="text-gray-500">
                  Doctors
                </span>

                <span className="font-semibold text-blue-600">
                  {data.total_doctors}
                </span>

              </div>

              <div className="flex items-center justify-between border-b pb-4">

                <span className="text-gray-500">
                  Patients
                </span>

                <span className="font-semibold text-green-600">
                  {data.total_patients}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-gray-500">
                  Patient Assignments
                </span>

                <span className="font-semibold text-purple-600">
                  {data.total_assignments}
                </span>

              </div>

            </div>

          </div>


          {/* AI Activity */}

          <div className="rounded-xl bg-white p-6 shadow-md">

            <div className="mb-6 flex items-center gap-3">

              <Brain
                size={24}
                className="text-orange-500"
              />

              <h2 className="text-xl font-bold text-gray-800">
                AI Prediction Activity
              </h2>

            </div>

            <div className="rounded-xl bg-orange-50 p-6">

              <p className="text-sm text-gray-500">
                Total AI Predictions
              </p>

              <p className="mt-2 text-4xl font-bold text-orange-600">
                {data.total_predictions}
              </p>

              <p className="mt-3 text-sm text-gray-600">
                Predictions generated by the MedAssist-AI
                disease prediction system.
              </p>

            </div>

          </div>

        </div>


        {/* Report Information */}

        <div className="mt-8 rounded-xl bg-white p-6 shadow-md">

          <h2 className="mb-4 text-xl font-bold text-gray-800">
            Report Information
          </h2>

          <p className="leading-7 text-gray-600">
            This report provides an administrative overview
            of the MedAssist-AI system. The statistics are
            retrieved directly from the backend database and
            represent the current number of registered doctors,
            patients, AI predictions and doctor-patient
            assignments.
          </p>

        </div>

      </div>
    </DashboardLayout>
  );
}
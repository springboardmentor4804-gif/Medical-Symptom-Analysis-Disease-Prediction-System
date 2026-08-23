"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import WelcomeBanner from "@/components/dashboard/welcomeBanner";

import { getAdminDashboard } from "@/services/admin";

interface AdminDashboardData {
  total_patients: number;
  total_predictions: number;
  total_reports: number;
  high_risk_patients: number;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState<AdminDashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboard();

      setDashboard(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard.");
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center text-xl text-red-600">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <WelcomeBanner
          name="Administrator"
          role="Admin"
          message="Manage doctors, patients and the MedAssist AI platform."
        />

        {/* Dashboard Statistics */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Patients */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Patients
                </p>

                <h2 className="mt-2 text-3xl font-bold text-blue-700">
                  {dashboard?.total_patients ?? 0}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                👥
              </div>

            </div>
          </div>


          {/* Total Predictions */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Predictions
                </p>

                <h2 className="mt-2 text-3xl font-bold text-indigo-700">
                  {dashboard?.total_predictions ?? 0}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                🧠
              </div>

            </div>
          </div>


          {/* Total Reports */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Reports
                </p>

                <h2 className="mt-2 text-3xl font-bold text-green-700">
                  {dashboard?.total_reports ?? 0}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                📋
              </div>

            </div>
          </div>


          {/* High Risk Patients */}

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  High Risk Patients
                </p>

                <h2 className="mt-2 text-3xl font-bold text-red-600">
                  {dashboard?.high_risk_patients ?? 0}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
                ⚠️
              </div>

            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import WelcomeBanner from "@/components/dashboard/welcomeBanner";

import { getAdminDashboard } from "@/services/admin";

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
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
        <div className="flex h-full items-center justify-center text-red-600 text-xl">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <WelcomeBanner
        name="Administrator"
        role="Admin"
        message="Manage doctors, patients and the MedAssist AI platform."
      />

    </DashboardLayout>
  );
}
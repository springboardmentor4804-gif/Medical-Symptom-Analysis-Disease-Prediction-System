"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getDoctorProfile } from "@/services/doctor";

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getDoctorProfile();
      setDoctor(data);
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
          Loading Profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-4xl">
            👨‍⚕️
          </div>

          <h1 className="text-3xl font-bold">
            Dr. {doctor.full_name}
          </h1>

          <p className="mt-2 text-gray-500">
            Healthcare Professional
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <p className="text-sm text-gray-500">
              Full Name
            </p>

            <p className="mt-1 text-lg font-semibold">
              {doctor.full_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="mt-1 text-lg font-semibold">
              {doctor.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Role
            </p>

            <span className="mt-2 inline-block rounded-full bg-green-100 px-4 py-1 font-semibold text-green-700">
              {doctor.role}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Member Since
            </p>

            <p className="mt-1 text-lg font-semibold">
              {new Date(
                doctor.created_at
              ).toLocaleDateString()}
            </p>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
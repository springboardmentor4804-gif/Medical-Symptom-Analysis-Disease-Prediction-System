"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import {
  getAdminProfile,
  updateAdminProfile,
} from "@/services/admin";

import {
  User,
  Mail,
  ShieldCheck,
  Save,
} from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await getAdminProfile();

      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        role: data.role || "",
      });
    } catch (error) {
      console.error(
        "Failed to load admin profile:",
        error
      );

      alert("Unable to load admin profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!profile.full_name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!profile.email.trim()) {
      alert("Please enter your email.");
      return;
    }

    try {
      setSaving(true);

      await updateAdminProfile({
        full_name: profile.full_name,
        email: profile.email,
      });

      alert(
        "Profile updated successfully. Please log in again if you changed your email."
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.detail ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">
            Loading profile...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Admin Profile
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your administrator account information.
          </p>

        </div>


        {/* Profile Card */}

        <div className="mx-auto max-w-3xl">

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">

            {/* Profile Header */}

            <div className="bg-blue-600 px-8 py-8">

              <div className="flex items-center gap-5">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">

                  <User
                    size={38}
                    className="text-blue-600"
                  />

                </div>

                <div className="text-white">

                  <h2 className="text-2xl font-bold">
                    {profile.full_name || "Administrator"}
                  </h2>

                  <p className="mt-1 text-blue-100">
                    Administrator Account
                  </p>

                </div>

              </div>

            </div>


            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-8"
            >

              {/* Full Name */}

              <div>

                <label className="mb-2 block font-semibold text-gray-700">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter your full name"
                  />

                </div>

              </div>


              {/* Email */}

              <div>

                <label className="mb-2 block font-semibold text-gray-700">
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter your email"
                  />

                </div>

              </div>


              {/* Role */}

              <div>

                <label className="mb-2 block font-semibold text-gray-700">
                  Role
                </label>

                <div className="relative">

                  <ShieldCheck
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 py-3 pl-12 pr-4 text-gray-500"
                  />

                </div>

                <p className="mt-2 text-sm text-gray-400">
                  Admin role cannot be changed.
                </p>

              </div>


              {/* Save */}

              <div className="flex justify-end border-t pt-6">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Save size={19} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
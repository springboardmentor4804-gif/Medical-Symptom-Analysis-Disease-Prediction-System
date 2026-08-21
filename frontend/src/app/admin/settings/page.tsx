"use client";

import { useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import { changeAdminPassword } from "@/services/admin";

import {
  Lock,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      alert("Please fill both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "New password must be at least 6 characters."
      );
      return;
    }

    try {
      setSaving(true);

      await changeAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      alert(
        "Password changed successfully. Please login again."
      );

      localStorage.removeItem("token");

      window.location.href = "/login";
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.detail ||
          "Unable to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Settings
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your administrator account and security.
          </p>

        </div>


        <div className="mx-auto max-w-4xl space-y-6">

          {/* Security */}

          <div className="rounded-2xl bg-white p-8 shadow-md">

            <div className="mb-6 flex items-center gap-4">

              <div className="rounded-xl bg-blue-100 p-3">
                <Shield
                  size={26}
                  className="text-blue-600"
                />
              </div>

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Security
                </h2>

                <p className="text-sm text-gray-500">
                  Update your administrator password.
                </p>

              </div>

            </div>


            <form
              onSubmit={handleChangePassword}
              className="space-y-6"
            >

              {/* Current Password */}

              <div>

                <label className="mb-2 block font-semibold text-gray-700">
                  Current Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrent(!showCurrent)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrent ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              {/* New Password */}

              <div>

                <label className="mb-2 block font-semibold text-gray-700">
                  New Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNew(!showNew)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNew ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-sm text-gray-400">
                  Minimum 6 characters.
                </p>

              </div>


              {/* Save */}

              <div className="flex justify-end border-t pt-6">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >

                  <Save size={19} />

                  {saving
                    ? "Changing..."
                    : "Change Password"}

                </button>

              </div>

            </form>

          </div>


          {/* Logout */}

          <div className="rounded-2xl bg-white p-8 shadow-md">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Logout
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Sign out of your administrator account.
                </p>

              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >

                <LogOut size={19} />

                Logout

              </button>

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
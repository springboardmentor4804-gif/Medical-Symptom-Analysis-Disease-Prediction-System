"use client";

import { useEffect, useState } from "react";
import {
  getPatientProfile,
  updatePatientProfile,
} from "@/services/patient";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [originalProfile, setOriginalProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getPatientProfile();

      setProfile(data);
      setOriginalProfile(data);
    } catch (error) {
      console.error("Profile loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const updatedProfile =
        await updatePatientProfile(profile);

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);

      setEditing(false);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setProfile(originalProfile);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-2xl font-semibold text-blue-700 animate-pulse">
          Loading Profile...
        </h1>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-red-600">
            Unable to load profile
          </h1>

          <button
            onClick={loadProfile}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* ================= HEADER ================= */}

          <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-8 py-8">

            <div className="flex flex-col md:flex-row items-center gap-6">

              {/* Avatar */}

              <div className="w-28 h-28 rounded-full bg-white text-blue-700 flex items-center justify-center text-5xl font-bold shadow-lg">

                {profile.full_name
                  ? profile.full_name
                      .charAt(0)
                      .toUpperCase()
                  : "P"}

              </div>

              {/* User information */}

              <div className="flex-1 text-center md:text-left">

                <h1 className="text-3xl md:text-4xl font-bold">
                  {profile.full_name || "Patient"}
                </h1>

                <p className="text-blue-100 mt-2">
                  {profile.email}
                </p>

                <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-white text-blue-700 text-sm font-semibold uppercase">
                  {profile.role}
                </span>

              </div>

              {/* Edit button */}

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Edit Profile
                </button>
              )}

            </div>

          </div>

          {/* ================= FORM ================= */}

          <div className="p-8">

            {/* PERSONAL INFORMATION */}

            <section>

              <h2 className="text-2xl font-bold text-blue-700">
                Personal Information
              </h2>

              <p className="text-gray-500 mt-1 mb-6">
                Basic information about the patient.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Name */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter your full name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Email */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={profile.email || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Email cannot be changed here.
                  </p>

                </div>

                {/* DOB */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={profile.date_of_birth || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Gender */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={profile.gender || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </section>

            {/* CONTACT */}

            <section className="mt-12">

              <h2 className="text-2xl font-bold text-blue-700">
                Contact Information
              </h2>

              <p className="text-gray-500 mt-1 mb-6">
                Contact and emergency information.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Phone */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Emergency */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact
                  </label>

                  <input
                    type="tel"
                    name="emergency_contact"
                    value={profile.emergency_contact || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Address */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>

                  <textarea
                    name="address"
                    rows={4}
                    value={profile.address || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter your complete address"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

              </div>

            </section>

            {/* HEALTH INFORMATION */}

            <section className="mt-12">

              <h2 className="text-2xl font-bold text-blue-700">
                Health Information
              </h2>

              <p className="text-gray-500 mt-1 mb-6">
                Medical and physical information used for healthcare analysis.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Blood Group */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Group
                  </label>

                  <select
                    name="blood_group"
                    value={profile.blood_group || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >

                    <option value="">
                      Select Blood Group
                    </option>

                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>

                  </select>

                </div>

                {/* Height */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Height (cm)
                  </label>

                  <input
                    type="number"
                    name="height"
                    value={profile.height || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="170"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Weight */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weight (kg)
                  </label>

                  <input
                    type="number"
                    name="weight"
                    value={profile.weight || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="65"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                </div>

              </div>

              {/* Allergies */}

              <div className="mt-6">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allergies
                </label>

                <textarea
                  name="allergies"
                  rows={3}
                  value={profile.allergies || ""}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Mention any known allergies. Write 'None' if you have no known allergies."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

              </div>

              {/* Medical History */}

              <div className="mt-6">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medical History
                </label>

                <textarea
                  name="medical_history"
                  rows={5}
                  value={profile.medical_history || ""}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Mention previous diseases, surgeries, chronic conditions, or other important medical information."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

              </div>

            </section>

            {/* HEALTH SUMMARY */}

            <section className="mt-12">

              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Health Summary
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">

                  <p className="text-sm text-gray-500">
                    Blood Group
                  </p>

                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {profile.blood_group || "-"}
                  </p>

                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100">

                  <p className="text-sm text-gray-500">
                    Height
                  </p>

                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {profile.height
                      ? `${profile.height} cm`
                      : "-"}
                  </p>

                </div>

                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">

                  <p className="text-sm text-gray-500">
                    Weight
                  </p>

                  <p className="text-2xl font-bold text-yellow-700 mt-2">
                    {profile.weight
                      ? `${profile.weight} kg`
                      : "-"}
                  </p>

                </div>

                <div className="bg-red-50 rounded-xl p-5 border border-red-100">

                  <p className="text-sm text-gray-500">
                    Allergies
                  </p>

                  <p className="text-lg font-semibold text-red-700 mt-2">
                    {profile.allergies
                      ? "Recorded"
                      : "None"}
                  </p>

                </div>

              </div>

            </section>

            {/* ACTION BUTTONS */}

            {editing && (
              <div className="mt-12 border-t pt-8 flex justify-end gap-4">

                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            )}

            {!editing && (
              <div className="mt-12 border-t pt-8 text-center">

                <p className="text-gray-500">
                  Keep your medical profile updated for better
                  healthcare recommendations.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
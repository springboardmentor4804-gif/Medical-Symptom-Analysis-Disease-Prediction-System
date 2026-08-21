"use client";

import { useEffect, useState } from "react";
import {
  getDoctors,
  createDoctor,
  deleteDoctor,
} from "@/services/admin";

import {
  UserPlus,
  Trash2,
  Stethoscope,
  Mail,
  Search,
} from "lucide-react";

export default function DoctorsPage() {

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);


  // ============================================
  // LOAD DOCTORS
  // ============================================

  const loadDoctors = async () => {

    try {

      setLoading(true);

      const data = await getDoctors();

      setDoctors(data);

    } catch (error) {

      console.error(
        "Failed to load doctors:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadDoctors();
  }, []);


  // ============================================
  // FORM CHANGE
  // ============================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };


  // ============================================
  // CREATE DOCTOR
  // ============================================

  const handleCreateDoctor = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.password
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {

      setSaving(true);

      await createDoctor({
        ...formData,
        role: "doctor",
      });

      alert("Doctor created successfully.");

      setFormData({
        full_name: "",
        email: "",
        password: "",
      });

      setShowForm(false);

      await loadDoctors();

    } catch (error: any) {

      console.error(error);

      alert(
        error?.response?.data?.detail ||
        "Unable to create doctor."
      );

    } finally {

      setSaving(false);

    }
  };


  // ============================================
  // DELETE DOCTOR
  // ============================================

  const handleDeleteDoctor = async (
    doctorId: number
  ) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmed) return;

    try {

      await deleteDoctor(doctorId);

      alert("Doctor deleted successfully.");

      await loadDoctors();

    } catch (error: any) {

      console.error(error);

      alert(
        error?.response?.data?.detail ||
        "Unable to delete doctor."
      );

    }
  };


  // ============================================
  // SEARCH
  // ============================================

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      doctor.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  // ============================================
  // UI
  // ============================================

  return (

    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Doctors
            </h1>

            <p className="text-gray-500 mt-1">
              Manage doctors registered in MedAssist AI.
            </p>

          </div>


          <button
            onClick={() =>
              setShowForm(!showForm)
            }
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
          >

            <UserPlus size={20} />

            Add Doctor

          </button>

        </div>


        {/* CREATE DOCTOR FORM */}

        {showForm && (

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">

            <h2 className="text-xl font-bold text-gray-800 mb-5">
              Create New Doctor
            </h2>

            <form
              onSubmit={handleCreateDoctor}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >

              <input
                type="text"
                name="full_name"
                placeholder="Doctor Full Name"
                value={formData.full_name}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="email"
                name="email"
                placeholder="Doctor Email"
                value={formData.email}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                name="password"
                placeholder="Temporary Password"
                value={formData.password}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="md:col-span-3 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="px-5 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Doctor"}
                </button>

              </div>

            </form>

          </div>

        )}


        {/* SEARCH */}

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">

          <div className="flex items-center gap-3">

            <Search
              size={20}
              className="text-gray-400"
            />

            <input
              type="text"
              placeholder="Search doctors by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full outline-none text-gray-700"
            />

          </div>

        </div>


        {/* DOCTOR LIST */}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold text-gray-800">
              Registered Doctors
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {filteredDoctors.length} doctor
              {filteredDoctors.length !== 1
                ? "s"
                : ""}
            </p>

          </div>


          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Loading doctors...
            </div>

          ) : filteredDoctors.length === 0 ? (

            <div className="p-10 text-center">

              <Stethoscope
                size={45}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-gray-500">
                No doctors found.
              </p>

            </div>

          ) : (

            <div className="divide-y">

              {filteredDoctors.map(
                (doctor) => (

                  <div
                    key={doctor.id}
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 hover:bg-slate-50 transition"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">

                        <Stethoscope
                          size={24}
                          className="text-blue-600"
                        />

                      </div>


                      <div>

                        <h3 className="font-bold text-gray-800">
                          Dr. {doctor.full_name}
                        </h3>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">

                          <Mail size={15} />

                          {doctor.email}

                        </div>

                      </div>

                    </div>


                    <div className="flex items-center gap-3">

                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        Doctor
                      </span>


                      <button
                        onClick={() =>
                          handleDeleteDoctor(
                            doctor.id
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                      >

                        <Trash2 size={18} />

                        Delete

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
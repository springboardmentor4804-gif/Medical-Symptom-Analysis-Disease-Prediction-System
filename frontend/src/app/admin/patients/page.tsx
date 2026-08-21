"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layouts/DashboardLayout";

import { getPatients } from "@/services/admin";

import {
  Users,
  Mail,
  Search,
} from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      setLoading(true);

      const data = await getPatients();

      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      patient.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Patients
          </h1>

          <p className="mt-1 text-gray-500">
            View and manage registered patients.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">

          <div className="flex items-center gap-3">

            <Search
              size={20}
              className="text-gray-400"
            />

            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full outline-none text-gray-700"
            />

          </div>

        </div>

        {/* Patient Count */}
        <div className="mb-6">

          <div className="inline-flex items-center gap-3 rounded-xl bg-green-50 px-5 py-3">

            <Users
              size={22}
              className="text-green-600"
            />

            <span className="font-semibold text-green-700">
              {filteredPatients.length} Patient
              {filteredPatients.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

        </div>

        {/* Patients */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md">

          <div className="border-b p-6">

            <h2 className="text-xl font-bold text-gray-800">
              Registered Patients
            </h2>

          </div>

          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Loading patients...
            </div>

          ) : filteredPatients.length === 0 ? (

            <div className="p-10 text-center">

              <Users
                size={45}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-gray-500">
                No patients found.
              </p>

            </div>

          ) : (

            <div className="divide-y">

              {filteredPatients.map(
                (patient) => (

                  <div
                    key={patient.id}
                    className="flex flex-col gap-4 p-6 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                  >

                    {/* Patient info */}

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">

                        <Users
                          size={24}
                          className="text-green-600"
                        />

                      </div>

                      <div>

                        <h3 className="font-bold text-gray-800">
                          {patient.full_name}
                        </h3>

                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">

                          <Mail size={15} />

                          {patient.email}

                        </div>

                      </div>

                    </div>

                    {/* Patient ID + Role */}

                    <div className="flex items-center gap-4">

                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        Patient
                      </span>

                      <span className="text-sm text-gray-500">
                        ID: {patient.id}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
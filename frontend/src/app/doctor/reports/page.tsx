"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  User,
  Brain,
  Calendar,
  AlertTriangle,
  Activity,
  Search,
} from "lucide-react";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getDoctorReports } from "@/services/doctor";

interface Patient {
  id: number;
  full_name: string;
  email: string;
}

interface DoctorReport {
  prediction_id: number;
  patient_id: number;
  patient: Patient;

  predicted_disease: string;
  confidence: number | null;

  risk_score: number | null;
  risk_level: string | null;

  severity_score: number | null;
  severity_level: string | null;

  recommendation: string | null;

  created_at: string;
}

interface DoctorReportsResponse {
  doctor: {
    id: number;
    full_name: string;
    email: string;
  };

  total_reports: number;
  reports: DoctorReport[];
}

export default function DoctorReportsPage() {
  const [data, setData] = useState<DoctorReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDoctorReports();

      setData(response);
    } catch (err: any) {
      console.error(err);

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load doctor reports."
        );
      } else {
        setError("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     Risk Badge
  ===================================================== */

  const getRiskClass = (level: string | null) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-300";

      case "High":
        return "bg-orange-100 text-orange-800 border-orange-300";

      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";

      case "Low":
        return "bg-green-100 text-green-800 border-green-300";

      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  /* =====================================================
     Severity Badge
  ===================================================== */

  const getSeverityClass = (level: string | null) => {
    switch (level) {
      case "Severe":
        return "bg-red-100 text-red-800 border-red-300";

      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";

      case "Mild":
        return "bg-blue-100 text-blue-800 border-blue-300";

      case "Minimal":
        return "bg-green-100 text-green-800 border-green-300";

      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  /* =====================================================
     Filter Reports
  ===================================================== */

  const filteredReports =
    data?.reports.filter((report) => {
      const searchText = search.toLowerCase();

      return (
        report.patient.full_name
          .toLowerCase()
          .includes(searchText) ||
        report.patient.email
          .toLowerCase()
          .includes(searchText) ||
        report.predicted_disease
          .toLowerCase()
          .includes(searchText) ||
        String(report.prediction_id).includes(searchText)
      );
    }) || [];

  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-xl font-semibold text-blue-600 animate-pulse">
            Loading Doctor Reports...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
     Error
  ===================================================== */

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-xl bg-red-100 px-6 py-4 text-red-700 shadow">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            📋 Patient Reports
          </h1>

          <p className="mt-2 text-gray-500">
            Review AI prediction reports for your assigned
            patients.
          </p>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-blue-100 p-3">
                <FileText
                  size={26}
                  className="text-blue-700"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total Reports
                </p>

                <p className="text-3xl font-bold text-slate-800">
                  {data?.total_reports ?? 0}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-green-100 p-3">
                <User
                  size={26}
                  className="text-green-700"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Assigned Patients
                </p>

                <p className="text-3xl font-bold text-slate-800">
                  {new Set(
                    data?.reports.map(
                      (report) => report.patient_id
                    )
                  ).size}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-purple-100 p-3">
                <Brain
                  size={26}
                  className="text-purple-700"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  AI Predictions
                </p>

                <p className="text-3xl font-bold text-slate-800">
                  {data?.total_reports ?? 0}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="rounded-2xl bg-white p-5 shadow-md">

          <div className="relative">

            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search patient, email, disease or prediction ID..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
            />

          </div>

        </div>

        {/* =================================================
            REPORTS
        ================================================= */}

        {filteredReports.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-md">

            <FileText
              size={50}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              No Reports Found
            </h2>

            <p className="mt-2 text-gray-500">
              No reports match your search.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {filteredReports.map((report) => (

              <div
                key={report.prediction_id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition hover:shadow-lg"
              >

                {/* =========================================
                    REPORT HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <FileText
                        size={20}
                        className="text-blue-600"
                      />

                      <p className="text-sm font-semibold text-blue-600">
                        Prediction #{report.prediction_id}
                      </p>

                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-800">
                      {report.predicted_disease}
                    </h2>

                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">

                    <Calendar size={17} />

                    {report.created_at
                      ? new Date(
                          report.created_at
                        ).toLocaleString()
                      : "-"}

                  </div>

                </div>

                {/* =========================================
                    PATIENT
                ========================================= */}

                <div className="mt-6 rounded-xl bg-slate-50 p-5">

                  <div className="flex items-center gap-3">

                    <User
                      size={22}
                      className="text-blue-600"
                    />

                    <div>

                      <p className="text-sm text-gray-500">
                        Patient
                      </p>

                      <p className="font-bold text-slate-800">
                        {report.patient.full_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {report.patient.email}
                      </p>

                    </div>

                  </div>

                </div>

                {/* =========================================
                    STATISTICS
                ========================================= */}

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  {/* Confidence */}

                  <div className="rounded-xl bg-blue-50 p-5">

                    <p className="text-sm text-gray-500">
                      Confidence
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-700">
                      {report.confidence !== null
                        ? `${report.confidence}%`
                        : "-"}
                    </p>

                  </div>

                  {/* Risk Score */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Risk Score
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {report.risk_score ?? "-"}
                    </p>

                  </div>

                  {/* Severity */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Severity Score
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {report.severity_score ?? "-"}
                    </p>

                  </div>

                  {/* Patient ID */}

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-gray-500">
                      Patient ID
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {report.patient_id}
                    </p>

                  </div>

                </div>

                {/* =========================================
                    RISK + SEVERITY
                ========================================= */}

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div className="rounded-xl border p-5">

                    <div className="flex items-center gap-2">

                      <AlertTriangle
                        size={18}
                        className="text-orange-500"
                      />

                      <p className="text-sm text-gray-500">
                        Risk Level
                      </p>

                    </div>

                    <span
                      className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getRiskClass(
                        report.risk_level
                      )}`}
                    >
                      {report.risk_level || "Unknown"}
                    </span>

                  </div>

                  <div className="rounded-xl border p-5">

                    <div className="flex items-center gap-2">

                      <Activity
                        size={18}
                        className="text-blue-500"
                      />

                      <p className="text-sm text-gray-500">
                        Severity Level
                      </p>

                    </div>

                    <span
                      className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getSeverityClass(
                        report.severity_level
                      )}`}
                    >
                      {report.severity_level ||
                        "Not Available"}
                    </span>

                  </div>

                </div>

                {/* =========================================
                    RECOMMENDATION
                ========================================= */}

                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                  <p className="text-sm font-semibold text-blue-800">
                    💡 AI Recommendation
                  </p>

                  <p className="mt-2 leading-7 text-gray-700">
                    {report.recommendation ||
                      "No recommendation available."}
                  </p>

                </div>

                {/* =========================================
                    MEDICAL NOTICE
                ========================================= */}

                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                  <p className="text-sm font-semibold text-yellow-800">
                    ⚠️ Medical Notice
                  </p>

                  <p className="mt-1 text-sm leading-6 text-yellow-700">
                    This AI-generated prediction is not a
                    confirmed medical diagnosis. Clinical
                    evaluation should be performed by a
                    qualified healthcare professional.
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </DashboardLayout>
  );
}
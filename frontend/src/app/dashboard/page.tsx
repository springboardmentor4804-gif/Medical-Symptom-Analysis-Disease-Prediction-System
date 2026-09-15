"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

import { getPatientProfile } from "@/services/patient";
import { getLatestPrediction } from "@/services/prediction";

import {
  User,
  Brain,
  Activity,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

import Link from "next/link";

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
  try {
    const profileData = await getPatientProfile();
    setProfile(profileData);

    try {
      const predictionData = await getLatestPrediction();
      setPrediction(predictionData);
    } catch (err: any) {
      // No prediction yet is a normal condition for a new patient
      if (err?.response?.status === 404) {
        setPrediction(null);
      } else {
        throw err;
      }
    }
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
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="text-lg text-gray-500">
            Loading Dashboard...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-red-50 p-6 text-red-600">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Welcome */}

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{" "}
            {profile?.full_name || "Patient"} 👋
          </h1>

          <p className="mt-2 text-gray-500">
            Monitor your health and AI predictions
            from your dashboard.
          </p>
        </div>

        {/* Profile + Prediction */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Patient Profile */}

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <User
                  size={28}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Patient Profile
                </h2>

                <p className="text-sm text-gray-500">
                  Your personal health information
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Name
                </p>

                <p className="font-semibold text-gray-800">
                  {profile?.full_name || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Email
                </p>

                <p className="font-semibold text-gray-800">
                  {profile?.email || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Gender
                </p>

                <p className="font-semibold text-gray-800">
                  {profile?.gender || "Not provided"}
                </p>
              </div>

            </div>

            <Link
              href="/profile"
              className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              View Profile
              <ArrowRight size={18} />
            </Link>

          </div>


          {/* Latest Prediction */}

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <Brain
                  size={28}
                  className="text-purple-600"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Latest AI Prediction
                </h2>

                <p className="text-sm text-gray-500">
                  Your most recent prediction
                </p>
              </div>

            </div>

            {prediction ? (
              <div className="mt-6 space-y-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Predicted Disease
                  </p>

                  <p className="text-xl font-bold text-gray-800">
                    {prediction.predicted_disease ||
                      prediction.disease ||
                      "Not available"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm text-gray-500">
                      Confidence
                    </p>

                    <p className="mt-1 text-lg font-bold text-blue-600">
                      {prediction.confidence ||
                        "0"}
                      %
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Risk Level
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        prediction.risk_level === "High"
                          ? "text-red-600"
                          : prediction.risk_level ===
                            "Medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {prediction.risk_level ||
                        "Not available"}
                    </p>
                  </div>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-sm text-gray-500">
                    Recommendation
                  </p>

                  <p className="mt-1 text-gray-700">
                    {prediction.recommendation ||
                      "No recommendation available."}
                  </p>

                </div>

              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">

                <Brain
                  size={40}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-gray-500">
                  No prediction available yet.
                </p>

                <Link
                  href="/prediction"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
                >
                  Make a Prediction
                  <ArrowRight size={18} />
                </Link>

              </div>
            )}

          </div>

        </div>


        {/* Quick Actions */}

        <div>

          <h2 className="mb-4 text-xl font-bold text-gray-800">
            Quick Actions
          </h2>

          <div className="grid gap-5 md:grid-cols-3">

            <Link
              href="/symptoms"
              className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Activity
                size={30}
                className="text-blue-600"
              />

              <h3 className="mt-4 font-bold text-gray-800">
                Record Symptoms
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Record your latest symptoms and health
                information.
              </p>
            </Link>


            <Link
              href="/prediction"
              className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Brain
                size={30}
                className="text-purple-600"
              />

              <h3 className="mt-4 font-bold text-gray-800">
                AI Prediction
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Analyze symptoms using MedAssist AI.
              </p>
            </Link>


            <Link
              href="/reports"
              className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <HeartPulse
                size={30}
                className="text-red-600"
              />

              <h3 className="mt-4 font-bold text-gray-800">
                Health Reports
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                View your health reports and prediction
                history.
              </p>
            </Link>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
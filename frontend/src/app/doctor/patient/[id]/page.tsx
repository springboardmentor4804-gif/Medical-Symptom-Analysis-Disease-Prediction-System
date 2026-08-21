"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPatientProfile,
  getPatientSymptoms,
  getPatientPredictions,
} from "@/services/doctor";

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);

      const profileData = await getPatientProfile(Number(id));
      const symptomData = await getPatientSymptoms(Number(id));
      const predictionData = await getPatientPredictions(Number(id));

      setProfile(profileData);
      setSymptoms(symptomData);
      setPredictions(predictionData);
    } catch (err: any) {
      console.error(err);

      if (err.response) {
        setError(
          err.response.data?.detail || "Unable to load patient details."
        );
      } else {
        setError("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">
          Loading Patient Details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg shadow">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        👨‍⚕️ Patient Details
      </h1>

      {/* ===================== Patient Profile ===================== */}

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">

        <h2 className="text-2xl font-bold text-blue-700 mb-6">
          👤 Patient Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">

          <div>
            <p className="text-gray-500 text-sm">Full Name</p>
            <p className="font-semibold text-lg">
              {profile?.full_name || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Email</p>
            <p className="font-semibold text-lg">
              {profile?.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Role</p>
            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {profile?.role || "-"}
            </span>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Phone</p>
            <p className="font-semibold text-lg">
              {profile?.phone || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Gender</p>
            <p className="font-semibold text-lg">
              {profile?.gender || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Blood Group</p>
            <p className="font-semibold text-lg">
              {profile?.blood_group || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Height</p>
            <p className="font-semibold text-lg">
              {profile?.height ? `${profile.height} cm` : "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Weight</p>
            <p className="font-semibold text-lg">
              {profile?.weight ? `${profile.weight} kg` : "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Date of Birth</p>
            <p className="font-semibold text-lg">
              {profile?.date_of_birth || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Emergency Contact</p>
            <p className="font-semibold text-lg">
              {profile?.emergency_contact || "-"}
            </p>
          </div>

        </div>

        <div className="mt-8">

          <h3 className="font-semibold text-gray-700 mb-2">
            📍 Address
          </h3>

          <p className="text-gray-700">
            {profile?.address || "-"}
          </p>

        </div>

        <div className="mt-6">

          <h3 className="font-semibold text-gray-700 mb-2">
            ⚠️ Allergies
          </h3>

          <p className="text-gray-700">
            {profile?.allergies || "-"}
          </p>

        </div>

        <div className="mt-6">

          <h3 className="font-semibold text-gray-700 mb-2">
            🩺 Medical History
          </h3>

          <p className="text-gray-700">
            {profile?.medical_history || "-"}
          </p>

        </div>

      </div>

      {/* ===================== Symptoms ===================== */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">

        <h2 className="text-2xl font-bold text-blue-700 mb-6">
          🩺 Symptoms History
        </h2>

        {symptoms.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            No symptoms history found.
          </div>

        ) : (

          <div className="space-y-8">

            {symptoms.map((symptom: any) => (

              <div key={symptom.id} className="pb-6 border-b last:border-b-0">

                <div className="flex justify-between items-center mb-5">

                  <h3 className="font-semibold text-lg text-gray-800">
                    Visit #{symptom.id}
                  </h3>

                  <span className="text-sm text-gray-500">
                    {symptom.created_at
                      ? new Date(symptom.created_at).toLocaleDateString()
                      : ""}
                  </span>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  <div>
                    <p className="text-gray-500 text-sm">🌡 Fever</p>
                    <p className="font-semibold">
                      {symptom.fever || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🤧 Cough</p>
                    <p className="font-semibold">
                      {symptom.cough || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🤕 Headache</p>
                    <p className="font-semibold">
                      {symptom.headache || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">😴 Fatigue</p>
                    <p className="font-semibold">
                      {symptom.fatigue || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">❤️ Chest Pain</p>
                    <p className="font-semibold">
                      {symptom.chest_pain || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🫁 Shortness of Breath</p>
                    <p className="font-semibold">
                      {symptom.shortness_of_breath || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🩸 Blood Pressure</p>
                    <p className="font-semibold">
                      {symptom.blood_pressure || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">💓 Heart Rate</p>
                    <p className="font-semibold">
                      {symptom.heart_rate || "-"} bpm
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🍬 Blood Sugar</p>
                    <p className="font-semibold">
                      {symptom.blood_sugar || "-"} mg/dL
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">🌡 Temperature</p>
                    <p className="font-semibold">
                      {symptom.temperature || "-"} °C
                    </p>
                  </div>

                </div>

                <div className="mt-6">

                  <p className="text-gray-500 text-sm mb-2">
                    📝 Doctor Notes
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 text-gray-700">
                    {symptom.notes || "No notes available."}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ===================== AI Predictions ===================== */}
            <div className="bg-white rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-blue-700 mb-6">
          🤖 AI Prediction History
        </h2>

        {predictions.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            No AI predictions found.
          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {predictions.map((prediction: any) => {

              const riskColor =
                prediction.risk_level === "High"
                  ? "bg-red-100 text-red-700"
                  : prediction.risk_level === "Medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

              const confidence =
                prediction.confidence ??
                prediction.confidence_score ??
                prediction.probability ??
                "-";

              return (

                <div
                  key={prediction.id}
                  className="rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300"
                >

                  <div className="flex items-center justify-between mb-5">

                    <h3 className="text-xl font-bold text-slate-800">
                      {prediction.predicted_disease || "Unknown Disease"}
                    </h3>

                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold ${riskColor}`}
                    >
                      {prediction.risk_level || "Unknown"}
                    </span>

                  </div>

                  <div className="space-y-4">

                    <div>

                      <p className="text-gray-500 text-sm">
                        Confidence
                      </p>

                      <p className="text-lg font-semibold text-blue-600">
                        {confidence}
                        {typeof confidence === "number" ? "%" : ""}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500 text-sm">
                        Recommendation
                      </p>

                      <p className="text-gray-700 mt-1">
                        {prediction.recommendation ||
                          "No recommendation available."}
                      </p>

                    </div>

                    {prediction.created_at && (

                      <div>

                        <p className="text-gray-500 text-sm">
                          Generated On
                        </p>

                        <p className="font-medium">
                          {new Date(
                            prediction.created_at
                          ).toLocaleString()}
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );

}
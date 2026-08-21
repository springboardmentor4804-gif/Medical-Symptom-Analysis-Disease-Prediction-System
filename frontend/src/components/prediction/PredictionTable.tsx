"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deletePrediction,
  getPredictionHistory,
} from "@/services/prediction";

import HealthSummary from "../reports/HealthSummary";

interface Props {
  refresh: boolean;
  refreshTable: () => void;
  setEditingPrediction: (prediction: any) => void;
}

export default function PredictionTable({
  refresh,
  refreshTable,
  setEditingPrediction,
}: Props) {
  const [predictions, setPredictions] = useState<any[]>([]);

  const [selectedPrediction, setSelectedPrediction] =
    useState<any>(null);

  const [reportPredictionId, setReportPredictionId] =
    useState<number | null>(null);


  /* =====================================================
     Fetch Predictions
  ===================================================== */

  useEffect(() => {
    fetchPredictions();
  }, [refresh]);


  const fetchPredictions = async () => {
    try {
      const data = await getPredictionHistory();

      setPredictions(
        Array.isArray(data) ? data : []
      );

    } catch (error) {
      console.error(error);
    }
  };


  /* =====================================================
     Delete Prediction
  ===================================================== */

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this prediction?")) {
      return;
    }

    try {
      await deletePrediction(id);

      toast.success(
        "Prediction deleted successfully"
      );

      refreshTable();

    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to delete prediction"
      );
    }
  };


  /* =====================================================
     Format Symptoms
  ===================================================== */

  const formatSymptom = (symptom: string) => {
    return symptom
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };


  /* =====================================================
     Risk Level Style
  ===================================================== */

  const getRiskStyle = (
    level: string
  ) => {
    switch (level) {

      case "Critical":
        return "bg-red-100 text-red-700";

      case "High":
        return "bg-orange-100 text-orange-700";

      case "Medium":
      case "Moderate":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-green-100 text-green-700";
    }
  };


  return (
    <>
      {/* ================================================= */}
      {/* PREDICTION HISTORY */}
      {/* ================================================= */}

      <div className="rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-bold text-blue-700">
              📋 Prediction History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage your previous AI predictions.
            </p>

          </div>


          <div className="rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700">

            {predictions.length} Prediction
            {predictions.length !== 1
              ? "s"
              : ""}

          </div>

        </div>


        {/* ================================================= */}
        {/* EMPTY STATE */}
        {/* ================================================= */}

        {predictions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">

            <div className="text-5xl">
              🧠
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-800">
              No predictions yet
            </h3>

            <p className="mt-2 text-gray-500">
              Your AI prediction history will appear here.
            </p>

          </div>

        ) : (

          /* ================================================= */
          /* TABLE */
          /* ================================================= */

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>

                <tr className="border-b border-gray-200 text-left">

                  <th className="p-4 text-sm font-semibold text-gray-600">
                    Disease
                  </th>

                  <th className="p-4 text-sm font-semibold text-gray-600">
                    Confidence
                  </th>

                  <th className="p-4 text-sm font-semibold text-gray-600">
                    Risk Level
                  </th>

                  <th className="p-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {predictions.map((item) => {

                  const confidence =
                    Number(
                      item.confidence
                    ) || 0;

                  return (

                    <tr
                      key={item.id}
                      className="border-b border-gray-100 transition hover:bg-blue-50/40"
                    >

                      {/* =================================================
                          Disease
                      ================================================= */}

                      <td className="p-4">

                        <div className="font-semibold text-gray-800">

                          🧠{" "}

                          {item.predicted_disease}

                        </div>


                        {Array.isArray(
                          item.symptoms
                        ) &&
                          item.symptoms.length > 0 && (

                            <p className="mt-1 max-w-md truncate text-xs text-gray-500">

                              {item.symptoms
                                .slice(0, 3)
                                .map(
                                  formatSymptom
                                )
                                .join(" • ")}

                              {item.symptoms.length >
                                3 &&
                                ` +${
                                  item.symptoms.length -
                                  3
                                } more`}

                            </p>

                          )}

                      </td>


                      {/* =================================================
                          Confidence
                      ================================================= */}

                      <td className="p-4">

                        <div className="w-32">

                          <div className="mb-1 flex justify-between">

                            <span className="text-sm font-semibold text-blue-700">

                              {confidence}%

                            </span>

                          </div>


                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">

                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    confidence,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* =================================================
                          Risk Level
                      ================================================= */}

                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskStyle(
                            item.risk_level
                          )}`}
                        >

                          {item.risk_level}

                        </span>

                      </td>


                      {/* =================================================
                          Actions
                      ================================================= */}

                      <td className="p-4">

                        <div className="flex flex-wrap gap-2">

                          {/* View */}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPrediction(
                                item
                              )
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            👁️ View
                          </button>


                          {/* Health Report */}

                          <button
                            type="button"
                            onClick={() =>
                              setReportPredictionId(
                                item.id
                              )
                            }
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            📋 Report
                          </button>


                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() => {

                              if (
                                !Array.isArray(
                                  item.symptoms
                                ) ||
                                item.symptoms.length ===
                                  0
                              ) {

                                toast.error(
                                  "This prediction has no stored symptoms and cannot be edited."
                                );

                                return;
                              }

                              setEditingPrediction(
                                item
                              );

                            }}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            ✏️ Edit
                          </button>


                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            🗑️ Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ================================================= */}
      {/* VIEW DETAILS MODAL */}
      {/* ================================================= */}

      {selectedPrediction && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setSelectedPrediction(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-200 p-6">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  AI Prediction Details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">

                  🧠{" "}

                  {selectedPrediction.predicted_disease}

                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedPrediction(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200"
              >
                ×
              </button>

            </div>


            {/* Content */}

            <div className="space-y-5 p-6">

              {/* Disease / Confidence / Level */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-xs font-medium text-gray-500">
                    Predicted Disease
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {selectedPrediction.predicted_disease}
                  </p>

                </div>


                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-xs font-medium text-gray-500">
                    Confidence
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {selectedPrediction.confidence}%
                  </p>

                </div>


                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-xs font-medium text-gray-500">
                    Risk Level
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      selectedPrediction.risk_level ===
                      "Critical"
                        ? "text-red-600"
                        : selectedPrediction.risk_level ===
                          "High"
                        ? "text-orange-600"
                        : selectedPrediction.risk_level ===
                          "Moderate"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedPrediction.risk_level}
                  </p>

                </div>

              </div>


              {/* Symptoms */}

              <div className="rounded-xl border border-gray-200 p-5">

                <h3 className="font-bold text-gray-800">
                  🩺 Symptoms Used
                </h3>


                {Array.isArray(
                  selectedPrediction.symptoms
                ) &&
                selectedPrediction.symptoms.length >
                  0 ? (

                  <div className="mt-3 flex flex-wrap gap-2">

                    {selectedPrediction.symptoms.map(
                      (
                        symptom: string,
                        index: number
                      ) => (

                        <span
                          key={`${symptom}-${index}`}
                          className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
                        >
                          {formatSymptom(
                            symptom
                          )}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-gray-500">
                    Symptoms were not stored for this prediction.
                  </p>

                )}

              </div>


              {/* Recommendation */}

              <div className="rounded-xl border border-gray-200 p-5">

                <h3 className="font-bold text-gray-800">
                  💡 Recommendation
                </h3>

                <p className="mt-2 leading-7 text-gray-600">
                  {selectedPrediction.recommendation}
                </p>

              </div>


              {/* Disclaimer */}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

                <h3 className="font-bold text-blue-800">
                  ℹ️ Medical Disclaimer
                </h3>

                <p className="mt-2 text-sm leading-6 text-blue-700">
                  This result is an AI-generated prediction
                  based on the selected symptoms. It is not a
                  confirmed medical diagnosis and should not
                  replace evaluation by a qualified healthcare
                  professional.
                </p>

              </div>

            </div>


            {/* Footer */}

            <div className="flex justify-end border-t border-gray-200 p-6">

              <button
                type="button"
                onClick={() =>
                  setSelectedPrediction(null)
                }
                className="rounded-lg bg-gray-800 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-900"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* HEALTH RISK REPORT MODAL */}
      {/* ================================================= */}

      {reportPredictionId !== null && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setReportPredictionId(null)
          }
        >

          <div
            className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <HealthSummary
              predictionId={
                reportPredictionId
              }
              onClose={() =>
                setReportPredictionId(
                  null
                )
              }
            />

          </div>

        </div>

      )}

    </>
  );
}
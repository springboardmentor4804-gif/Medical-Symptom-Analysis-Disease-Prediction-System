"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  predictDisease,
  updateAIPrediction,
} from "@/services/prediction";
import { SYMPTOMS } from "@/data/symptoms";

interface Props {
  refreshTable: () => void;
  editingPrediction: any;
  setEditingPrediction: (prediction: any) => void;
}

/* =====================================================
   Format symptom for display
   high_fever -> High Fever
===================================================== */

const formatSymptomName = (symptom: string) => {
  return symptom
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PredictionForm({
  refreshTable,
  editingPrediction,
  setEditingPrediction,
}: Props) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [highlightedIndex, setHighlightedIndex] =
    useState(0);

  const [result, setResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  /* =====================================================
     Detect Edit Mode
  ===================================================== */

  const isEditing = Boolean(
    editingPrediction
  );

  /* =====================================================
     Load Editing Prediction
  ===================================================== */

  useEffect(() => {
    if (!editingPrediction) {
      return;
    }

    const storedSymptoms =
      Array.isArray(editingPrediction.symptoms)
        ? editingPrediction.symptoms
        : [];

    if (storedSymptoms.length === 0) {
      toast.error(
        "This prediction has no stored symptoms and cannot be edited."
      );

      setEditingPrediction(null);
      return;
    }

    setSymptoms(storedSymptoms);

    setSymptomInput("");

    setShowSuggestions(false);

    setHighlightedIndex(0);

    /*
      Show the existing prediction while editing.
    */

    const confidence =
  Number(editingPrediction.confidence) || 0;

const confidenceLevel =
  confidence >= 90
    ? "High"
    : confidence >= 70
    ? "Medium"
    : "Low";

setResult({
  disease:
    editingPrediction.predicted_disease,

  confidence,

  confidence_level:
    confidenceLevel,

  risk_score:
    editingPrediction.risk_score,

  risk_level:
    editingPrediction.risk_level,

  severity_score:
    editingPrediction.severity_score,

  severity_level:
    editingPrediction.severity_level,

  recommendation:
    editingPrediction.recommendation,

  top_predictions: [],
});

  }, [
    editingPrediction,
    setEditingPrediction,
  ]);

  /* =====================================================
     Search Symptoms
  ===================================================== */

  const filteredSymptoms = useMemo(() => {
    const search =
      symptomInput.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return SYMPTOMS
      .filter(
        (symptom) =>
          symptom
            .toLowerCase()
            .includes(search) &&
          !symptoms.includes(symptom)
      )
      .slice(0, 10);

  }, [
    symptomInput,
    symptoms,
  ]);

  /* =====================================================
     Add Symptom
  ===================================================== */

  const addSymptom = (
    symptom: string
  ) => {
    if (!symptom) {
      return;
    }

    if (symptoms.includes(symptom)) {
      toast.error(
        "Symptom already added"
      );
      return;
    }

    setSymptoms((prev) => [
      ...prev,
      symptom,
    ]);

    setSymptomInput("");

    setHighlightedIndex(0);

    setShowSuggestions(false);
  };

  /* =====================================================
     Remove Symptom
  ===================================================== */

  const removeSymptom = (
    symptom: string
  ) => {
    setSymptoms((prev) =>
      prev.filter(
        (item) => item !== symptom
      )
    );
  };

  /* =====================================================
     Submit / Update
  ===================================================== */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (symptoms.length === 0) {
      toast.error(
        "Please select at least one symptom"
      );

      return;
    }

    setShowSuggestions(false);

    try {
      setLoading(true);

      /* ================================================
         EDIT EXISTING AI PREDICTION
      ================================================= */

      if (isEditing) {
        const response =
          await updateAIPrediction(
            editingPrediction.id,
            symptoms
          );

        setResult(response);

        toast.success(
          "AI prediction updated successfully"
        );

        setEditingPrediction(null);

        refreshTable();

        return;
      }

      /* ================================================
         CREATE NEW AI PREDICTION
      ================================================= */

      const response =
        await predictDisease({
          symptoms,
        });

      setResult(response);

      toast.success(
        "AI prediction generated successfully"
      );

      refreshTable();

    } catch (error) {
      console.error(error);

      toast.error(
        isEditing
          ? "Unable to update AI prediction"
          : "Unable to generate AI prediction"
      );

    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     Cancel Edit
  ===================================================== */

  const cancelEdit = () => {
    setSymptoms([]);

    setSymptomInput("");

    setShowSuggestions(false);

    setHighlightedIndex(0);

    setResult(null);

    setEditingPrediction(null);
  };

  /* =====================================================
     New Prediction
  ===================================================== */

  const resetForm = () => {
    setSymptoms([]);

    setSymptomInput("");

    setShowSuggestions(false);

    setHighlightedIndex(0);

    setResult(null);

    setEditingPrediction(null);
  };

  /* =====================================================
     Other Predictions
  ===================================================== */

  const otherPredictions =
    result?.top_predictions?.filter(
      (prediction: any) =>
        prediction.disease !==
        result.disease
    ) || [];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6">

        <div className="flex items-center justify-between">

          <h2 className="text-xl font-bold text-gray-800">
            🧠 AI Disease Prediction
          </h2>

          {isEditing && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
              Editing Prediction #{editingPrediction.id}
            </span>
          )}

        </div>

        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? "Modify the symptoms and run the AI model again."
            : "Select your symptoms and let MedAssist AI predict possible diseases."}
        </p>

      </div>


      {/* ================================================= */}
      {/* FORM */}
      {/* ================================================= */}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="relative">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search Symptom
          </label>

          <input
            type="text"
            value={symptomInput}

            onChange={(e) => {
              setSymptomInput(
                e.target.value
              );

              setHighlightedIndex(0);

              setShowSuggestions(true);
            }}

            onFocus={() => {
              if (
                symptomInput.trim()
              ) {
                setShowSuggestions(true);
              }
            }}

            onKeyDown={(e) => {

              if (
                !showSuggestions ||
                filteredSymptoms.length === 0
              ) {
                return;
              }

              /* Arrow Down */

              if (
                e.key === "ArrowDown"
              ) {
                e.preventDefault();

                setHighlightedIndex(
                  (prev) =>
                    prev <
                    filteredSymptoms.length - 1
                      ? prev + 1
                      : 0
                );
              }

              /* Arrow Up */

              if (
                e.key === "ArrowUp"
              ) {
                e.preventDefault();

                setHighlightedIndex(
                  (prev) =>
                    prev > 0
                      ? prev - 1
                      : filteredSymptoms.length - 1
                );
              }

              /* Enter */

              if (
                e.key === "Enter"
              ) {
                e.preventDefault();

                const selectedSymptom =
                  filteredSymptoms[
                    highlightedIndex
                  ];

                if (selectedSymptom) {
                  addSymptom(
                    selectedSymptom
                  );
                }
              }

              /* Escape */

              if (
                e.key === "Escape"
              ) {
                e.preventDefault();

                setShowSuggestions(false);
              }

            }}

            placeholder="Search symptoms..."

            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />


          {/* ================================================= */}
          {/* SUGGESTIONS */}
          {/* ================================================= */}

          {showSuggestions &&
            filteredSymptoms.length > 0 && (

            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">

              {filteredSymptoms.map(
                (symptom, index) => (

                <button
                  key={symptom}
                  type="button"

                  onMouseDown={(e) => {
                    e.preventDefault();

                    addSymptom(
                      symptom
                    );
                  }}

                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm transition ${
                    index ===
                    highlightedIndex
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {formatSymptomName(
                    symptom
                  )}
                </button>

              ))}

            </div>

          )}

        </div>


        {/* ================================================= */}
        {/* SELECTED SYMPTOMS */}
        {/* ================================================= */}

        {symptoms.length > 0 && (

          <div>

            <p className="mb-2 text-sm font-medium text-gray-700">
              Selected Symptoms ({symptoms.length})
            </p>

            <div className="flex flex-wrap gap-2">

              {symptoms.map(
                (symptom) => (

                <div
                  key={symptom}
                  className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-800"
                >

                  <span>
                    {formatSymptomName(
                      symptom
                    )}
                  </span>

                  <button
                    type="button"

                    onClick={() =>
                      removeSymptom(
                        symptom
                      )
                    }

                    className="font-bold text-blue-600 hover:text-red-600"
                  >
                    ×
                  </button>

                </div>

              ))}

            </div>

          </div>

        )}


        {/* ================================================= */}
        {/* BUTTONS */}
        {/* ================================================= */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={loading}

            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? isEditing
                ? "Updating Prediction..."
                : "Analyzing Symptoms..."
              : isEditing
                ? "🔄 Update AI Prediction"
                : "🔮 Predict Disease"}

          </button>


          {isEditing && (

            <button
              type="button"
              onClick={cancelEdit}

              disabled={loading}

              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

          )}

        </div>

      </form>


      {/* ================================================= */}
      {/* AI RESULT */}
      {/* ================================================= */}

      {result && (

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

          {/* Header */}

          <div className="mb-6">

            <h3 className="text-xl font-bold text-gray-800">
              🧠 AI Prediction Result
            </h3>

            <p className="text-sm text-gray-500">
              Prediction generated by MedAssist AI
            </p>

          </div>


          {/* ================================================= */}
          {/* RESULT CARDS */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Disease */}

            <div className="rounded-xl bg-white p-5 shadow-sm">

              <p className="text-sm text-gray-500">
                AI-Suggested Condition
              </p>

              <h4 className="mt-2 text-xl font-bold text-gray-800">
                {result.disease}
              </h4>

            </div>


            {/* Confidence */}

            <div className="rounded-xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <p className="text-sm text-gray-500">
                  Prediction Confidence
                </p>

                <span className="text-xl font-bold text-blue-600">
                  {result.confidence}%
                </span>

              </div>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-700"

                  style={{
                    width: `${Math.min(
                      Math.max(
                        Number(
                          result.confidence
                        ) || 0,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>


            {/* Confidence Level */}

            <div className="rounded-xl bg-white p-5 shadow-sm">

              <p className="text-sm text-gray-500">
                Confidence Level
              </p>

              <h4
                className={`mt-2 text-xl font-bold ${
                  result.confidence_level ===
                  "High"
                    ? "text-green-600"
                    : result.confidence_level ===
                      "Medium"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {result.confidence_level}
              </h4>

            </div>

          </div>


          {/* ================================================= */}
          {/* OTHER POSSIBLE DISEASES */}
          {/* ================================================= */}

          {otherPredictions.length > 0 && (

            <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">

              <div className="mb-4">

                <h4 className="text-lg font-bold text-gray-800">
                  🔎 Other Possible Diseases
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Other possibilities identified by the AI model.
                </p>

              </div>

              <div className="space-y-3">

                {otherPredictions.map(
                  (
                    prediction: any,
                    index: number
                  ) => (

                  <div
                    key={`${prediction.disease}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        {index + 1}
                      </div>

                      <p className="font-semibold text-gray-800">
                        {prediction.disease}
                      </p>

                    </div>

                    <div className="font-bold text-blue-600">
                      {prediction.probability}%
                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}


          {/* ================================================= */}
{/* MILESTONE 3 RECOMMENDATIONS */}
{/* ================================================= */}

<div className="mt-5 space-y-4">

  {/* Treatment Suggestions */}

  {result.recommendations?.treatment_suggestions?.length > 0 && (
    <div className="rounded-xl bg-white p-5 shadow-sm">

      <p className="text-sm font-semibold text-indigo-700">
        💊 Treatment Suggestions
      </p>

      <ul className="mt-3 space-y-2">
        {result.recommendations.treatment_suggestions.map(
          (item: string, index: number) => (
            <li
              key={index}
              className="flex gap-2 text-sm text-gray-700"
            >
              <span className="font-bold text-indigo-600">
                •
              </span>

              <span>{item}</span>
            </li>
          )
        )}
      </ul>

    </div>
  )}


  {/* Preventive Advice */}

  {result.recommendations?.preventive_advice?.length > 0 && (
    <div className="rounded-xl bg-white p-5 shadow-sm">

      <p className="text-sm font-semibold text-green-700">
        🛡️ Preventive Advice
      </p>

      <ul className="mt-3 space-y-2">
        {result.recommendations.preventive_advice.map(
          (item: string, index: number) => (
            <li
              key={index}
              className="flex gap-2 text-sm text-gray-700"
            >
              <span className="font-bold text-green-600">
                •
              </span>

              <span>{item}</span>
            </li>
          )
        )}
      </ul>

    </div>
  )}


  {/* Lifestyle Advice */}

  {result.recommendations?.lifestyle_advice?.length > 0 && (
    <div className="rounded-xl bg-white p-5 shadow-sm">

      <p className="text-sm font-semibold text-blue-700">
        🏃 Lifestyle Advice
      </p>

      <ul className="mt-3 space-y-2">
        {result.recommendations.lifestyle_advice.map(
          (item: string, index: number) => (
            <li
              key={index}
              className="flex gap-2 text-sm text-gray-700"
            >
              <span className="font-bold text-blue-600">
                •
              </span>

              <span>{item}</span>
            </li>
          )
        )}
      </ul>

    </div>
  )}


  {/* Warning Signs */}

  {result.recommendations?.warning_signs?.length > 0 && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">

      <p className="text-sm font-semibold text-red-700">
        ⚠️ Warning Signs
      </p>

      <ul className="mt-3 space-y-2">
        {result.recommendations.warning_signs.map(
          (item: string, index: number) => (
            <li
              key={index}
              className="flex gap-2 text-sm text-red-700"
            >
              <span className="font-bold">
                •
              </span>

              <span>{item}</span>
            </li>
          )
        )}
      </ul>

    </div>
  )}


  {/* Advisory */}

  {result.recommendations?.advisory && (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">

      <p className="text-sm font-semibold text-indigo-800">
        💡 Medical Advisory
      </p>

      <p className="mt-2 text-sm leading-6 text-indigo-700">
        {result.recommendations.advisory}
      </p>

    </div>
  )}

</div>


          {/* ================================================= */}
          {/* MEDICAL DISCLAIMER */}
          {/* ================================================= */}

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="text-sm font-semibold text-blue-800">
              ℹ️ Medical Disclaimer
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              This result is an AI-generated prediction
              based on the selected symptoms. It is not a
              confirmed medical diagnosis and should not
              replace evaluation by a qualified healthcare
              professional.
            </p>

          </div>


          {/* ================================================= */}
          {/* LOW CONFIDENCE */}
          {/* ================================================= */}

          {result.confidence_level ===
            "Low" && (

            <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-5">

              <p className="font-semibold text-yellow-800">
                ⚠️ Low Prediction Confidence
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                The AI model has low confidence in
                this prediction. Please provide
                additional symptoms or consult a
                qualified healthcare professional
                for proper evaluation.
              </p>

            </div>

          )}


          {/* ================================================= */}
          {/* NEW PREDICTION */}
          {/* ================================================= */}

          {!isEditing && (

            <button
              type="button"
              onClick={resetForm}

              className="mt-5 rounded-lg bg-gray-600 px-5 py-3 text-white hover:bg-gray-700"
            >
              New Prediction
            </button>

          )}

        </div>

      )}

    </div>
  );
}
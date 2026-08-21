"use client";

import {
  HealthRiskPrediction,
  TopPrediction,
} from "@/services/prediction";

interface Props {
  prediction: HealthRiskPrediction;
  topPredictions: TopPrediction[];
}

export default function PredictionsCard({
  prediction,
  topPredictions,
}: Props) {
  const getConfidenceStyle = () => {
    switch (prediction.confidence_level) {
      case "High":
        return "bg-green-100 text-green-700";

      case "Medium":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      {/* =================================================
          Main Prediction
      ================================================= */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
            🧠
          </div>

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Predicted Disease
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {prediction.disease}
            </h2>

          </div>

        </div>

        {/* Confidence */}

        <div className="rounded-xl bg-gray-50 px-5 py-3 text-left sm:text-right">

          <p className="text-xs font-medium text-gray-500">
            Confidence
          </p>

          <div className="mt-1 flex items-center gap-2 sm:justify-end">

            <span className="text-2xl font-bold text-blue-700">
              {prediction.confidence}%
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getConfidenceStyle()}`}
            >
              {prediction.confidence_level}
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          Confidence Progress
      ================================================= */}

      <div className="mt-6">

        <div className="mb-2 flex justify-between text-xs text-gray-500">

          <span>
            Model confidence
          </span>

          <span>
            {prediction.confidence}%
          </span>

        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">

          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min(
                Math.max(
                  prediction.confidence,
                  0
                ),
                100
              )}%`,
            }}
          />

        </div>

      </div>


      {/* =================================================
          Top Predictions
      ================================================= */}

      <div className="mt-7 border-t border-gray-100 pt-6">

        <div className="flex items-center justify-between">

          <div>

            <h3 className="font-bold text-gray-900">
              🔎 Top Predictions
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Other diseases considered by the AI model.
            </p>

          </div>

        </div>


        {topPredictions.length > 0 ? (

          <div className="mt-4 space-y-3">

            {topPredictions.map(
              (
                item,
                index
              ) => {

                const probability = Math.min(
                  Math.max(
                    item.probability,
                    0
                  ),
                  100
                );

                return (
                  <div
                    key={`${item.disease}-${index}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-600 shadow-sm">
                          {index + 1}
                        </span>

                        <span className="truncate text-sm font-semibold text-gray-800">
                          {item.disease}
                        </span>

                      </div>

                      <span className="shrink-0 text-sm font-bold text-blue-700">
                        {item.probability}%
                      </span>

                    </div>


                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">

                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${probability}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        ) : (

          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center">

            <p className="text-sm text-gray-500">
              No alternative predictions available.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}
"use client";

interface Props {
  symptoms: string[];
}

export default function SymptomsCard({
  symptoms,
}: Props) {
  const formatSymptom = (symptom: string) => {
    return symptom
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      {/* Header */}

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
          🩺
        </div>

        <div>
          <h2 className="font-bold text-gray-900">
            Symptoms Used
          </h2>

          <p className="text-sm text-gray-500">
            Symptoms used by the AI prediction system.
          </p>
        </div>

      </div>


      {/* Symptoms */}

      {Array.isArray(symptoms) &&
      symptoms.length > 0 ? (

        <div className="mt-5 flex flex-wrap gap-2">

          {symptoms.map(
            (
              symptom,
              index
            ) => (

              <span
                key={`${symptom}-${index}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"
              >
                {formatSymptom(
                  symptom
                )}
              </span>

            )
          )}

        </div>

      ) : (

        <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">

          <p className="text-sm text-gray-500">
            No symptoms were recorded for this report.
          </p>

        </div>

      )}

    </div>
  );
}
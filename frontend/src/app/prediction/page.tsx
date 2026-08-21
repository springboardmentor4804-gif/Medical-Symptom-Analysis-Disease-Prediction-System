"use client";

import { useState } from "react";
import PredictionForm from "@/components/prediction/PredictionForm";
import PredictionTable from "@/components/prediction/PredictionTable";

export default function PredictionPage() {
  const [refresh, setRefresh] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<any>(null);

  const refreshTable = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Disease Prediction
          </h1>

          <p className="text-gray-600 mt-2">
            Create, update and manage patient disease predictions.
          </p>
        </div>

        <PredictionForm
          refreshTable={refreshTable}
          editingPrediction={editingPrediction}
          setEditingPrediction={setEditingPrediction}
        />

        <PredictionTable
          refresh={refresh}
          refreshTable={refreshTable}
          setEditingPrediction={setEditingPrediction}
        />
      </div>
    </div>
  );
}
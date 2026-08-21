"use client";

import { useState } from "react";
import SymptomForm from "@/components/symptoms/SymptomForm";
import SymptomTable from "@/components/symptoms/SymptomTable";

export default function SymptomsPage() {
  const [refresh, setRefresh] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<any>(null);

  const refreshTable = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Patient Symptoms
          </h1>

          <p className="text-gray-600 mt-2">
            Record and manage patient symptoms.
          </p>
        </div>

        <SymptomForm
          refreshTable={refreshTable}
          editingSymptom={editingSymptom}
          setEditingSymptom={setEditingSymptom}
        />

        <SymptomTable
          refresh={refresh}
          refreshTable={refreshTable}
          setEditingSymptom={setEditingSymptom}
        />
      </div>
    </div>
);
}
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteSymptom,
  getSymptoms,
} from "@/services/symptom";

interface Props {
  refresh: boolean;
  refreshTable: () => void;
  setEditingSymptom: (symptom: any) => void;
}

export default function SymptomTable({
  refresh,
  refreshTable,
  setEditingSymptom,
}: Props) {
  const [symptoms, setSymptoms] = useState<any[]>([]);

  useEffect(() => {
    fetchSymptoms();
  }, [refresh]);

  const fetchSymptoms = async () => {
    try {
      const data = await getSymptoms();
      setSymptoms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this symptom record?")) return;

    try {
      await deleteSymptom(id);
      toast.success("Symptom deleted successfully");
      refreshTable();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete symptom");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">
        Symptoms History
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3">Fever</th>
              <th className="p-3">Cough</th>
              <th className="p-3">Headache</th>
              <th className="p-3">Fatigue</th>
              <th className="p-3">Temperature</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {symptoms.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-6 text-gray-500"
                >
                  No symptoms found.
                </td>
              </tr>
            ) : (
              symptoms.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="p-3">{item.fever}</td>
                  <td className="p-3">{item.cough}</td>
                  <td className="p-3">{item.headache}</td>
                  <td className="p-3">{item.fatigue}</td>
                  <td className="p-3">{item.temperature}</td>

                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => setEditingSymptom(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
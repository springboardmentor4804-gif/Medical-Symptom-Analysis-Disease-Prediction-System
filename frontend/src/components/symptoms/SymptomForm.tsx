"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createSymptom,
  updateSymptom,
  SymptomData,
} from "@/services/symptom";

interface Props {
  refreshTable: () => void;
  editingSymptom: any;
  setEditingSymptom: (value: any) => void;
}

const initialForm: SymptomData = {
  fever: "",
  cough: "",
  headache: "",
  fatigue: "",
  chest_pain: "",
  shortness_of_breath: "",
  blood_pressure: "",
  heart_rate: "",
  blood_sugar: "",
  temperature: "",
  notes: "",
};

export default function SymptomForm({
  refreshTable,
  editingSymptom,
  setEditingSymptom,
}: Props) {
  const [formData, setFormData] = useState<SymptomData>(initialForm);

  useEffect(() => {
    if (editingSymptom) {
      setFormData({
        fever: editingSymptom.fever || "",
        cough: editingSymptom.cough || "",
        headache: editingSymptom.headache || "",
        fatigue: editingSymptom.fatigue || "",
        chest_pain: editingSymptom.chest_pain || "",
        shortness_of_breath: editingSymptom.shortness_of_breath || "",
        blood_pressure: editingSymptom.blood_pressure || "",
        heart_rate: editingSymptom.heart_rate || "",
        blood_sugar: editingSymptom.blood_sugar || "",
        temperature: editingSymptom.temperature || "",
        notes: editingSymptom.notes || "",
      });
    } else {
      setFormData(initialForm);
    }
  }, [editingSymptom]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSymptom) {
        await updateSymptom(editingSymptom.id, formData);
        toast.success("Symptoms updated successfully");
      } else {
        await createSymptom(formData);
        toast.success("Symptoms saved successfully");
      }

      setFormData(initialForm);
      setEditingSymptom(null);
      refreshTable();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">
        {editingSymptom ? "Update Symptoms" : "Add Symptoms"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <input
          name="fever"
          placeholder="Fever"
          value={formData.fever}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="cough"
          placeholder="Cough"
          value={formData.cough}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="headache"
          placeholder="Headache"
          value={formData.headache}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="fatigue"
          placeholder="Fatigue"
          value={formData.fatigue}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="chest_pain"
          placeholder="Chest Pain"
          value={formData.chest_pain}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="shortness_of_breath"
          placeholder="Shortness of Breath"
          value={formData.shortness_of_breath}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="blood_pressure"
          placeholder="Blood Pressure"
          value={formData.blood_pressure}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="heart_rate"
          placeholder="Heart Rate"
          value={formData.heart_rate}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="blood_sugar"
          placeholder="Blood Sugar"
          value={formData.blood_sugar}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="temperature"
          placeholder="Temperature"
          value={formData.temperature}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="border rounded-lg p-3 md:col-span-2"
          rows={4}
        />

        <div className="md:col-span-2 flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {editingSymptom ? "Update Symptoms" : "Save Symptoms"}
          </button>

          {editingSymptom && (
            <button
              type="button"
              onClick={() => {
                setEditingSymptom(null);
                setFormData(initialForm);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
import api from "./api";

export interface SymptomData {
  fever: string;
  cough: string;
  headache: string;
  fatigue: string;
  chest_pain: string;
  shortness_of_breath: string;
  blood_pressure: string;
  heart_rate: string;
  blood_sugar: string;
  temperature: string;
  notes: string;
}
export const createSymptom = async (data: SymptomData) => {
  const token = localStorage.getItem("token");

  const response = await api.post("/patient/symptoms", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getSymptoms = async () => {
  const token = localStorage.getItem("token");

      const response = await api.get("/patient/symptoms/history", {    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateSymptom = async (id: number, data: SymptomData) => {
  const token = localStorage.getItem("token");

  const response = await api.put(`/patient/symptoms/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const deleteSymptom = async (id: number) => {
  const token = localStorage.getItem("token");

  const response = await api.delete(`/patient/symptoms/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
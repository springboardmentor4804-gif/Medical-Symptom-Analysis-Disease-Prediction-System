import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getPatientProfile = async () => {
  const res = await API.get("/patient/profile");
  return res.data;
};

export const updatePatientProfile = async (data: any) => {
  const res = await API.put("/patient/profile", data);
  return res.data;
};
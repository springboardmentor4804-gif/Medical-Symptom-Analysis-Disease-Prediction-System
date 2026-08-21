import api from "./api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const getProfileReport = async () => {
  const response = await api.get(
    "/reports/profile",
    authHeaders()
  );

  return response.data;
};

export const getSymptomsReport = async () => {
  const response = await api.get(
    "/reports/symptoms",
    authHeaders()
  );

  return response.data;
};

export const getPredictionsReport = async () => {
  const response = await api.get(
    "/reports/predictions",
    authHeaders()
  );

  return response.data;
};

export const getSummaryReport = async () => {
  const response = await api.get(
    "/reports/summary",
    authHeaders()
  );

  return response.data;
};
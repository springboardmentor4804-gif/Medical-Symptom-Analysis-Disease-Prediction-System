import api from "./api";

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};
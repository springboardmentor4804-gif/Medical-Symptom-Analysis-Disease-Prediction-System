import api from "./api";

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export const loginUser = async (
  data: LoginData
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data);
  return response.data;
};
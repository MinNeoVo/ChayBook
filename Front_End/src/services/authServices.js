import { apiFetch } from "./api";

export const registerUser = async (userData) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (loginData) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  });
};

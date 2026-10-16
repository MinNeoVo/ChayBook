import { apiFetch } from "./api";

export const registerUser = async (userData) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const verifyRegistration = async (email, code) => apiFetch("/auth/register/verify", {
  method: "POST", body: JSON.stringify({ email, code }),
});

export const requestPasswordReset = async (email) => apiFetch("/auth/forgot-password", {
  method: "POST", body: JSON.stringify({ email }),
});

export const verifyPasswordResetOtp = async (email, code) => apiFetch("/auth/forgot-password/verify", {
  method: "POST", body: JSON.stringify({ email, code }),
});

export const resetPassword = async (email, resetToken, newPassword) => apiFetch("/auth/reset-password", {
  method: "POST", body: JSON.stringify({ email, resetToken, newPassword }),
});

export const loginUser = async (loginData) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  });
};

export const getCurrentUser = async () => {
  return apiFetch("/auth/me", {
    method: "GET",
  });
};

export const logoutUser = async () => {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
};

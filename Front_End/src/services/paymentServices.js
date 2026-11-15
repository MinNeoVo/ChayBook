import { apiFetch } from "./api";

export const createPaymentLink = async () => {
  return apiFetch("/payment/create-payment-link", {
    method: "POST",
  });
};

export const checkPaymentStatus = async (orderCode) => {
  return apiFetch(`/payment/check-status/${orderCode}`, {
    method: "GET",
  });
};

export const simulatePaymentSuccess = async (orderCode) => {
  return apiFetch(`/payment/simulate-success/${orderCode}`, {
    method: "POST",
  });
};

export const getMySubscription = async () => {
  return apiFetch("/payment/my-subscription", {
    method: "GET",
  });
};


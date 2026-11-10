import { apiFetch } from "./api";
import API_BASE_URL from "./app";
import {
  getSocialAuthorizationUrl,
  validateSocialAuthorizationUrl,
} from "../utils/socialAuth";

const socialPost = async (endpoint, body = {}) => {
  const csrf = await apiFetch("/auth/social/csrf");
  if (!csrf?.token || !csrf?.headerName) throw new Error("CSRF_INVALID");
  return apiFetch(endpoint, {
    method: "POST",
    headers: { [csrf.headerName]: csrf.token },
    body: JSON.stringify(body),
  });
};

export const getSocialProviders = () => apiFetch("/auth/social/providers");

export const startSocialLogin = (provider) => {
  window.location.assign(getSocialAuthorizationUrl(API_BASE_URL, provider, window.location.origin));
};

export const getPendingSocialRegistration = () => apiFetch("/auth/social/pending");

export const requestSocialRegistrationCode = (email) =>
  socialPost("/auth/social/registration/code", { email });

export const completeSocialRegistration = (email, code) =>
  socialPost("/auth/social/registration/complete", { email, code });

export const getSocialConnections = () => apiFetch("/auth/social/connections");

export const requestSocialLinkCode = () => socialPost("/auth/social/link/code");

export const linkSocialAccount = async (provider, credentials = {}) => {
  // Validate the provider before it becomes a path segment.
  getSocialAuthorizationUrl(API_BASE_URL, provider, window.location.origin);
  const result = await socialPost(`/auth/social/link/${provider}`, credentials);
  window.location.assign(validateSocialAuthorizationUrl(
    result?.authorizationUrl,
    API_BASE_URL,
    window.location.origin,
  ));
};

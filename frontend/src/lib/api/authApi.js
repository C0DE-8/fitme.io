import { api } from "../api";

export function login(payload) {
  return api.post("/auth/login", payload).then((res) => res.data);
}

export function register(payload) {
  return api.post("/auth/register", payload).then((res) => res.data);
}

export function verifyOtp(payload) {
  return api.post("/auth/verify-otp", payload).then((res) => res.data);
}

import { api } from "../api";

export function getUserProfile() {
  return api.get("/user/profile").then((res) => res.data.profile);
}

export function getUserSubscriptionStatus() {
  return api.get("/user/subscription/status").then((res) => res.data);
}

export function getUserStorage() {
  return api.get("/user/storage").then((res) => res.data.storage);
}

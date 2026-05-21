import { api } from "../api";

export function getAdminProfile() {
  return api.get("/admin/profile").then((res) => res.data.profile);
}

export function getAdminStats() {
  return api.get("/admin/stats/users").then((res) => res.data);
}

export function getAdminUsers() {
  return api.get("/admin/users").then((res) => res.data.users);
}

export function getAdminAccounts() {
  return api.get("/admin/accounts").then((res) => res.data.accounts);
}

export function getAdminPlans() {
  return api.get("/admin/plans").then((res) => res.data.plans);
}

export function getPendingSubscriptions() {
  return api
    .get("/admin/subscriptions/pending")
    .then((res) => res.data.pendingSubscriptions);
}

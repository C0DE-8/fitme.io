import { api } from "../api";

export function getAdminProfile() {
  return api.get("/admin/profile").then((res) => res.data.profile);
}

export function changeAdminPassword(payload) {
  return api.put("/admin/profile/password", payload).then((res) => res.data);
}

export function getAdminStats() {
  return api.get("/admin/stats/users").then((res) => res.data);
}

export function getAdminUsers() {
  return api.get("/admin/users").then((res) => res.data.users);
}

export function getAdminUsersWithSubscriptions() {
  return api.get("/admin/users-with-subscriptions").then((res) => res.data.users);
}

export function deleteAdminUser(id) {
  return api.delete(`/admin/users/${id}`).then((res) => res.data);
}

export function createAdminDemoUser(payload) {
  return api.post("/admin/users/demo", payload).then((res) => res.data);
}

export function getAdminDemoUsers() {
  return api.get("/admin/users/demo-management").then((res) => res.data);
}

export function getAdminAutoFollowSettings() {
  return api.get("/admin/users/auto-follow/settings").then((res) => res.data.settings);
}

export function updateAdminAutoFollowSettings(payload) {
  return api.put("/admin/users/auto-follow/settings", payload).then((res) => res.data);
}

export function getAdminSubscriptions() {
  return api.get("/admin/subscriptions").then((res) => res.data.subscriptions);
}

export function createAdminSubscription(payload) {
  return api.post("/admin/subscriptions", payload).then((res) => res.data);
}

export function updateAdminSubscription(id, payload) {
  return api.put(`/admin/subscriptions/${id}`, payload).then((res) => res.data);
}

export function extendAdminSubscription(id, days) {
  return api.post(`/admin/subscriptions/${id}/extend`, { days }).then((res) => res.data);
}

export function deleteAdminSubscription(id) {
  return api.delete(`/admin/subscriptions/${id}`).then((res) => res.data);
}

export function confirmAdminSubscription(id) {
  return api.post(`/admin/subscriptions/${id}/confirm`).then((res) => res.data);
}

export function rejectAdminSubscription(id) {
  return api.post(`/admin/subscriptions/${id}/reject`).then((res) => res.data);
}

export function getAdminAccounts() {
  return api.get("/admin/accounts").then((res) => res.data.accounts);
}

function toAccountFormData(payload) {
  const formData = new FormData();

  formData.append("bank_name", payload.bank_name);
  formData.append("account_name", payload.account_name);
  formData.append("account_number", payload.account_number);

  if (payload.account_logo) {
    formData.append("account_logo", payload.account_logo);
  }

  return formData;
}

export function createAdminAccount(payload) {
  return api.post("/admin/accounts", toAccountFormData(payload)).then((res) => res.data);
}

export function updateAdminAccount(id, payload) {
  return api.put(`/admin/accounts/${id}`, toAccountFormData(payload)).then((res) => res.data);
}

export function deleteAdminAccount(id) {
  return api.delete(`/admin/accounts/${id}`).then((res) => res.data);
}

export function getAdminPlans() {
  return api.get("/admin/plans").then((res) => res.data.plans);
}

export function createAdminPlan(payload) {
  return api.post("/admin/plans", payload).then((res) => res.data);
}

export function updateAdminPlan(id, payload) {
  return api.put(`/admin/plans/${id}`, payload).then((res) => res.data);
}

export function deleteAdminPlan(id) {
  return api.delete(`/admin/plans/${id}`).then((res) => res.data);
}

export function getPendingSubscriptions() {
  return api
    .get("/admin/subscriptions/pending")
    .then((res) => res.data.pendingSubscriptions);
}

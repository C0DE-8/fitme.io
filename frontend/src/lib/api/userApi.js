import { api, APP_BASE } from "../api";

export function getUserProfile() {
  return api.get("/user/profile").then((res) => res.data.profile);
}

export function updateUserProfile(payload) {
  return api.put("/user/profile", payload).then((res) => res.data);
}

export function changeUserPassword(payload) {
  return api.put("/user/profile/password", payload).then((res) => res.data);
}

export function deleteUserAccount(password) {
  return api.delete("/user/profile", { data: { password } }).then((res) => res.data);
}

export function getUserSubscriptionStatus() {
  return api.get("/user/subscription/status").then((res) => res.data);
}

export function getUserSubscriptions(status = "") {
  const params = status ? { status } : undefined;
  return api.get("/user/subscriptions/my", { params }).then((res) => res.data.subscriptions);
}

export function getUserPlans() {
  return api.get("/user/plans").then((res) => res.data.plans);
}

export function getUserAccounts() {
  return api.get("/user/accounts").then((res) => res.data.accounts);
}

export function getFlutterwaveBanks(country = "NG") {
  return api.get("/user/payments/banks", { params: { country } }).then((res) => res.data.banks);
}

export function resolveFlutterwaveAccount(payload) {
  return api.post("/user/payments/resolve-account", payload).then((res) => res.data.account);
}

export function createUserSubscription(payload) {
  const formData = new FormData();

  formData.append("plan_name", payload.plan_name);
  formData.append("payment_proof", payload.payment_proof);

  return api.post("/user/subscribe", formData).then((res) => res.data);
}

export function updateUserSubscriptionPayer(id, payload) {
  return api.put(`/user/subscriptions/${id}/payer`, payload).then((res) => res.data);
}

export function getUserStorage() {
  return api.get("/user/storage").then((res) => res.data.storage);
}

export function getUserStorageItems() {
  return api.get("/user/storage-items").then((res) => res.data.storage_items);
}

export function addUserStorageItem(itemName) {
  return api.post("/user/storage/add", { item_name: itemName }).then((res) => res.data);
}

export function removeUserStorageItem(id) {
  return api.delete(`/user/storage/remove/${id}`).then((res) => res.data);
}

export function removeAllUserStorageItems() {
  return api.delete("/user/storage/remove-all").then((res) => res.data);
}

export function enableUserStorageShare() {
  return api.post("/user/storage/share").then((res) => {
    const data = res.data;
    return {
      ...data,
      app_share_url: data.share_id ? `${window.location.origin}/shared-storage/${data.share_id}` : data.share_url,
    };
  });
}

export function disableUserStorageShare() {
  return api.delete("/user/storage/share").then((res) => res.data);
}

export function getSharedStorage(shareId) {
  return api.get(`/user/storage/shared/${shareId}`).then((res) => res.data);
}

export function getSharedStorageSuggestions(shareId, type = "") {
  const params = type ? { type } : undefined;
  return api.get(`/user/storage/shared/${shareId}/suggestions`, { params }).then((res) => res.data);
}

export function submitSharedStorageSuggestion(shareId, foodId, payload) {
  return api.post(`/user/storage/shared/${shareId}/suggestions/${foodId}`, payload).then((res) => res.data);
}

export function getUserStorageFriendSuggestions() {
  return api.get("/user/storage/friend-suggestions").then((res) => res.data.suggestions);
}

export function removeUserStorageFriendSuggestion(id) {
  return api.delete(`/user/storage/friend-suggestions/${id}`).then((res) => res.data);
}

export function backendSharedStorageUrl(shareId) {
  return `${APP_BASE}/shared-storage.html?id=${encodeURIComponent(shareId)}`;
}

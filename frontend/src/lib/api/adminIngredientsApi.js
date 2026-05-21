import { api } from "../api";

function toIngredientFormData(payload) {
  const formData = new FormData();
  formData.append("name", payload.name);

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
}

export function getAdminIngredients() {
  return api.get("/admin/storage-items").then((res) => res.data.storage_items);
}

export function createAdminIngredient(payload) {
  return api.post("/admin/storage-items/add", toIngredientFormData(payload)).then((res) => res.data);
}

export function updateAdminIngredient(id, payload) {
  return api.put(`/admin/storage-items/${id}`, toIngredientFormData(payload)).then((res) => res.data);
}

export function deleteAdminIngredient(id) {
  return api.delete(`/admin/storage-items/${id}`).then((res) => res.data);
}

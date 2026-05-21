import { api } from "../api";

function toFoodFormData(payload) {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("package", payload.package);
  formData.append("type", payload.type);
  formData.append("prepared", payload.prepared);
  formData.append("ingredients", JSON.stringify(payload.ingredients));

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
}

export function getAdminFoods() {
  return api.get("/admin/foods").then((res) => res.data.foods);
}

export function getAdminFood(id) {
  return api.get(`/admin/foods/${id}`).then((res) => res.data.food);
}

export function createAdminFood(payload) {
  return api.post("/admin/foods", toFoodFormData(payload)).then((res) => res.data);
}

export function updateAdminFood(id, payload) {
  return api.put(`/admin/foods/${id}`, toFoodFormData(payload)).then((res) => res.data);
}

export function deleteAdminFood(id) {
  return api.delete(`/admin/foods/${id}`).then((res) => res.data);
}

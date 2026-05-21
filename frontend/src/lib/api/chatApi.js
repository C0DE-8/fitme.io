import { api } from "../api";

export function askFitmeAi(message) {
  return api.post("/chat", { message }).then((res) => res.data);
}

export function getChatHistory() {
  return api.get("/chat/history").then((res) => res.data);
}

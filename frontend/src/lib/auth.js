const TOKEN_KEY = "fitme_token";
const USER_KEY = "fitme_user";
const STORAGE_PROMPT_KEY = "fitme_storage_prompt_seen";

export function saveSession({ token, user, token_kind: tokenKind }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, tokenKind }));
  sessionStorage.removeItem(STORAGE_PROMPT_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function updateCurrentUser(updates) {
  const user = getCurrentUser();
  if (!user) return;

  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...updates }));
}

export function isAdminSession() {
  return getCurrentUser()?.role === "admin";
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(STORAGE_PROMPT_KEY);
}

export function hasSeenStoragePrompt() {
  return sessionStorage.getItem(STORAGE_PROMPT_KEY) === "true";
}

export function markStoragePromptSeen() {
  sessionStorage.setItem(STORAGE_PROMPT_KEY, "true");
}

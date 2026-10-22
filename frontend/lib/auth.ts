const TOKEN_KEY = "token";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

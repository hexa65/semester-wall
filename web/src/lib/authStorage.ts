// The login token is kept in localStorage so a refresh does not log you out.
// Storage can throw (private mode, blocked cookies), so every call is wrapped in try/catch.
const KEY = "semester-wall-token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // Without storage the login lasts until the page is closed or refreshed.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

export const hasToken = (): boolean => getToken() !== null;

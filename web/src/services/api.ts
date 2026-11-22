import axios, { isAxiosError } from "axios";
import { clearToken, getToken } from "../lib/authStorage";

const baseURL: string | undefined = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("VITE_API_URL is missing. Copy .env.example to .env (and set it on Vercel before the build).");
}

// A typed axios instance. The timeout is long on purpose: the free API host sleeps
// when nobody uses it, and the first request can take 30 to 60 seconds to wake it.
export const api = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""),
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

// Every request carries the saved login token.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// If the API says "not logged in" (token expired or changed) anywhere except the login form itself,
// forget the token and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const onAuthForm = url.startsWith("/auth/login") || url.startsWith("/auth/register");
      if (!onAuthForm && window.location.pathname !== "/login") {
        clearToken();
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

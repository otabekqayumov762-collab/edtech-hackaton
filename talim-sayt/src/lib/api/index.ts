import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:8000/api/v1';

const ACCESS_KEY = 'mf_access';
const REFRESH_KEY = 'mf_refresh';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setTokens(tokens: { access: string; refresh: string }): void {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}

function getAccess(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

function getRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

// --- Request interceptor: attach Bearer token --------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Response interceptor: refresh on 401 ------------------------------------
type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefresh();
  if (!refresh) return null;

  try {
    // Use a raw axios call to avoid re-triggering interceptors.
    const res = await axios.post<{ access: string; refresh?: string }>(
      `${BASE_URL}/token/refresh/`,
      { refresh },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const newAccess = res.data.access;
    const newRefresh = res.data.refresh ?? refresh;
    setTokens({ access: newAccess, refresh: newRefresh });
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config as RetryableConfig | undefined;
    const status = error?.response?.status as number | undefined;

    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)['Authorization'] =
          `Bearer ${newToken}`;
        return api.request(original);
      }

      // Refresh failed -> clear tokens and bounce to /login.
      clearTokens();
      if (typeof window !== 'undefined' && window.location) {
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;

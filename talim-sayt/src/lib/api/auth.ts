import { api, setTokens, clearTokens } from './index';

export interface User {
  id: number | string;
  email: string;
  name: string;
  region?: string;
  grade?: string;
  avatar_color?: string;
  plan?: string;
  xp?: number;
  streak?: number;
  daily_goal?: number;
  daily_done?: number;
  lives?: number;
  lives_max?: number;
  joined?: string;
  last_active?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  region?: string;
  grade?: string;
}

export interface RefreshResponse {
  access: string;
  refresh?: string;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register/', payload);
  setTokens({ access: res.data.access, refresh: res.data.refresh });
  return res.data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login/', { email, password });
  setTokens({ access: res.data.access, refresh: res.data.refresh });
  return res.data;
}

export async function me(): Promise<User> {
  const res = await api.get<User>('/auth/me/');
  return res.data;
}

export async function updateMe(patch: Partial<User>): Promise<User> {
  const res = await api.patch<User>('/auth/me/', patch);
  return res.data;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const res = await api.post<RefreshResponse>('/token/refresh/', {
    refresh: refreshToken,
  });
  return res.data;
}

export function logout(): void {
  clearTokens();
}

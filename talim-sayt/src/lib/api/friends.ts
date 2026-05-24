import { api } from './index';

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar_color?: string;
  xp: number;
  level: number;
  streak: number;
  online?: boolean;
}

export interface PendingRequest {
  id: string;
  from: Friend;
  created_at: string;
}

export async function list(): Promise<Friend[]> {
  const res = await api.get<Friend[]>('/friends/');
  return res.data;
}

export async function pending(): Promise<PendingRequest[]> {
  const res = await api.get<PendingRequest[]>('/friends/requests/');
  return res.data;
}

export async function search(query: string): Promise<Friend[]> {
  const res = await api.get<Friend[]>('/friends/search/', {
    params: { q: query },
  });
  return res.data;
}

export async function add(userId: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>('/friends/request/', {
    user_id: userId,
  });
  return res.data;
}

export async function accept(requestId: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>(
    `/friends/requests/${requestId}/accept/`,
  );
  return res.data;
}

export async function reject(requestId: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>(
    `/friends/requests/${requestId}/reject/`,
  );
  return res.data;
}

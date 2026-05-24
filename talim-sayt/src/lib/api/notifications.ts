import { api } from './index';

export type NotifType =
  | 'daily'
  | 'motivation'
  | 'streak'
  | 'reward'
  | 'comeback';

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

export async function list(): Promise<Notif[]> {
  const res = await api.get<Notif[]>('/notifications/');
  return res.data;
}

export async function markRead(id: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>(
    `/notifications/${id}/read/`,
  );
  return res.data;
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>('/notifications/read-all/');
  return res.data;
}

export async function clearAll(): Promise<{ ok: boolean }> {
  const res = await api.delete<{ ok: boolean }>('/notifications/');
  return res.data;
}

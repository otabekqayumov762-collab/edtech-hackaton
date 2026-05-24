import { api } from './index';

export interface TeamMember {
  user_id: string;
  name: string;
  avatar_color?: string;
  weekly_xp: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  description: string;
  members: TeamMember[];
  weekly_xp: number;
  total_xp: number;
  rank: number;
  is_open: boolean;
  captain_id: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  color: string;
}

export async function list(): Promise<Team[]> {
  const res = await api.get<Team[]>('/teams/');
  return res.data;
}

export async function retrieve(id: string): Promise<Team> {
  const res = await api.get<Team>(`/teams/${id}/`);
  return res.data;
}

export async function create(payload: CreateTeamPayload): Promise<Team> {
  const res = await api.post<Team>('/teams/', payload);
  return res.data;
}

export async function join(id: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>(`/teams/${id}/join/`);
  return res.data;
}

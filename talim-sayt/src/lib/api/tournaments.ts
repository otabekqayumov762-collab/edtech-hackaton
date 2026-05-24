import { api } from './index';

export interface TournamentPrize {
  rank: number;
  reward: string;
  xp: number;
}

export interface TournamentEntry {
  id: string;
  name: string;
  region?: string;
  xp: number;
  avatar_color?: string;
  is_current?: boolean;
  rank?: number;
}

export interface Tournament {
  id: string;
  title: string;
  desc: string;
  ends_at: string;
  prize: string;
  participants: number;
  top_prizes: TournamentPrize[];
  joined?: boolean;
  my_rank?: number;
  accent?: string;
  icon?: string;
  entries?: TournamentEntry[];
}

export async function list(): Promise<Tournament[]> {
  const res = await api.get<Tournament[]>('/tournaments/');
  return res.data;
}

export async function retrieve(id: string): Promise<Tournament> {
  const res = await api.get<Tournament>(`/tournaments/${id}/`);
  return res.data;
}

export async function join(id: string): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>(`/tournaments/${id}/join/`);
  return res.data;
}

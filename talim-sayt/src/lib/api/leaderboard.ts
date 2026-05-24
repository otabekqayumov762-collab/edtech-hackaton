import { api } from './index';

export interface LeaderUser {
  id: number | string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  region?: string;
  avatar_color?: string;
  rank?: number;
  is_current?: boolean;
}

export interface MyRank {
  rank: number;
  xp: number;
  level: number;
  total_users?: number;
  user: LeaderUser;
}

export interface LeaderboardParams {
  page?: number;
  page_size?: number;
  region?: string;
}

export async function global(
  params?: LeaderboardParams,
): Promise<LeaderUser[]> {
  const res = await api.get<LeaderUser[]>('/leaderboard/global/', { params });
  return res.data;
}

export async function weekly(
  params?: LeaderboardParams,
): Promise<LeaderUser[]> {
  const res = await api.get<LeaderUser[]>('/leaderboard/weekly/', { params });
  return res.data;
}

export async function me(): Promise<MyRank> {
  const res = await api.get<MyRank>('/leaderboard/me/');
  return res.data;
}

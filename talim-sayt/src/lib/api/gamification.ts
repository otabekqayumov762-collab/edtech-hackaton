import { api } from './index';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: number;
  metric: 'xp' | 'streak' | 'tests' | 'lessons' | 'level' | 'perfect';
  unlocked?: boolean;
  progress?: number;
}

export interface GamificationSummary {
  xp: number;
  level: number;
  streak: number;
  achievements: Achievement[];
}

export async function summary(): Promise<GamificationSummary> {
  const res = await api.get<GamificationSummary>('/gamification/');
  return res.data;
}

export async function achievements(): Promise<Achievement[]> {
  const res = await api.get<Achievement[]>('/gamification/achievements/');
  return res.data;
}

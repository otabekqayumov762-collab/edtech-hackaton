import { api } from './index';

export interface DailyPlanTask {
  id: string;
  type: 'lesson' | 'test' | 'challenge';
  title: string;
  subject?: string;
  to: string;
  minutes: number;
  icon: string;
}

export interface DailyPlan {
  tasks: DailyPlanTask[];
  minutes: number;
  focus_subject?: string;
}

export async function dailyPlan(): Promise<DailyPlan> {
  const res = await api.get<DailyPlan>('/core/daily-plan/');
  return res.data;
}

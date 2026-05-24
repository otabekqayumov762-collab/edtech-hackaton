import { api } from './index';

export interface Lesson {
  id: number | string;
  subject: string | number;
  title: string;
  duration: number;
  level: string;
  summary: string;
  content: string[];
  xp: number;
  completed?: boolean;
}

export interface LessonCompleteResponse {
  ok: boolean;
  xp_earned: number;
  total_xp?: number;
  lesson_id: number | string;
}

export interface LessonListParams {
  subject?: string | number;
  level?: string;
  page?: number;
  page_size?: number;
}

export async function list(params?: LessonListParams): Promise<Lesson[]> {
  const res = await api.get<Lesson[]>('/lessons/', { params });
  return res.data;
}

export async function retrieve(id: string | number): Promise<Lesson> {
  const res = await api.get<Lesson>(`/lessons/${id}/`);
  return res.data;
}

export async function complete(
  id: string | number,
): Promise<LessonCompleteResponse> {
  // Backend: POST /lessons/complete/ body { lesson_id }
  const res = await api.post<LessonCompleteResponse>(`/lessons/complete/`, {
    lesson_id: id,
  });
  return res.data;
}

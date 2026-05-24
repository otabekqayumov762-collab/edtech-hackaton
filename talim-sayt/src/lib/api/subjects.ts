import { api } from './index';

export interface Subject {
  id: number | string;
  slug: string;
  name: string;
  short?: string;
  icon?: string;
  color?: string;
  topics_count?: number;
  tests_count?: number;
}

export async function list(): Promise<Subject[]> {
  const res = await api.get<Subject[]>('/subjects/');
  return res.data;
}

export async function retrieve(slugOrId: string | number): Promise<Subject> {
  const res = await api.get<Subject>(`/subjects/${slugOrId}/`);
  return res.data;
}

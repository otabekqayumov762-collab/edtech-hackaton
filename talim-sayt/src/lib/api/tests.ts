import { api } from './index';

export interface Question {
  id: number | string;
  text: string;
  options: string[];
  order?: number;
  // Note: backend hides `correct` until POST /tests/answer/; kept optional.
  correct?: number;
  explanation?: string;
}

export interface Test {
  id: number | string;
  subject: string | number;
  title: string;
  difficulty?: string;
  difficulty_key?: string;
  duration_min?: number;
  xp?: number;
  question_count?: number;
  questions: Question[];
}

export interface TestListParams {
  subject?: string | number;
  difficulty?: string;
  page?: number;
  page_size?: number;
}

export interface AnswerPayload {
  question_id: number | string;
  picked_index: number;
}

export interface AnswerResponse {
  is_correct: boolean;
  lives: number;
  life_gained?: boolean;
}

export interface FinishPayload {
  test_id: string | number;
  wrong_indices: number[];
}

export interface TestResult {
  id: number | string;
  test_id: number | string;
  subject: string | number;
  title: string;
  total: number;
  correct: number;
  xp_earned: number;
  date: string;
}

export async function list(params?: TestListParams): Promise<Test[]> {
  const res = await api.get<Test[]>('/tests/', { params });
  return res.data;
}

export async function retrieve(id: string | number): Promise<Test> {
  const res = await api.get<Test>(`/tests/${id}/`);
  return res.data;
}

export async function answer(payload: AnswerPayload): Promise<AnswerResponse> {
  // Backend: POST /tests/answer/ body { question_id, picked_index }
  const res = await api.post<AnswerResponse>(`/tests/answer/`, payload);
  return res.data;
}

export async function finish(payload: FinishPayload): Promise<TestResult> {
  // Backend: POST /tests/finish/ body { test_id, wrong_indices }
  const res = await api.post<TestResult>(`/tests/finish/`, payload);
  return res.data;
}

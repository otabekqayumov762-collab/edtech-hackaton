import { api } from './index';

export interface DuelQuestion {
  id: string | number;
  text: string;
  type: 'choice' | 'fill';
  options?: string[];
  /* answer hidden from client until finish */
}

export interface DuelMatch {
  id: string;
  opponent_id: string;
  subject: string;
  grade: number;
  questions: DuelQuestion[];
  duration_sec: number;
}

export interface CreateDuelPayload {
  opponent_id: string;
  subject: string;
  grade: number;
}

export interface DuelAnswerPayload {
  match_id: string;
  question_id: string | number;
  answer: string;
}

export interface DuelFinishPayload {
  match_id: string;
  my_score: number;
}

export interface DuelFinishResponse {
  won: boolean;
  xp: number;
  coins: number;
  rating_change: number;
  rating: number;
}

export async function create(payload: CreateDuelPayload): Promise<DuelMatch> {
  const res = await api.post<DuelMatch>('/duels/', payload);
  return res.data;
}

export async function finish(
  payload: DuelFinishPayload,
): Promise<DuelFinishResponse> {
  const res = await api.post<DuelFinishResponse>('/duels/finish/', payload);
  return res.data;
}

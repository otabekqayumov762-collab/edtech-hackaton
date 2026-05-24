import { api } from './index';

export interface FlashCard {
  id: number | string;
  topic_id: number | string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashTopic {
  id: number | string;
  subject: string | number;
  title: string;
  desc: string;
  cards: FlashCard[];
}

export interface FlashTopicListParams {
  subject?: string | number;
  page?: number;
  page_size?: number;
}

export interface FlashFinishPayload {
  topic_id: number | string;
  known_card_ids: (number | string)[];
  unknown_card_ids: (number | string)[];
}

export interface FlashFinishResponse {
  xp_earned: number;
  known: number;
  unknown: number;
  total: number;
}

export async function list(
  params?: FlashTopicListParams,
): Promise<FlashTopic[]> {
  const res = await api.get<FlashTopic[]>('/flashcards/', { params });
  return res.data;
}

export async function retrieve(id: string | number): Promise<FlashTopic> {
  const res = await api.get<FlashTopic>(`/flashcards/${id}/`);
  return res.data;
}

export async function finish(
  payload: FlashFinishPayload,
): Promise<FlashFinishResponse> {
  // Backend: POST /flashcards/finish/ body { topic_id, known_card_ids, unknown_card_ids }
  const res = await api.post<FlashFinishResponse>(`/flashcards/finish/`, payload);
  return res.data;
}

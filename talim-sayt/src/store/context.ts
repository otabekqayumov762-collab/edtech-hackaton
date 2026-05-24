import { createContext } from 'react';
import type { SubjectId, Test, User } from '../lib/types';

export interface Toast {
  id: number;
  amount: number;
  reason: string;
  kind?: 'xp' | 'life-loss' | 'life-gain' | 'coin' | 'gem';
}

export interface FinishOutcome {
  xp: number;
  perfect: boolean;
  correct: number;
  total: number;
  wrongIdxs: number[];
}

export interface FxCoinFly {
  ts: number;
  count: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AppCtxValue {
  user: User | null;
  bootstrapping: boolean;
  toasts: Toast[];
  levelUp: number | null;
  noLives: boolean;
  fxCoinFly: FxCoinFly | null;
  triggerCoinFly: (count?: number) => void;
  clearCoinFly: () => void;
  setNoLives: (v: boolean) => void;
  clearLevelUp: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (p: RegisterInput) => Promise<void>;
  logout: () => void;
  patchUser: (p: Partial<User>) => void;
  addXp: (amount: number, reason: string) => void;
  addGems: (n: number, reason: string) => void;
  completeLesson: (lessonId: string, subject: SubjectId, xp: number) => void;
  recordAnswer: (isCorrect: boolean) => { lifeChange: number; livesAfter: number };
  finishTest: (test: Test, correct: number, wrongIdxs: number[]) => FinishOutcome;
  refillLives: () => void;
}

export const AppCtx = createContext<AppCtxValue | null>(null);

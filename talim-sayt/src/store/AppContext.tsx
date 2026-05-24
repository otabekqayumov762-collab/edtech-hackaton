import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SubjectId, Test, User } from '../lib/types';
import { loadUser, saveUser } from '../lib/storage';
import {
  levelFromXp,
  todayISO,
  isYesterday,
  XP,
  xpToCoins,
  GEM_PERFECT_BONUS,
  GEM_TEST_REWARD,
} from '../lib/gamification';
import { mapBackendUser } from '../lib/userAdapter';
import * as authApi from '../lib/api/auth';
import { clearTokens } from '../lib/api';
import {
  AppCtx,
  type AppCtxValue,
  type RegisterInput,
  type Toast,
  type FinishOutcome,
  type FxCoinFly,
} from './context';

const LIVES_MAX_DEFAULT = 10;

function ensureLives(u: User): User {
  const today = todayISO();
  let next = u;
  if (next.livesMax == null) next = { ...next, livesMax: LIVES_MAX_DEFAULT };
  if (next.lives == null) next = { ...next, lives: next.livesMax };
  if (next.consecutiveCorrect == null) next = { ...next, consecutiveCorrect: 0 };
  if (next.gems == null) next = { ...next, gems: 0 };
  if (next.livesResetISO !== today) {
    next = { ...next, lives: next.livesMax, livesResetISO: today };
  }
  return next;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const u = loadUser();
    return u ? ensureLives(u) : null;
  });
  const [bootstrapping, setBootstrapping] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('mf_access'));
    } catch {
      return false;
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [noLives, setNoLives] = useState<boolean>(false);
  const [fxCoinFly, setFxCoinFly] = useState<FxCoinFly | null>(null);

  const triggerCoinFly = useCallback((count: number = 8) => {
    setFxCoinFly({ ts: Date.now(), count });
  }, []);
  const clearCoinFly = useCallback(() => setFxCoinFly(null), []);

  useEffect(() => {
    saveUser(user);
  }, [user]);

  useEffect(() => {
    if (!bootstrapping) return;
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser((prev) => ensureLives(mapBackendUser(u, prev)));
      })
      .catch(() => {
        if (cancelled) return;
        clearTokens();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bootstrapping]);

  const pushToast = useCallback(
    (amount: number, reason: string, kind: Toast['kind'] = 'xp') => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, amount, reason, kind }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    },
    [],
  );

  const applyXp = useCallback((u: User, amount: number): User => {
    if (amount <= 0) return u;
    const before = levelFromXp(u.xp);
    const after = levelFromXp(u.xp + amount);
    if (after > before) {
      setTimeout(() => setLevelUp(after), 450);
      try {
        window.dispatchEvent(
          new CustomEvent('mf:notif', { detail: { type: 'reward' } }),
        );
      } catch {
        /* ignore */
      }
    } else if (amount >= 30 && Math.random() < 0.2) {
      try {
        window.dispatchEvent(
          new CustomEvent('mf:notif', { detail: { type: 'motivation' } }),
        );
      } catch {
        /* ignore */
      }
    }
    const coinsEarned = xpToCoins(amount);
    return {
      ...u,
      xp: u.xp + amount,
      coins: (u.coins || 0) + coinsEarned,
    };
  }, []);

  const touchStreak = useCallback((u: User): User => {
    const today = todayISO();
    if (u.lastActiveISO === today) return u;
    let streak = u.streak;
    if (!u.lastActiveISO) streak = 1;
    else if (isYesterday(u.lastActiveISO)) streak += 1;
    else streak = 1;
    return { ...u, streak, lastActiveISO: today };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email.trim(), password);
    setUser((prev) => ensureLives(mapBackendUser(res.user, prev)));
  }, []);

  const register = useCallback(async (p: RegisterInput) => {
    const res = await authApi.register({
      name: p.name.trim(),
      email: p.email.trim(),
      password: p.password,
    });
    setUser((prev) => ensureLives(mapBackendUser(res.user, prev)));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const patchUser = useCallback(
    (p: Partial<User>) => setUser((u) => (u ? { ...u, ...p } : u)),
    [],
  );

  const addXp = useCallback(
    (amount: number, reason: string) => {
      setUser((u) => (u ? touchStreak(applyXp(u, amount)) : u));
      pushToast(amount, reason, 'xp');
      const c = xpToCoins(amount);
      if (c > 0) pushToast(c, 'Tanga to‘plandi', 'coin');
    },
    [applyXp, touchStreak, pushToast],
  );

  const addGems = useCallback(
    (n: number, reason: string) => {
      if (!n || n <= 0) return;
      setUser((u) => (u ? { ...u, gems: (u.gems || 0) + n } : u));
      pushToast(n, reason, 'gem');
    },
    [pushToast],
  );

  const completeLesson = useCallback(
    (lessonId: string, subject: SubjectId, xp: number) => {
      setUser((u) => {
        if (!u) return u;
        if (u.completedLessons.includes(lessonId)) return u;
        let nu = touchStreak(applyXp(ensureLives(u), xp));
        nu = {
          ...nu,
          completedLessons: [...nu.completedLessons, lessonId],
          subjectProgress: {
            ...nu.subjectProgress,
            [subject]: Math.min(100, nu.subjectProgress[subject] + 6),
          },
          dailyDone: Math.min(nu.dailyGoal, nu.dailyDone + 1),
        };
        return nu;
      });
      pushToast(xp, 'Dars yakunlandi', 'xp');
      const c = xpToCoins(xp);
      if (c > 0) pushToast(c, 'Tanga to‘plandi', 'coin');
    },
    [applyXp, touchStreak, pushToast],
  );

  const recordAnswer = useCallback(
    (isCorrect: boolean) => {
      let result = { lifeChange: 0, livesAfter: 0 };
      setUser((u) => {
        if (!u) return u;
        let nu = ensureLives(u);
        if (isCorrect) {
          const cc = nu.consecutiveCorrect + 1;
          if (cc >= 5 && nu.lives < nu.livesMax) {
            nu = { ...nu, consecutiveCorrect: 0, lives: nu.lives + 1 };
            result = { lifeChange: 1, livesAfter: nu.lives };
            pushToast(1, '5 ketma-ket to‘g‘ri — +1 jon', 'life-gain');
          } else {
            nu = { ...nu, consecutiveCorrect: cc };
            result = { lifeChange: 0, livesAfter: nu.lives };
          }
        } else {
          const newLives = Math.max(0, nu.lives - 1);
          nu = { ...nu, lives: newLives, consecutiveCorrect: 0 };
          result = { lifeChange: -1, livesAfter: newLives };
          pushToast(-1, 'Xato — jon kamaydi', 'life-loss');
          if (newLives === 0) setTimeout(() => setNoLives(true), 250);
        }
        return nu;
      });
      return result;
    },
    [pushToast],
  );

  const finishTest = useCallback(
    (test: Test, correct: number, wrongIdxs: number[]): FinishOutcome => {
      const total = test.questions.length;
      const perfect = correct === total && wrongIdxs.length === 0;
      const earned =
        correct * XP.testPerCorrect +
        (correct / total >= 0.6 ? XP.testPass : 0) +
        (perfect ? XP.perfectBonus : 0);
      const ratio = total > 0 ? correct / total : 0;
      const gemsEarned = perfect
        ? GEM_PERFECT_BONUS
        : ratio >= 0.6
          ? GEM_TEST_REWARD
          : 0;
      setUser((u) => {
        if (!u) return u;
        let nu = touchStreak(applyXp(ensureLives(u), earned));
        const delta = Math.round((correct / total) * 10);
        nu = {
          ...nu,
          gems: (nu.gems || 0) + gemsEarned,
          dailyDone: Math.min(nu.dailyGoal, nu.dailyDone + 1),
          subjectProgress: {
            ...nu.subjectProgress,
            [test.subject]: Math.min(
              100,
              nu.subjectProgress[test.subject] + delta,
            ),
          },
          results: [
            {
              id: 'r' + Date.now(),
              testId: test.id,
              subject: test.subject,
              title: test.title,
              total,
              correct,
              xp: earned,
              dateISO: new Date().toISOString(),
            },
            ...nu.results,
          ].slice(0, 50),
        };
        return nu;
      });
      pushToast(earned, perfect ? 'Mukammal!' : 'Test yakunlandi', 'xp');
      const c = xpToCoins(earned);
      if (c > 0) pushToast(c, 'Tanga to‘plandi', 'coin');
      if (gemsEarned > 0) {
        pushToast(
          gemsEarned,
          perfect ? 'Mukammal natija — +1 olmos' : '+1 olmos',
          'gem',
        );
      }
      if (perfect) {
        triggerCoinFly(8);
      }
      return { xp: earned, perfect, correct, total, wrongIdxs };
    },
    [applyXp, touchStreak, pushToast, triggerCoinFly],
  );

  const refillLives = useCallback(() => {
    setUser((u) => (u ? { ...ensureLives(u), lives: u.livesMax ?? LIVES_MAX_DEFAULT } : u));
    setNoLives(false);
  }, []);

  const value = useMemo<AppCtxValue>(
    () => ({
      user,
      bootstrapping,
      toasts,
      levelUp,
      noLives,
      fxCoinFly,
      triggerCoinFly,
      clearCoinFly,
      setNoLives,
      clearLevelUp: () => setLevelUp(null),
      login,
      register,
      logout,
      patchUser,
      addXp,
      addGems,
      completeLesson,
      recordAnswer,
      finishTest,
      refillLives,
    }),
    [
      user,
      bootstrapping,
      toasts,
      levelUp,
      noLives,
      fxCoinFly,
      triggerCoinFly,
      clearCoinFly,
      login,
      register,
      logout,
      patchUser,
      addXp,
      addGems,
      completeLesson,
      recordAnswer,
      finishTest,
      refillLives,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

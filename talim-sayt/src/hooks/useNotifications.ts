import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildDemoNotifs,
  makeNotif,
  type Notif,
  type NotifType,
} from '../lib/notifications';
import { useApp } from '../store/useApp';

const STORAGE_KEY = 'mf_notifs_v1';
const LAST_DAILY_KEY = 'mf_notifs_last_daily_v1';
const LAST_STREAK_KEY = 'mf_notifs_last_streak_v1';
const LAST_ACTIVE_KEY = 'mf_notifs_last_active_v1';

// Backend endpoint — bo'sh emas, lekin hozircha mock fallback ishlatamiz.
// Tayyor bo'lganda `fetchFromApi` ichi aktiv qilinadi.
const API_URL = '/api/v1/notifications/user';

/* ---------------------------- storage ---------------------------- */
function loadFromStorage(): Notif[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Notif[];
  } catch {
    return null;
  }
}

function saveToStorage(list: Notif[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/* --------------------------- API hook ---------------------------- */
// Future: backend tayyor bo'lganda shu funksiyani to'ldiramiz.
// Hozircha try/catch'da fail bo'lib mock'ga fallback qiladi.
async function fetchFromApi(): Promise<Notif[] | null> {
  try {
    // Backend hali deploy emas — qisqa abort.
    if (typeof window === 'undefined') return null;
    if (!('VITE_NOTIFS_API_ENABLED' in import.meta.env)) return null;

    const res = await fetch(API_URL, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    return data as Notif[];
  } catch {
    return null;
  }
}

/* ---------------------------- hook ------------------------------- */
export function useNotifications() {
  const { user } = useApp();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const initRef = useRef(false);

  // Initial load (1 marta).
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    (async () => {
      // 1) Backend dan urinish
      const fromApi = await fetchFromApi();
      if (cancelled) return;
      if (fromApi) {
        setNotifs(fromApi);
        saveToStorage(fromApi);
        return;
      }

      // 2) Storage
      const stored = loadFromStorage();
      if (stored && stored.length > 0) {
        setNotifs(stored);
        return;
      }

      // 3) Demo seed (faqat agar user mavjud)
      if (user) {
        const seed = buildDemoNotifs({
          name: user.name,
          streak: user.streak,
          xp: user.xp,
        });
        setNotifs(seed);
        saveToStorage(seed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auto-rules — daily/streak/comeback triggerlari (1 marta tekshiriladi).
  useEffect(() => {
    if (!user) return;

    const next: Notif[] = [];

    try {
      const today = todayKey();

      // a) daily — agar bugungi check yo'q va daily not done.
      const lastDaily = localStorage.getItem(LAST_DAILY_KEY);
      if (lastDaily !== today && user.dailyDone < user.dailyGoal) {
        next.push(makeNotif('daily'));
        localStorage.setItem(LAST_DAILY_KEY, today);
      }

      // b) streak — agar bugun streak yangilangan (lastActiveISO == today)
      //    va biz hali shu streak qiymati uchun notif yubormagan bo'lsak.
      const lastStreak = localStorage.getItem(LAST_STREAK_KEY);
      if (
        user.streak >= 2 &&
        user.lastActiveISO === today &&
        lastStreak !== `${today}:${user.streak}`
      ) {
        next.push(makeNotif('streak'));
        localStorage.setItem(LAST_STREAK_KEY, `${today}:${user.streak}`);
      }

      // c) comeback — agar last_active 1-3 kun oldin bo'lsa.
      const lastActiveStored = localStorage.getItem(LAST_ACTIVE_KEY);
      if (user.lastActiveISO) {
        const last = new Date(user.lastActiveISO).getTime();
        const diffDays = Math.floor(
          (Date.now() - last) / (24 * 60 * 60 * 1000),
        );
        if (
          diffDays >= 1 &&
          diffDays <= 3 &&
          lastActiveStored !== `${today}:cb`
        ) {
          next.push(makeNotif('comeback'));
          localStorage.setItem(LAST_ACTIVE_KEY, `${today}:cb`);
        }
      }
    } catch {
      /* ignore storage errors */
    }

    if (next.length > 0) {
      // setState'ni effect body'dan tashqariga olib chiqamiz
      queueMicrotask(() => {
        setNotifs((prev) => {
          const merged = [...next, ...prev].slice(0, 50);
          saveToStorage(merged);
          return merged;
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // External event listener — boshqa joydan notif push qilish uchun.
  // `window.dispatchEvent(new CustomEvent('mf:notif', { detail: { type } }))`
  useEffect(() => {
    function onPush(e: Event) {
      const ce = e as CustomEvent<{ type?: NotifType }>;
      const t = ce.detail?.type;
      if (!t) return;
      setNotifs((prev) => {
        const merged = [makeNotif(t), ...prev].slice(0, 50);
        saveToStorage(merged);
        return merged;
      });
    }
    window.addEventListener('mf:notif', onPush);
    return () => window.removeEventListener('mf:notif', onPush);
  }, []);

  /* -------------------- public API -------------------- */
  const markRead = useCallback((id: string) => {
    setNotifs((prev) => {
      const merged = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(merged);
      return merged;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => {
      const merged = prev.map((n) => (n.read ? n : { ...n, read: true }));
      saveToStorage(merged);
      return merged;
    });
  }, []);

  const addNotif = useCallback((type: NotifType) => {
    setNotifs((prev) => {
      const merged = [makeNotif(type), ...prev].slice(0, 50);
      saveToStorage(merged);
      return merged;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifs([]);
    saveToStorage([]);
  }, []);

  const unreadCount = notifs.reduce((n, x) => n + (x.read ? 0 : 1), 0);

  return {
    notifs,
    unreadCount,
    markRead,
    markAllRead,
    addNotif,
    clearAll,
  };
}

import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { PageHead, StatTile, Empty } from './_shared';
import { levelFromXp } from '../../lib/gamification';
import * as gamificationApi from '../../lib/api/gamification';

interface ViewItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: number;
  metric: 'xp' | 'streak' | 'tests' | 'lessons' | 'level' | 'perfect';
  unlocked: boolean;
  cur: number;
  pct: number;
}

export function Achievements() {
  const { user } = useApp();
  const [items, setItems] = useState<gamificationApi.Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    gamificationApi
      .achievements()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError('Yutuqlar ro‘yxatini olishda xatolik');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const perfect = user.results.filter((r) => r.correct === r.total).length;
  const metrics: Record<ViewItem['metric'], number> = {
    xp: user.xp,
    streak: user.streak,
    tests: user.results.length,
    lessons: user.completedLessons.length,
    level: levelFromXp(user.xp),
    perfect,
  };

  const list: ViewItem[] = items.map((a) => {
    const cur = metrics[a.metric] ?? a.progress ?? 0;
    const unlocked = a.unlocked ?? cur >= a.requirement;
    return {
      id: String(a.id),
      title: a.title,
      description: a.description,
      icon: a.icon,
      color: a.color ?? '#a997ff',
      requirement: a.requirement,
      metric: a.metric,
      unlocked,
      cur,
      pct: Math.min(100, (cur / a.requirement) * 100),
    };
  });
  const unlockedCount = list.filter((x) => x.unlocked).length;

  return (
    <div>
      <PageHead
        icon="Award"
        title="Yutuqlar"
        desc="Maqsadlarga erishing va medallar to‘plang"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile
          icon="Medal"
          color="#fbbf24"
          value={`${unlockedCount}/${list.length}`}
          label="Ochilgan yutuqlar"
        />
        <StatTile
          icon="Flame"
          color="#f97316"
          value={user.streak}
          label="Joriy seriya"
        />
        <StatTile
          icon="Target"
          color="#22c55e"
          value={perfect}
          label="Mukammal testlar"
        />
      </div>

      {loading && (
        <p className="mt-8 py-6 text-center text-sm text-white/55">
          Yuklanmoqda...
        </p>
      )}

      {!loading && (error || list.length === 0) && (
        <div className="mt-6">
          <Empty
            icon="Award"
            title="Yutuqlar mavjud emas"
            desc={error ?? 'Hozircha yutuqlar ro‘yxati bo‘sh.'}
          />
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <div
              key={a.id}
              className={`relative overflow-hidden rounded-xl border p-6 hover-lift ${
                a.unlocked
                  ? 'border-ink-700 bg-ink-800'
                  : 'border-ink-800 bg-ink-900/60'
              }`}
            >
              {a.unlocked && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-grass/15 px-2.5 py-1 text-xs font-semibold text-grass">
                  <Icon name="Check" size={12} /> Ochildi
                </span>
              )}
              <span
                className="flex h-14 w-14 items-center justify-center rounded-lg"
                style={{
                  background: a.unlocked ? a.color : '#2a2057',
                  color: a.unlocked ? '#fff' : '#5a4b94',
                }}
              >
                <Icon name={a.unlocked ? a.icon : 'Lock'} size={24} />
              </span>
              <h3
                className={`mt-4 font-bold ${
                  a.unlocked ? 'text-white' : 'text-white/45'
                }`}
              >
                {a.title}
              </h3>
              <p className="mt-1 text-sm text-white/45">{a.description}</p>
              {!a.unlocked && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Progress</span>
                    <span>
                      {Math.min(a.cur, a.requirement)} / {a.requirement}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-ink-950">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${a.pct}%`, background: a.color }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

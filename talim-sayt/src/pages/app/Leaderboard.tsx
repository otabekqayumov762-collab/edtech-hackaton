import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { PageHead, Empty } from './_shared';
import { levelFromXp } from '../../lib/gamification';
import * as leaderboardApi from '../../lib/api/leaderboard';
import * as friendsApi from '../../lib/api/friends';

type Source = 'global' | 'friends';
type Scope = 'hafta' | 'umumiy';

interface ViewUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  region: string;
  avatarColor: string;
  isCurrent?: boolean;
}

export function Leaderboard() {
  const { user } = useApp();
  const [scope, setScope] = useState<Scope>('umumiy');
  const [source, setSource] = useState<Source>('global');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ViewUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const promise: Promise<ViewUser[]> = (async () => {
      try {
        if (source === 'friends') {
          const fs = await friendsApi.list();
          return fs.map((f) => ({
            id: String(f.id),
            name: f.name,
            xp: f.xp,
            level: f.level,
            streak: f.streak,
            region: '—',
            avatarColor: f.avatar_color ?? '#a997ff',
          }));
        }
        const raw =
          scope === 'hafta'
            ? await leaderboardApi.weekly()
            : await leaderboardApi.global();
        return raw.map((u) => ({
          id: String(u.id),
          name: u.name,
          xp: u.xp,
          level: u.level,
          streak: u.streak,
          region: u.region ?? '—',
          avatarColor: u.avatar_color ?? '#a997ff',
          isCurrent: u.is_current,
        }));
      } catch {
        return [];
      }
    })();
    promise
      .then((items) => {
        if (!cancelled) setList(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, source]);

  const me: ViewUser = {
    id: 'me',
    name: user?.name ?? 'Siz',
    xp: user?.xp ?? 0,
    level: levelFromXp(user?.xp ?? 0),
    streak: user?.streak ?? 0,
    region: user?.region ?? '-',
    avatarColor: user?.avatarColor ?? '#6d4aff',
    isCurrent: true,
  };
  const hasMeInList = list.some((u) => u.isCurrent);
  const ranked = (hasMeInList ? list : [...list, me]).sort(
    (a, b) => b.xp - a.xp,
  );
  const myRank = ranked.findIndex((u) => u.isCurrent) + 1;
  const podium = ranked.slice(0, 3);

  return (
    <div>
      <PageHead
        icon="Trophy"
        title="Reyting"
        desc="Eng faol o‘quvchilar bilan raqobatlashing"
        action={
          <div className="flex rounded-xl border border-ink-700 bg-ink-800 p-1">
            {(['hafta', 'umumiy'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${
                  scope === s
                    ? 'bg-brand-600 text-white'
                    : 'text-white/50'
                }`}
              >
                {s === 'hafta' ? 'Haftalik' : 'Umumiy'}
              </button>
            ))}
          </div>
        }
      />

      {/* Source tabs */}
      <div className="mb-5 flex gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-1">
        {(['global', 'friends'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              source === s
                ? 'bg-brand-600 text-white'
                : 'text-white/55 hover:text-white'
            }`}
          >
            <Icon name={s === 'global' ? 'Globe' : 'Users'} size={15} />
            {s === 'global' ? 'Global reyting' : "Do'stlarim"}
          </button>
        ))}
      </div>

      {loading && (
        <p className="py-6 text-center text-sm text-white/55">Yuklanmoqda...</p>
      )}

      {!loading && ranked.length <= 1 && (
        <Empty
          icon="Trophy"
          title="Reyting bo‘sh"
          desc="Hozircha reytingda ko‘rsatish uchun ma’lumot yo‘q."
        />
      )}

      {!loading && ranked.length > 1 && (
        <>
          {/* Podium */}
          <div className="mb-6 grid grid-cols-3 items-end gap-3">
            {[1, 0, 2].map((pos) => {
              const u = podium[pos];
              if (!u) return <div key={pos} />;
              const heights = ['h-36', 'h-28', 'h-24'];
              const order = pos === 0 ? 1 : pos === 1 ? 0 : 2;
              const medal = ['#fbbf24', '#cbd5e1', '#f59e0b'][pos];
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: order * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ring-4 ring-ink-800"
                    style={{ background: u.avatarColor }}
                  >
                    {u.name[0]}
                  </span>
                  <p className="mt-2 max-w-[90px] truncate text-center text-sm font-bold text-white">
                    {u.isCurrent ? 'Siz' : u.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gold">{u.xp.toLocaleString()} XP</p>
                  <div
                    className={`mt-2 flex ${heights[pos]} w-full flex-col items-center justify-start rounded-t-2xl border border-ink-700 bg-ink-900 pt-3`}
                  >
                    <Icon name="Medal" size={22} color={medal} />
                    <span className="mt-1 font-display text-2xl font-black text-white/30">
                      {pos + 1}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* List */}
          <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
            {ranked.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center gap-3 border-b border-ink-700 px-4 py-3.5 last:border-0 ${
                  u.isCurrent ? 'bg-brand-600/15' : ''
                }`}
              >
                <span
                  className={`w-7 text-center text-sm font-bold ${
                    i < 3 ? 'text-gold' : 'text-white/40'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: u.avatarColor }}
                >
                  {u.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {u.isCurrent ? `${u.name} (Siz)` : u.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {u.region} · Level {u.level}
                  </p>
                </div>
                <span className="hidden items-center gap-1 text-sm text-fire sm:flex">
                  <Icon name="Flame" size={14} /> {u.streak}
                </span>
                <span className="w-20 text-right text-sm font-bold text-gold">
                  {u.xp.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-ink-700 bg-brand-600/15 px-5 py-4">
            <span className="text-sm text-white/70">
              Sizning o‘rningiz:{' '}
              <b className="text-white">#{myRank || '—'}</b> / {ranked.length}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-gold">
              <Icon name="Zap" size={15} /> {me.xp.toLocaleString()} XP
            </span>
          </div>
        </>
      )}
    </div>
  );
}

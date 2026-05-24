import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';
import { PageHead, Empty } from './_shared';
import * as tournamentsApi from '../../lib/api/tournaments';

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function Card({
  t,
  onOpen,
}: {
  t: tournamentsApi.Tournament;
  onOpen: () => void;
}) {
  const c = useCountdown(t.ends_at);
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{t.title}</h3>
          <p className="mt-1 text-sm text-white/55">{t.desc}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon name={t.icon ?? 'Trophy'} size={22} />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { l: 'kun', v: c.d },
          { l: 'soat', v: c.h },
          { l: 'daq', v: c.m },
          { l: 'son', v: c.s },
        ].map((x) => (
          <div
            key={x.l}
            className="rounded-md border border-ink-700 bg-ink-900 py-2 text-center"
          >
            <div className="font-display text-xl font-bold text-white">
              {String(x.v).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-white/45">{x.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-white/55">
        <span className="flex items-center gap-1.5">
          <Icon name="Users" size={14} /> {t.participants} ishtirokchi
        </span>
        <span className="font-bold text-amber-400">{t.prize}</span>
      </div>
      <Button block className="mt-4" onClick={onOpen} icon="ChevronRight">
        {t.joined ? 'Ko‘rish' : 'Qatnashish'}
      </Button>
    </div>
  );
}

function Detail({
  t,
  onBack,
}: {
  t: tournamentsApi.Tournament;
  onBack: () => void;
}) {
  const { user } = useApp();
  const leaderboard = useMemo(() => {
    const entries = t.entries ?? [];
    const sorted = [...entries].sort((a, b) => b.xp - a.xp).slice(0, 20);
    return sorted.map((u, i) => ({ ...u, rank: u.rank ?? i + 1 }));
  }, [t.entries]);
  const c = useCountdown(t.ends_at);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
      >
        <Icon name="ChevronLeft" size={16} /> Turnirlar ro‘yxati
      </button>

      <div className="rounded-xl border border-ink-700 bg-ink-800 p-7">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.title}</h2>
            <p className="mt-1 text-white/55">{t.desc}</p>
          </div>
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-400">
            {t.prize}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { l: 'kun', v: c.d },
            { l: 'soat', v: c.h },
            { l: 'daqiqa', v: c.m },
            { l: 'soniya', v: c.s },
          ].map((x) => (
            <div
              key={x.l}
              className="rounded-md border border-ink-700 bg-ink-900 py-3 text-center"
            >
              <div className="font-display text-2xl font-bold text-white">
                {String(x.v).padStart(2, '0')}
              </div>
              <div className="text-xs text-white/50">{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
          <h3 className="font-bold text-white">Mukofotlar</h3>
          <div className="mt-3 space-y-2">
            {(t.top_prizes ?? []).map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900 p-3"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold"
                  style={{
                    background:
                      p.rank === 1
                        ? '#FBBF24'
                        : p.rank === 2
                          ? '#CBD5E1'
                          : '#F59E0B',
                    color: '#160e3e',
                  }}
                >
                  {p.rank}
                </span>
                <div className="flex-1 text-sm text-white/85">{p.reward}</div>
                <span className="text-xs font-bold text-amber-400">
                  +{p.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 lg:col-span-2">
          <h3 className="font-bold text-white">Reyting</h3>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">
              Hozircha ishtirokchilar yo‘q.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-md border border-ink-700">
              {leaderboard.map((u) => {
                const me =
                  u.is_current ||
                  (user && u.name.includes(user.name.split(' ')[0] ?? '____'));
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 border-b border-ink-700 px-4 py-2.5 text-sm last:border-0 ${
                      me ? 'bg-brand-600/15' : 'bg-ink-900'
                    }`}
                  >
                    <span
                      className={`w-6 text-center font-bold ${
                        u.rank <= 3 ? 'text-amber-400' : 'text-white/45'
                      }`}
                    >
                      {u.rank}
                    </span>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: u.avatar_color ?? '#a997ff' }}
                    >
                      {u.name[0]}
                    </span>
                    <span className="flex-1 truncate text-white">{u.name}</span>
                    <span className="font-bold text-amber-400">
                      {u.xp.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Tournaments() {
  const [list, setList] = useState<tournamentsApi.Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [opened, setOpened] = useState<tournamentsApi.Tournament | null>(null);
  const [openedLoading, setOpenedLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    tournamentsApi
      .list()
      .then((res) => {
        if (!cancelled) setList(res);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openId) {
      setOpened(null);
      return;
    }
    const existing = list.find((t) => String(t.id) === openId);
    if (existing && existing.entries) {
      setOpened(existing);
      return;
    }
    let cancelled = false;
    setOpenedLoading(true);
    tournamentsApi
      .retrieve(openId)
      .then((t) => {
        if (!cancelled) setOpened(t);
      })
      .catch(() => {
        if (!cancelled && existing) setOpened(existing);
      })
      .finally(() => {
        if (!cancelled) setOpenedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openId, list]);

  if (openId) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {openedLoading || !opened ? (
          <p className="py-20 text-center text-sm text-white/55">
            Yuklanmoqda...
          </p>
        ) : (
          <Detail t={opened} onBack={() => setOpenId(null)} />
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <PageHead
        icon="Trophy"
        title="Turnirlar"
        desc="Haftalik va oylik musobaqalarda qatnashing — mukofotlarga eging"
      />
      {loading ? (
        <p className="py-10 text-center text-sm text-white/55">Yuklanmoqda...</p>
      ) : list.length === 0 ? (
        <Empty
          icon="Trophy"
          title="Turnirlar yo‘q"
          desc="Hozircha faol turnirlar mavjud emas. Tez orada qayta tekshiring."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <Card
              key={t.id}
              t={t}
              onOpen={() => setOpenId(String(t.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

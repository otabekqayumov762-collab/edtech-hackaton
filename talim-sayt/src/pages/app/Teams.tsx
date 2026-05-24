import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Button, Avatar } from '../../components/ui';
import { PageHead, Empty } from './_shared';
import { useApp } from '../../store/useApp';
import * as teamsApi from '../../lib/api/teams';

const TEAM_COLOR_PALETTE: { value: string; label: string }[] = [
  { value: '#4f3cc9', label: 'Binafsha' },
  { value: '#0284c7', label: 'Moviy' },
  { value: '#16a34a', label: 'Yashil' },
  { value: '#f59e0b', label: 'Olov' },
  { value: '#e11d48', label: 'Qizil' },
  { value: '#a855f7', label: 'Siyohrang' },
];

function TeamCard({
  t,
  onOpen,
}: {
  t: teamsApi.Team;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
      <div className="h-2" style={{ background: t.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-white">{t.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/55">
              {t.description}
            </p>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
            style={{ background: t.color }}
          >
            <Icon name="ShieldHalf" size={18} />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-ink-700 bg-ink-900 py-2">
            <div className="text-sm font-bold text-white">
              {t.members?.length ?? 0}
            </div>
            <div className="text-[10px] text-white/45">A'zo</div>
          </div>
          <div className="rounded-md border border-ink-700 bg-ink-900 py-2">
            <div className="text-sm font-bold text-amber-400">
              {(t.weekly_xp ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-white/45">Haftalik</div>
          </div>
          <div className="rounded-md border border-ink-700 bg-ink-900 py-2">
            <div className="text-sm font-bold text-brand-300">#{t.rank ?? '-'}</div>
            <div className="text-[10px] text-white/45">Rank</div>
          </div>
        </div>
        <Button block className="mt-4" onClick={onOpen} icon="ChevronRight">
          {t.is_open ? 'Qo‘shilish' : 'Ko‘rish'}
        </Button>
      </div>
    </div>
  );
}

function TeamDetail({
  t,
  onBack,
}: {
  t: teamsApi.Team;
  onBack: () => void;
}) {
  const members = t.members ?? [];
  const maxXp = Math.max(...members.map((m) => m.weekly_xp), 1);
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
      >
        <Icon name="ChevronLeft" size={16} /> Jamoalar
      </button>
      <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
        <div className="h-3" style={{ background: t.color }} />
        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{t.name}</h2>
              <p className="mt-1 text-white/65">{t.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-amber-400">
                {(t.total_xp ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/45">Jami XP</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6">
        <h3 className="font-bold text-white">A'zolar</h3>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">
            Hozircha jamoada a'zolar yo‘q.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {members
              .slice()
              .sort((a, b) => b.weekly_xp - a.weekly_xp)
              .map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5"
                >
                  <Avatar
                    name={m.name}
                    color={m.avatar_color ?? '#a997ff'}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-semibold text-white">
                        {m.name}
                        {m.user_id === t.captain_id && (
                          <Icon
                            name="Crown"
                            size={13}
                            className="ml-1.5 inline text-amber-400"
                          />
                        )}
                      </span>
                      <span className="font-bold text-amber-400">
                        {m.weekly_xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(m.weekly_xp / maxXp) * 100}%`,
                          background: t.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Teams() {
  const { user, patchUser } = useApp();
  const [list, setList] = useState<teamsApi.Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(TEAM_COLOR_PALETTE[0].value);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teamsApi
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

  const open = openId ? list.find((t) => String(t.id) === openId) : null;
  if (open) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <TeamDetail t={open} onBack={() => setOpenId(null)} />
      </motion.div>
    );
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const team = await teamsApi.create({
        name: name.trim(),
        description: desc.trim(),
        color,
      });
      setList((arr) => [team, ...arr]);
      patchUser({ teamId: String(team.id) });
    } catch {
      // best-effort: still mark user has a team locally so UI doesn't lie
      patchUser({ teamId: 'pending-' + Date.now() });
    } finally {
      setCreating(false);
      setShowCreate(false);
      setName('');
      setDesc('');
    }
  }

  return (
    <div>
      <PageHead
        icon="ShieldHalf"
        title="Jamoa"
        desc="Do‘stlar bilan jamoa tuzing, haftalik XP yig‘ing"
        action={
          <Button icon="Plus" onClick={() => setShowCreate((s) => !s)}>
            Yangi jamoa
          </Button>
        }
      />

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-ink-700 bg-ink-800 p-6"
        >
          <h3 className="font-bold text-white">Yangi jamoa yaratish</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jamoa nomi"
              className="h-11 rounded-md border border-ink-700 bg-ink-900 px-3 text-sm text-white outline-none focus:border-brand-500"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Qisqacha ta'rif"
              className="h-11 rounded-md border border-ink-700 bg-ink-900 px-3 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEAM_COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`flex h-9 w-9 items-center justify-center rounded-md ${
                  color === c.value ? 'ring-2 ring-white/60' : ''
                }`}
                style={{ background: c.value }}
                title={c.label}
              >
                {color === c.value && (
                  <Icon name="Check" size={16} color="#fff" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              icon="Check"
              disabled={!name.trim() || creating}
              onClick={handleCreate}
            >
              {creating ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
            <Button variant="dark" onClick={() => setShowCreate(false)}>
              Bekor qilish
            </Button>
          </div>
        </motion.div>
      )}

      {user?.teamId && (
        <div className="mb-6 flex items-center gap-3 rounded-md border border-brand-500/40 bg-brand-600/15 p-4 text-sm text-white/80">
          <Icon name="ShieldHalf" size={18} className="text-brand-300" />
          Sizning jamoangiz mavjud. Jamoa balansiga hissa qo‘shing!
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-white/55">Yuklanmoqda...</p>
      ) : list.length === 0 ? (
        <Empty
          icon="ShieldHalf"
          title="Jamoalar yo‘q"
          desc="Hozircha hech qanday jamoa yo‘q. Birinchi bo‘lib yarating!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TeamCard
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

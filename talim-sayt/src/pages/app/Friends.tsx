import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Avatar, Button } from '../../components/ui';
import { PageHead, Empty } from './_shared';
import * as friendsApi from '../../lib/api/friends';

type Tab = 'friends' | 'requests';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hozir';
  if (min < 60) return `${min} daq oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const d = Math.floor(hr / 24);
  return `${d} kun oldin`;
}

function FriendCard({
  f,
  onChallenge,
}: {
  f: friendsApi.Friend;
  onChallenge: () => void;
}) {
  const color = f.avatar_color ?? '#a997ff';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="hover-lift flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4"
    >
      <div className="relative shrink-0">
        <Avatar name={f.name} color={color} size={48} />
        {f.online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-800 bg-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{f.name}</p>
        <p className="truncate text-xs text-white/45">@{f.username}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/55">
          <span className="inline-flex items-center gap-1">
            <Icon name="Zap" size={11} color="#fbbf24" />
            {f.xp.toLocaleString()} XP
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="Crown" size={11} color="#fbbf24" />
            Lvl {f.level}
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Icon name="Flame" size={11} color="#fb923c" />
            {f.streak}
          </span>
        </div>
      </div>
      <Button size="sm" icon="Swords" onClick={onChallenge}>
        Bellashish
      </Button>
    </motion.div>
  );
}

function RequestCard({
  r,
  onAccept,
  onReject,
}: {
  r: friendsApi.PendingRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  const color = r.from.avatar_color ?? '#a997ff';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4"
    >
      <Avatar name={r.from.name} color={color} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{r.from.name}</p>
        <p className="truncate text-xs text-white/45">
          @{r.from.username} · {relTime(r.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" icon="Check" onClick={onAccept}>
          Qabul
        </Button>
        <Button size="sm" variant="dark" icon="X" onClick={onReject}>
          Rad
        </Button>
      </div>
    </motion.div>
  );
}

export function Friends() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [friends, setFriends] = useState<friendsApi.Friend[]>([]);
  const [pending, setPending] = useState<friendsApi.PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<friendsApi.Friend[]>([]);
  const [adding, setAdding] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      friendsApi.list().catch(() => [] as friendsApi.Friend[]),
      friendsApi.pending().catch(() => [] as friendsApi.PendingRequest[]),
    ])
      .then(([f, p]) => {
        if (cancelled) return;
        setFriends(f);
        setPending(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    friendsApi
      .search(debounced)
      .then((list) => {
        if (cancelled) return;
        const friendIds = new Set(friends.map((f) => String(f.id)));
        setSearchResults(list.filter((f) => !friendIds.has(String(f.id))));
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, friends]);

  function challenge(_f: friendsApi.Friend) {
    nav('/app/duel');
  }

  async function acceptRequest(p: friendsApi.PendingRequest) {
    setPending((arr) => arr.filter((x) => x.id !== p.id));
    setFriends((arr) => [...arr, p.from]);
    try {
      await friendsApi.accept(p.id);
    } catch {
      /* best-effort */
    }
  }

  async function rejectRequest(p: friendsApi.PendingRequest) {
    setPending((arr) => arr.filter((x) => x.id !== p.id));
    try {
      await friendsApi.reject(p.id);
    } catch {
      /* best-effort */
    }
  }

  async function addFriend(f: friendsApi.Friend) {
    setAdding((m) => ({ ...m, [f.id]: true }));
    try {
      await friendsApi.add(String(f.id));
      setFriends((arr) => [...arr, f]);
      setQuery('');
    } catch {
      /* best-effort */
    } finally {
      setAdding((m) => ({ ...m, [f.id]: false }));
    }
  }

  return (
    <div>
      <PageHead
        icon="Users"
        title="Do'stlar"
        desc="Sinfdoshlaringizni qo'shing, bellashing va birga o'sing"
      />

      {/* Search */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5">
        <Icon name="Search" size={18} className="text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username orqali qidirish..."
          className="h-9 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-white/40 hover:text-white"
            aria-label="Tozalash"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {/* Search results */}
      <AnimatePresence>
        {debounced.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 rounded-xl border border-ink-700 bg-ink-800/60 p-3"
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/45">
              Qidiruv natijasi
            </p>
            {searchResults.length === 0 ? (
              <p className="px-2 py-3 text-sm text-white/45">
                "{debounced}" — natija topilmadi
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3"
                  >
                    <Avatar
                      name={f.name}
                      color={f.avatar_color ?? '#a997ff'}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {f.name}
                      </p>
                      <p className="truncate text-xs text-white/45">
                        @{f.username}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      icon="UserPlus"
                      disabled={adding[f.id]}
                      onClick={() => addFriend(f)}
                    >
                      {adding[f.id] ? 'Qo‘shilmoqda...' : 'Do‘st qo‘shish'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-5 flex gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-1">
        <button
          onClick={() => setTab('friends')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'friends'
              ? 'bg-brand-600 text-white'
              : 'text-white/55 hover:text-white'
          }`}
        >
          <Icon name="Users" size={15} />
          Do'stlar
          <span className="ml-1 rounded-full bg-black/20 px-1.5 text-[11px]">
            {friends.length}
          </span>
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'requests'
              ? 'bg-brand-600 text-white'
              : 'text-white/55 hover:text-white'
          }`}
        >
          <Icon name="Bell" size={15} />
          So'rovlar
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[11px] text-white">
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="py-10 text-center text-sm text-white/55">
          Yuklanmoqda...
        </p>
      ) : (
        <AnimatePresence mode="wait">
          {tab === 'friends' ? (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {friends.length === 0 ? (
                <Empty
                  icon="Users"
                  title="Hozircha do'st yo'q"
                  desc="Username orqali topib qo'shing — yuqoridagi qidiruv panelidan foydalaning"
                />
              ) : (
                <AnimatePresence initial={false}>
                  {friends.map((f) => (
                    <FriendCard
                      key={f.id}
                      f={f}
                      onChallenge={() => challenge(f)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {pending.length === 0 ? (
                <Empty
                  icon="Bell"
                  title="Yangi so'rov yo'q"
                  desc="Kimdir sizga do'stlik so'rovi yuborganida bu yerda ko'rinadi"
                />
              ) : (
                <AnimatePresence initial={false}>
                  {pending.map((p) => (
                    <RequestCard
                      key={p.id}
                      r={p}
                      onAccept={() => acceptRequest(p)}
                      onReject={() => rejectRequest(p)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

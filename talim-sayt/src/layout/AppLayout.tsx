import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../store/useApp';
import { BrandMark, Logo } from '../components/Brand';
import { Avatar } from '../components/ui';
import { Icon } from '../components/Icon';
import { NotificationBell } from '../components/NotificationBell';
import { levelBounds, rankTitle } from '../lib/gamification';
import { PageTransition } from '../components/motion';
import { StreakFire } from '../components/fx';

const NAV = [
  { to: '/app', icon: 'Home', label: 'Bosh sahifa', end: true },
  { to: '/app/fan', icon: 'GraduationCap', label: 'Fanlar' },
  { to: '/app/testlar', icon: 'ClipboardList', label: 'Testlar' },
  { to: '/app/flash', icon: 'Layers3', label: 'Flash kartalar' },
  { to: '/app/mashqlar', icon: 'Dumbbell', label: 'Mashqlar' },
  { to: '/app/reyting', icon: 'Trophy', label: 'Reyting' },
  { to: '/app/turnir', icon: 'Medal', label: 'Turnirlar' },
  { to: '/app/duel', icon: 'Swords', label: 'Duel arena' },
  { to: '/app/jamoa', icon: 'ShieldHalf', label: 'Jamoa' },
  { to: '/app/dostlar', icon: 'Users', label: "Do'stlar" },
  { to: '/app/statistika', icon: 'BarChart3', label: 'Statistika' },
  { to: '/app/yutuqlar', icon: 'Award', label: 'Yutuqlar' },
  { to: '/app/ai', icon: 'Bot', label: 'AI yordamchi' },
];
const MOBILE = [
  { to: '/app', icon: 'Home', label: 'Asosiy', end: true },
  { to: '/app/fan', icon: 'GraduationCap', label: 'Fanlar' },
  { to: '/app/testlar', icon: 'ClipboardList', label: 'Testlar' },
  { to: '/app/reyting', icon: 'Trophy', label: 'Reyting' },
  { to: '/app/profil', icon: 'User', label: 'Profil' },
];

export function AppLayout() {
  const { user, logout, bootstrapping } = useApp();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.placementLevel) return <Navigate to="/onboarding/vaqt" replace />;
  const lb = levelBounds(user.xp);

  return (
    <div
      className="app-shell theme-light flex min-h-screen bg-ink-950 text-white"
      onCopy={(e) => e.preventDefault()}
    >
      {/* Sidebar (desktop) — fixed, scrolls independently */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex flex-col border-r border-ink-800 bg-ink-900 px-4 py-5 lg:flex">
        <NavLink to="/" className="px-2">
          <BrandMark size={32} light />
        </NavLink>

        <div className="mt-6 rounded-lg border border-ink-700 bg-ink-800 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} imageUrl={user.avatarUrl} size={42} ring />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="text-xs text-white/45">{rankTitle(lb.level)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
            <span>Level {lb.level}</span>
            <span>
              {lb.inLevel}/{lb.span} XP
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${lb.pct}%` }}
            />
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map((n) => (
            <SideLink key={n.to} {...n} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-ink-800 pt-3">
          <SideLink to="/app/tarif" icon="Crown" label="Tariflar" />
          <SideLink to="/app/profil" icon="Settings" label="Profil" />
          <button
            onClick={() => {
              logout();
              nav('/');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-rose-accent/15 hover:text-rose-accent"
          >
            <Icon name="LogOut" size={18} />
            Chiqish
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pt-16 lg:ml-64">
        {/* Topbar — fixed */}
        <header className="fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-ink-800 bg-ink-950/95 px-4 backdrop-blur left-0 lg:left-64 lg:px-7">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={30} />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-white/40">Xush kelibsiz,</p>
            <p className="text-sm font-bold">{user.name}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm font-bold sm:flex">
              <StreakFire streak={user.streak} size="sm" />
              {user.streak.toLocaleString()}
            </div>
            <StatPill icon="Crown" color="#fbbf24" value={lb.level} />
            <StatPill icon="Coins" color="#fbbf24" value={user.coins ?? 0} />
            <StatPill icon="Gem" color="#06b6d4" value={user.gems ?? 0} />
            <StatPill icon="Zap" color="#a997ff" value={user.xp} />
            <NotificationBell />
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)}>
                <Avatar name={user.name} color={user.avatarColor} imageUrl={user.avatarUrl} size={40} ring />
              </button>
              {menu && (
                <div
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-ink-700 bg-ink-800 shadow-2xl"
                  onClick={() => setMenu(false)}
                >
                  <div className="border-b border-ink-700 p-4">
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-white/45">{user.email}</p>
                  </div>
                  <MenuItem to="/app/profil" icon="User" label="Profil" />
                  <MenuItem to="/app/statistika" icon="BarChart3" label="Statistika" />
                  <MenuItem to="/app/tarif" icon="Crown" label="Tarifni yangilash" />
                  <button
                    onClick={() => {
                      logout();
                      nav('/');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-rose-accent hover:bg-ink-700"
                  >
                    <Icon name="LogOut" size={16} />
                    Chiqish
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 lg:px-7 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-ink-800 bg-ink-950/95 px-2 py-2 backdrop-blur lg:hidden">
        {MOBILE.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium ${
                isActive ? 'text-brand-300' : 'text-white/45'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isActive ? 'bg-brand-600 text-white' : ''
                  }`}
                >
                  <Icon name={n.icon} size={18} />
                </span>
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SideLink({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-white/55 hover:bg-ink-800 hover:text-white'
        }`
      }
    >
      <Icon name={icon} size={18} />
      {label}
    </NavLink>
  );
}

function MenuItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/75 hover:bg-ink-700"
    >
      <Icon name={icon} size={16} />
      {label}
    </NavLink>
  );
}

function StatPill({
  icon,
  color,
  value,
}: {
  icon: string;
  color: string;
  value: number;
}) {
  return (
    <div className="hidden items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm font-bold sm:flex">
      <Icon name={icon} size={15} color={color} />
      {value.toLocaleString()}
    </div>
  );
}

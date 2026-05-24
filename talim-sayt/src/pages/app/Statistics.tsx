import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { PageHead, StatTile, Empty } from './_shared';
import { APP_SUBJECTS, appSubjectProgress } from '../../lib/courses';
import { levelBounds } from '../../lib/gamification';
import * as subjectsApi from '../../lib/api/subjects';
import { api } from '../../lib/api';

interface DashboardWeekPoint {
  day: string;
  xp: number;
}
interface DashboardSubjectPct {
  id?: string;
  name?: string;
  short?: string;
  pct: number;
  color?: string;
}
interface DashboardSummary {
  xp?: number;
  level?: number;
  accuracy?: number;
  avg_progress?: number;
  week?: DashboardWeekPoint[];
  weekly_activity?: DashboardWeekPoint[];
  subjects?: DashboardSubjectPct[];
}

const WEEK = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

function preventChartFocus(e: React.MouseEvent) {
  const el = e.target as Element;
  if (el.closest('.recharts-wrapper, .recharts-surface, svg')) {
    e.preventDefault();
  }
}

export function Statistics() {
  const { user } = useApp();
  const [subjects, setSubjects] = useState<subjectsApi.Subject[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    subjectsApi
      .list()
      .then((s) => {
        if (!cancelled) setSubjects(s);
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      });
    api
      .get<DashboardSummary>('/auth/dashboard/')
      .then((res) => {
        if (!cancelled) setDashboard(res.data);
      })
      .catch((err) => {
        console.warn('[Statistics] /auth/dashboard/ failed', err);
        if (!cancelled) setDashboard(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;
  const lb = levelBounds(user.xp);

  const remoteWeek = dashboard?.week ?? dashboard?.weekly_activity;
  const activity =
    remoteWeek && remoteWeek.length > 0
      ? remoteWeek.map((p) => ({ day: p.day, xp: p.xp }))
      : WEEK.map((d, i) => ({
          day: d,
          xp: Math.round(
            (user.xp / 20) * (0.4 + Math.abs(Math.sin(i + user.streak))),
          ),
        }));

  const donut = APP_SUBJECTS.map((s) => ({
    name: s.name,
    value: appSubjectProgress(user.subjectProgress, s.id),
    color: s.color,
  }));

  const bars = APP_SUBJECTS.map((s) => ({
    name: s.short,
    pct: appSubjectProgress(user.subjectProgress, s.id),
    color: s.color,
  }));

  const localAvg = Math.round(
    APP_SUBJECTS.reduce(
      (sum, s) => sum + appSubjectProgress(user.subjectProgress, s.id),
      0,
    ) / APP_SUBJECTS.length,
  );
  const localAccuracy = user.results.length
    ? Math.round(
        (user.results.reduce((a, r) => a + r.correct / r.total, 0) /
          user.results.length) *
          100,
      )
    : 0;
  const avg = dashboard?.avg_progress ?? localAvg;
  const accuracy = dashboard?.accuracy ?? localAccuracy;

  const subjectMeta = (id: string) =>
    subjects.find((s) => String(s.id) === id || s.slug === id);

  return (
    <div>
      <PageHead
        icon="BarChart3"
        title="Statistika"
        desc="Progress va natijalaringizning to‘liq tahlili"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon="Zap"
          color="#a997ff"
          value={dashboard?.xp ?? user.xp}
          label="Jami XP"
        />
        <StatTile
          icon="Crown"
          color="#fbbf24"
          value={dashboard?.level ?? lb.level}
          label="Level"
        />
        <StatTile
          icon="Target"
          color="#22c55e"
          value={`${accuracy}%`}
          label="O‘rtacha aniqlik"
        />
        <StatTile
          icon="TrendingUp"
          color="#38bdf8"
          value={`${avg}%`}
          label="O‘rtacha o‘zlashtirish"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 lg:col-span-2">
          <h3 className="font-bold text-white">Haftalik faollik (XP)</h3>
          <div
            className="recharts-no-focus mt-4 h-64"
            onMouseDown={preventChartFocus}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="xpg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6d4aff" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#6d4aff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#5a4b94"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: '#1d1646',
                    border: '1px solid #2a2057',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#a997ff' }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#6d4aff"
                  strokeWidth={3}
                  fill="url(#xpg)"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
          <h3 className="font-bold text-white">Fanlar ulushi</h3>
          <div
            className="recharts-no-focus relative mt-4 h-52"
            onMouseDown={preventChartFocus}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                  activeShape={false}
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1d1646',
                    border: '1px solid #2a2057',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{avg}%</span>
              <span className="text-xs text-white/45">o‘rtacha</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {donut.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 text-xs text-white/55"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
          <h3 className="font-bold text-white">Fan bo‘yicha o‘zlashtirish</h3>
          <div
            className="recharts-no-focus mt-4 h-56"
            onMouseDown={preventChartFocus}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <XAxis
                  dataKey="name"
                  stroke="#5a4b94"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: '#2a205755' }}
                  contentStyle={{
                    background: '#1d1646',
                    border: '1px solid #2a2057',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="pct" radius={[8, 8, 0, 0]} activeBar={false}>
                  {bars.map((b) => (
                    <Cell key={b.name} fill={b.color} stroke="none" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
          <h3 className="font-bold text-white">Oxirgi natijalar</h3>
          <div className="mt-4 space-y-3">
            {user.results.length === 0 ? (
              <Empty
                icon="ClipboardList"
                title="Hali natija yo‘q"
                desc="Birinchi testni yeching va natijalaringiz shu yerda paydo bo‘ladi."
              />
            ) : (
              user.results.slice(0, 6).map((r) => {
                const s = subjectMeta(String(r.subject));
                const color = s?.color ?? '#a997ff';
                const icon = s?.icon ?? 'BookOpen';
                const name = s?.name ?? r.subject;
                const pct = Math.round((r.correct / r.total) * 100);
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3.5"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${color}26`, color }}
                    >
                      <Icon name={icon} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {r.title}
                      </p>
                      <p className="text-xs text-white/40">
                        {name} · {new Date(r.dateISO).toLocaleDateString('uz')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          pct >= 60 ? 'text-grass' : 'text-rose-accent'
                        }`}
                      >
                        {r.correct}/{r.total}
                      </p>
                      <p className="text-xs text-gold">+{r.xp} XP</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

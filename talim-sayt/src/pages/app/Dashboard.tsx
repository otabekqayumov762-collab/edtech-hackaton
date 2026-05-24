import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';
import { StatTile, Empty } from './_shared';
import { StreakFire } from '../../components/fx';
import { CountUp, Reveal, StaggerParent, StaggerItem } from '../../components/motion';
import {
  APP_SUBJECTS,
  appSubjectProgress,
  coursePathForAppSubject,
} from '../../lib/courses';
import { levelBounds, rankTitle } from '../../lib/gamification';
import { generateDailyPlan, planTaskColor, planTaskLabel } from '../../lib/aiPlan';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Tunchi qoldingmi';
  if (h < 11) return 'Xayrli tong';
  if (h < 16) return 'Xayrli kun';
  if (h < 21) return 'Xayrli oqshom';
  return 'Yaxshi tun';
}

export function Dashboard() {
  const { user } = useApp();
  const nav = useNavigate();
  if (!user) return null;
  const lb = levelBounds(user.xp);
  const goalPct = Math.round((user.dailyDone / user.dailyGoal) * 100);
  const continueSubject =
    APP_SUBJECTS.find((s) => appSubjectProgress(user.subjectProgress, s.id) < 100) ??
    APP_SUBJECTS[0];

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
      >
        {/* Hand-placed signature accent — kichik but characteristic */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 rotate-12 rounded-[42%_58%_55%_45%/55%_42%_58%_45%] bg-brand-600/30 sm:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 top-3 hidden h-3 w-3 rotate-45 bg-gold sm:block"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm text-white/45">
              {greeting()} — {user.streak > 0 ? `${user.streak} kunlik seriya` : 'bugun yangidan boshla'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Salom, {user.name.split(' ')[0]}
            </h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm">
              <Icon name="Crown" size={14} className="text-amber-400" />
              {rankTitle(lb.level)} · Level {lb.level}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              size="lg"
              icon="GraduationCap"
              onClick={() => nav('/app/fan')}
            >
              Boshlash →
            </Button>
            <Button
              size="lg"
              variant="dark"
              icon="Play"
              onClick={() => nav('/app/testlar')}
            >
              Test yechish
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/45">
            <span>Keyingi levelgacha</span>
            <span>
              {lb.inLevel} / {lb.span} XP
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink-900">
            <motion.div
              className="h-full rounded-full bg-brand-500"
              initial={{ width: 0 }}
              animate={{ width: `${lb.pct}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <StaggerParent className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-6">
        <StaggerItem>
          <StatTile
            color="#f97316"
            value={<CountUp to={user.streak} />}
            label="Kunlik seriya"
            iconNode={<StreakFire streak={user.streak} size="lg" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon="Crown" color="#fbbf24" value={<CountUp to={lb.level} />} label="Hozirgi level" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon="Zap" color="#a997ff" value={<CountUp to={user.xp} />} label="Jami XP" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon="Coins" color="#fbbf24" value={<CountUp to={user.coins ?? 0} />} label="Tangalar" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon="Gem" color="#06b6d4" value={<CountUp to={user.gems ?? 0} />} label="Olmoslar" />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon="ClipboardCheck"
            color="#22c55e"
            value={<CountUp to={user.results.length} />}
            label="Yechilgan test"
          />
        </StaggerItem>
      </StaggerParent>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily goal + subjects */}
        <div className="space-y-6 lg:col-span-2">
          <Reveal>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Icon name="Target" size={18} className="text-brand-300" />
                  Bugungi maqsad
                </h3>
                <span className="text-sm font-bold text-brand-300">
                  {goalPct}%
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-ink-950">
                <div
                  className="smooth-bar h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, goalPct)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-white/55">
                {user.dailyDone} / {user.dailyGoal} faoliyat bajarildi —{' '}
                {user.dailyDone >= user.dailyGoal
                  ? 'maqsad bajarildi, ajoyib!'
                  : 'davom eting, oz qoldi!'}
              </p>
            </div>
          </Reveal>

          {(() => {
            const plan = generateDailyPlan(user);
            const focusId = user.weakSubjects?.find((id) =>
              APP_SUBJECTS.some((s) => s.id === id),
            );
            const focus =
              APP_SUBJECTS.find((s) => s.id === focusId) ??
              APP_SUBJECTS.find((s) => s.id === plan[0]?.subject);
            return (
              <Reveal delay={0.15}>
                <div className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-5">
                  <div className="flex items-center justify-between">
                    <Link
                      to="/app/ai"
                      className="flex items-center gap-2 transition-colors hover:text-brand-200"
                    >
                      <Icon name="Bot" size={18} className="text-brand-500" />
                      <h3 className="font-bold text-white">Bugungi shaxsiy reja</h3>
                    </Link>
                    <Link to="/app/ai" className="text-xs text-brand-300 hover:text-brand-200">Rejani yangilash →</Link>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-white/45">
                    <span>{user.dailyMinutes ?? 20} min</span>
                    <span>·</span>
                    <span>{focus?.name ?? 'Aralash'}</span>
                    <span>·</span>
                    <span>{plan.length} vazifa</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.map(task => (
                      <li key={task.id}>
                        <Link to={task.to} className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3 transition-colors hover:border-brand-500">
                          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: planTaskColor(task.type) + '22', color: planTaskColor(task.type) }}>
                            {planTaskLabel(task.type)}
                          </span>
                          <span className="flex-1 text-sm text-white">{task.title}</span>
                          <span className="text-xs text-white/40">{task.minutes} min</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })()}

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Fanlar bo‘yicha progress</h3>
              <Link
                to="/app/fan"
                className="text-sm font-semibold text-brand-300"
              >
                Barchasi
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {APP_SUBJECTS.map((s) => {
                const p = appSubjectProgress(user.subjectProgress, s.id);
                return (
                  <Link
                    key={s.id}
                    to={coursePathForAppSubject(s.id)}
                    className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3 transition-colors hover:border-brand-500"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${s.color}26`, color: s.color }}
                    >
                      <Icon name={s.icon} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-white">
                          {s.name}
                        </span>
                        <span className="text-white/45">{p}%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-ink-950">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${p}%`, background: s.color }}
                        />
                      </div>
                    </div>
                    <Icon
                      name="ChevronRight"
                      size={16}
                      className="text-white/30"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side: daily challenge + continue + actions */}
        <div className="space-y-6">
          <Reveal delay={0.2}>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
                <Icon name="CalendarCheck" size={18} />
              </span>
              <h3 className="mt-4 font-semibold text-white">Kunlik challenge</h3>
              <p className="mt-1 text-sm text-white/55">
                10 ta savol yeching va +60 XP oling.
              </p>
              <Button block className="mt-4" onClick={() => nav('/app/mashqlar')}>
                Boshlash
              </Button>
            </div>
          </Reveal>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
            <h3 className="font-bold text-white">Davom etish</h3>
            <Link
              to={coursePathForAppSubject(continueSubject.id)}
              className="mt-4 block rounded-lg border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-brand-500"
            >
              <p className="text-xs font-semibold text-brand-300">
                {continueSubject.name}
              </p>
              <p className="mt-1 font-bold text-white">
                {appSubjectProgress(user.subjectProgress, continueSubject.id)}% o‘zlashtirildi — davom eting
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-white/45">
                <span className="flex items-center gap-1">
                  <Icon name="GraduationCap" size={13} /> Sinf tanlang
                </span>
                <span className="ml-auto flex items-center gap-1 font-semibold text-brand-300">
                  Boshlash
                  <Icon name="ArrowRight" size={13} />
                </span>
              </div>
            </Link>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Icon name="Clock" size={18} className="text-brand-300" />
                So'nggi faollik
              </h3>
              {user.results.length > 0 && (
                <Link
                  to="/app/statistika"
                  className="text-xs font-semibold text-brand-300 hover:text-brand-200"
                >
                  Hammasi →
                </Link>
              )}
            </div>
            {user.results.length === 0 ? (
              <div className="mt-3">
                <Empty
                  icon="TrendingUp"
                  title="Hozircha faollik yo'q"
                  desc="Birinchi testni yeching yoki darsni boshlang — faollik shu yerda paydo bo'ladi"
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {[...user.results]
                  .sort(
                    (a, b) =>
                      new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
                  )
                  .slice(0, 3)
                  .map((r) => {
                    const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                    const ok = pct >= 70;
                    return (
                      <li key={r.id}>
                        <Link
                          to={`/app/testlar/${r.testId}`}
                          className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-3 transition-colors hover:border-brand-500"
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                              ok ? 'bg-grass/15 text-grass' : 'bg-rose-accent/15 text-rose-accent'
                            }`}
                          >
                            <Icon name={ok ? 'CheckCircle2' : 'XCircle'} size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {r.title}
                            </p>
                            <p className="truncate text-xs text-white/45">
                              {r.correct}/{r.total} · +{r.xp} XP
                            </p>
                          </div>
                          <Icon
                            name="ChevronRight"
                            size={16}
                            className="shrink-0 text-white/30"
                          />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/app/reyting', i: 'Trophy', t: 'Reyting' },
              { to: '/app/yutuqlar', i: 'Award', t: 'Yutuqlar' },
              { to: '/app/statistika', i: 'BarChart3', t: 'Statistika' },
              { to: '/app/ai', i: 'Bot', t: 'AI yordamchi' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 p-4 text-center transition-colors hover:border-brand-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-300">
                  <Icon name={a.i} size={18} />
                </span>
                <span className="text-xs font-semibold text-white">
                  {a.t}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

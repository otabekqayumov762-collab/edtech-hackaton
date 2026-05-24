import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button, Avatar } from '../../components/ui';
import { PageHead, StatTile } from './_shared';
import { levelBounds, rankTitle } from '../../lib/gamification';
import { StreakFire } from '../../components/fx';
import { LivesIndicator } from '../../components/LivesIndicator';
import { CountUp } from '../../components/motion';
import {
  APP_SUBJECTS,
  appSubjectProgress,
  coursePathForAppSubject,
} from '../../lib/courses';

const REGIONS = [
  'Toshkent',
  'Samarqand',
  'Andijon',
  'Farg‘ona',
  'Namangan',
  'Buxoro',
  'Xorazm',
  'Navoiy',
  'Qashqadaryo',
  'Surxondaryo',
  'Jizzax',
  'Sirdaryo',
];
const GRADES = ['9-sinf', '10-sinf', '11-sinf', 'Abituriyent'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#a855f7',
  '#f43f5e',
  '#64748b',
];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const fieldInputCls =
  'h-12 w-full border-0 bg-transparent px-4 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:outline-none focus:ring-0';

function EditSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-4 sm:p-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EditField({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      <div
        className={`overflow-hidden rounded-xl border bg-ink-950/50 ${
          error ? 'border-rose-accent' : 'border-ink-700'
        }`}
      >
        <div className="flex items-center gap-0">
          <span className="flex h-12 w-11 shrink-0 items-center justify-center border-r border-ink-700/80 text-white/35">
            <Icon name={icon} size={17} />
          </span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-accent">
          <Icon name="XCircle" size={13} />
          {error}
        </span>
      )}
    </label>
  );
}

function ProfileAvatar({
  name,
  color,
  imageUrl,
  onPickColor,
  onPickImage,
  onRemoveImage,
}: {
  name: string;
  color: string;
  imageUrl?: string;
  onPickColor: (c: string) => void;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setImgError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setImgError('Faqat JPG, PNG yoki WebP');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setImgError('Rasm 2 MB dan kichik bo‘lishi kerak');
      return;
    }
    onPickImage(file);
  };

  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="relative">
        <div
          className="rounded-full p-1"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
        >
          <Avatar name={name} color={color} imageUrl={imageUrl} size={96} />
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-white shadow-md transition-colors hover:bg-brand-600"
          aria-label="Profil rasmini o‘zgartirish"
        >
          <Icon name="Camera" size={16} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-4 w-full">
        <p className="mb-2 text-center text-xs font-medium text-white/45 sm:text-left">
          Avatar rangi
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPickColor(c)}
              className={`h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-105 ${
                color === c
                  ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-ink-800'
                  : ''
              }`}
              style={{ background: c }}
              aria-label="Avatar rangi"
            />
          ))}
        </div>
        {imageUrl && (
          <button
            type="button"
            onClick={onRemoveImage}
            className="mt-3 cursor-pointer text-xs text-white/45 transition-colors hover:text-rose-300"
          >
            Rasmni olib tashlash
          </button>
        )}
        {imgError && (
          <p className="mt-2 text-xs text-rose-accent">{imgError}</p>
        )}
      </div>
    </div>
  );
}

export function Profile() {
  const { user, patchUser } = useApp();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [region, setRegion] = useState(user?.region ?? REGIONS[0]);
  const [grade, setGrade] = useState(user?.grade ?? GRADES[2]);
  const [goal, setGoal] = useState(user?.dailyGoal ?? 5);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (edit && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(user.email);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegion(user.region);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGrade(GRADES.includes(user.grade) ? user.grade : GRADES[2]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoal(user.dailyGoal);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingImage(user.avatarUrl);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrors({});
    }
  }, [edit, user]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  if (!user) return null;
  const lb = levelBounds(user.xp);
  const displayImage = edit ? pendingImage : user.avatarUrl;
  const goalPct = Math.min(
    100,
    Math.round((user.dailyDone / Math.max(user.dailyGoal, 1)) * 100),
  );

  const applyImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      if (edit) {
        setPendingImage(reader.result);
      } else {
        patchUser({ avatarUrl: reader.result });
        setSaved('Rasm yangilandi');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const next: { name?: string; email?: string } = {};
    if (name.trim().length < 3) {
      next.name = 'Ism kamida 3 ta belgidan iborat bo‘lishi kerak.';
    }
    if (!EMAIL_RE.test(email.trim())) {
      next.email = 'To‘g‘ri email kiriting.';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    patchUser({
      name: name.trim(),
      email: email.trim(),
      region,
      grade,
      dailyGoal: goal,
      avatarUrl: pendingImage,
    });
    setEdit(false);
    setSaved('Saqlandi');
  };

  return (
    <div className="space-y-6">
      <PageHead
        icon="User"
        title="Profil"
        desc="Shaxsiy ma’lumotlar va hisob sozlamalari"
        action={
          <Button
            variant="dark"
            size="sm"
            icon={edit ? 'X' : 'Pencil'}
            onClick={() => setEdit((e) => !e)}
          >
            {edit ? 'Bekor' : 'Tahrirlash'}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Asosiy ustun */}
        <div className="space-y-6 lg:col-span-2">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800"
          >
            <div className="h-24 bg-gradient-to-r from-brand-700/90 to-brand-900/40" />
            <div className="relative px-6 pb-6">
              <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end">
                <ProfileAvatar
                  name={user.name}
                  color={user.avatarColor}
                  imageUrl={displayImage}
                  onPickColor={(c) => {
                    patchUser({ avatarColor: c });
                    setSaved('Rang saqlandi');
                  }}
                  onPickImage={applyImage}
                  onRemoveImage={() => {
                    if (edit) {
                      setPendingImage(undefined);
                    } else {
                      patchUser({ avatarUrl: undefined });
                      setSaved('Rasm olib tashlandi');
                    }
                  }}
                />
                <div className="min-w-0 flex-1 pb-1 sm:pt-4">
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  <p className="mt-0.5 text-sm text-white/50">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                      <Icon name="Crown" size={12} className="mr-1 inline text-amber-400" />
                      {rankTitle(lb.level)}
                    </span>
                    <span className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs font-medium text-white/65">
                      {user.region}
                    </span>
                    <span className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs font-medium text-white/65">
                      {user.grade}
                    </span>
                    <span className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs font-medium text-white/65">
                      {user.plan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-ink-700 bg-ink-900/50 p-4">
                <div className="flex justify-between text-xs text-white/50">
                  <span className="font-semibold text-white/80">
                    Level {lb.level}
                  </span>
                  <span>
                    {lb.inLevel.toLocaleString()} / {lb.span.toLocaleString()} XP
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-950">
                  <motion.div
                    className="h-full rounded-full bg-brand-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${lb.pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistikalar */}
          <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${edit ? 'hidden' : ''}`}>
            <StatTile
              icon="Zap"
              color="#818cf8"
              value={<CountUp to={user.xp} />}
              label="Jami XP"
            />
            <StatTile
              icon="Coins"
              color="#fbbf24"
              value={<CountUp to={user.coins ?? 0} />}
              label="Tangalar"
            />
            <StatTile
              icon="Gem"
              color="#22d3ee"
              value={<CountUp to={user.gems ?? 0} />}
              label="Olmoslar"
            />
            <StatTile
              color="#f97316"
              value={<CountUp to={user.streak} />}
              label="Seriya"
              iconNode={<StreakFire streak={user.streak} size="lg" />}
            />
            <StatTile
              icon="ClipboardCheck"
              color="#4ade80"
              value={<CountUp to={user.results.length} />}
              label="Testlar"
            />
            <StatTile
              icon="BookOpen"
              color="#38bdf8"
              value={<CountUp to={user.completedLessons.length} />}
              label="Darslar"
            />
          </div>

          {/* Tahrirlash / ma'lumotlar */}
          {edit ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-sm"
            >
              <div className="border-b border-ink-700 bg-gradient-to-r from-brand-600/10 via-transparent to-transparent px-6 py-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-600/15 text-brand-400">
                    <Icon name="Pencil" size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Ma’lumotlarni tahrirlash
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      Profil rasmini yuqoridagi kamera tugmasi yoki rang
                      palitrasi orqali o‘zgartiring
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <EditSection title="Shaxsiy ma’lumotlar">
                  <EditField label="Ism familiya" icon="User" error={errors.name}>
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name)
                          setErrors((er) => ({ ...er, name: undefined }));
                      }}
                      className={fieldInputCls}
                      placeholder="Ismingizni kiriting"
                    />
                  </EditField>
                  <EditField label="Email" icon="Mail" error={errors.email}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((er) => ({ ...er, email: undefined }));
                      }}
                      className={fieldInputCls}
                      placeholder="email@misol.uz"
                    />
                  </EditField>
                </EditSection>

                <EditSection title="O‘qish sozlamalari">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <EditField label="Hudud" icon="MapPin">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={`${fieldInputCls} cursor-pointer`}
                      >
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </EditField>
                    <EditField label="Sinf" icon="GraduationCap">
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className={`${fieldInputCls} cursor-pointer`}
                      >
                        {GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </EditField>
                  </div>

                  <div className="rounded-xl border border-ink-700 bg-ink-950/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                          <Icon name="Target" size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Kunlik maqsad
                          </p>
                          <p className="text-xs text-white/45">
                            3–15 ta faoliyat
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold tabular-nums text-brand-500">
                        {goal}
                        <span className="ml-1 text-sm font-medium text-white/40">
                          ta
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      value={goal}
                      onChange={(e) => setGoal(Number(e.target.value))}
                      className="mt-4 w-full cursor-pointer accent-brand-600"
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-medium text-white/35">
                      <span>3</span>
                      <span>9</span>
                      <span>15</span>
                    </div>
                  </div>
                </EditSection>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-ink-700 bg-ink-900/30 px-6 py-4 sm:flex-row sm:justify-end">
                <Button variant="dark" icon="X" onClick={() => setEdit(false)}>
                  Bekor qilish
                </Button>
                <Button icon="Check" onClick={handleSave}>
                  O‘zgarishlarni saqlash
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
              <h3 className="font-bold text-white">Hisob ma’lumotlari</h3>
              <dl className="mt-4 divide-y divide-ink-700">
                {[
                  ['Ism', user.name],
                  ['Email', user.email],
                  ['Hudud', user.region],
                  ['Sinf', user.grade],
                  ['Tarif', user.plan],
                  ['Maqsad', `${user.dailyDone} / ${user.dailyGoal} bugun`],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 py-3 text-sm first:pt-0"
                  >
                    <dt className="text-white/45">{k}</dt>
                    <dd className="text-right font-medium text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Fanlar */}
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Fanlar bo‘yicha progress</h3>
              <Link
                to="/app/fan"
                className="text-sm font-semibold text-brand-300 hover:text-brand-200"
              >
                Barchasi →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {APP_SUBJECTS.map((s) => {
                const p = appSubjectProgress(user.subjectProgress, s.id);
                return (
                  <li key={s.id}>
                    <Link
                      to={coursePathForAppSubject(s.id)}
                      className="group flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/60 p-3 transition-colors hover:border-brand-500/50"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${s.color}22`, color: s.color }}
                      >
                        <Icon name={s.icon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-white">{s.name}</span>
                          <span className="text-white/45">{p}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-950">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${p}%`, background: s.color }}
                          />
                        </div>
                      </div>
                      <Icon
                        name="ChevronRight"
                        size={16}
                        className="text-white/25 group-hover:text-brand-300"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Yon panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
            <h3 className="text-sm font-bold text-white">Bugungi maqsad</h3>
            <p className="mt-3 text-2xl font-bold text-white">
              {user.dailyDone}
              <span className="text-lg font-medium text-white/40">
                /{user.dailyGoal}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-950">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/45">{goalPct}% bajarildi</p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Jonlar</h3>
              <LivesIndicator size="md" showCount />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Mashq va testlar uchun ishlatiladi
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
            <h3 className="text-sm font-bold text-white">Tezkor havolalar</h3>
            <div className="mt-3 space-y-1">
              {[
                { to: '/app/fan', icon: 'GraduationCap', label: 'Fanlar' },
                { to: '/app/statistika', icon: 'BarChart3', label: 'Statistika' },
                { to: '/app/yutuqlar', icon: 'Trophy', label: 'Yutuqlar' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/70 transition-colors hover:bg-ink-900 hover:text-white"
                >
                  <Icon name={link.icon} size={16} className="text-brand-400" />
                  {link.label}
                  <Icon name="ChevronRight" size={14} className="ml-auto opacity-40" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-brand-500/30 bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          <Icon name="CheckCircle2" size={15} className="mr-1.5 inline text-brand-400" />
          {saved}
        </motion.p>
      )}
    </div>
  );
}

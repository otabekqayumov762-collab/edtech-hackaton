import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui';
import { PageHead } from '../_shared';
import { useApp } from '../../../store/useApp';
import { findCourseSubject, isGradeAvailableForSubject } from '../../../lib/courses';

/* ---------- Doimiy parametrlar ---------- */
const TOTAL_SECONDS = 8 * 60; // 8 daqiqalik darsni simulyatsiya qilamiz
const TICK_MS = 100; // har 100ms da progress +1% — ~10 soniyada to'liq
const COMPLETE_AT = 50; // 50% dan keyin "Tugatish" tugmasi ko'rinadi
const REWARD_XP = 10;

/* Vaqtni mm:ss ko'rinishida formatlash */
function fmt(sec: number): string {
  const m = Math.floor(sec / 60).toString();
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function CourseAudio() {
  const { subject, grade } = useParams<{ subject: string; grade: string }>();
  const nav = useNavigate();
  const { addXp } = useApp();
  const s = findCourseSubject(subject);

  // State'lar — hooklarni guard'dan oldin chaqiramiz (React qoidasi)
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [complete, setComplete] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const rewardedRef = useRef(false);

  // Audio simulyatsiyasi
  useEffect(() => {
    if (!playing || complete) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 1);
        if (next >= 100) {
          setPlaying(false);
          setComplete(true);
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, complete]);

  // Tugaganda reward berish (faqat bir marta)
  useEffect(() => {
    if (complete && !rewardedRef.current) {
      rewardedRef.current = true;
      addXp(REWARD_XP, 'Audio dars yakunlandi');
      setShowReward(true);
      const t = window.setTimeout(() => setShowReward(false), 2400);
      return () => window.clearTimeout(t);
    }
  }, [complete, addXp]);

  // SVG circular progress geometriyasi
  const RADIUS = 80;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (progress / 100) * CIRC;

  const currentSec = useMemo(
    () => Math.round((progress / 100) * TOTAL_SECONDS),
    [progress],
  );

  // Validatsiya — yaroqsiz URL bo'lsa fanlar ro'yxatiga qaytamiz
  if (!s || !s.available || !grade || !subject || !isGradeAvailableForSubject(subject, grade)) {
    return <Navigate to="/app/fan" replace />;
  }

  const backUrl = `/app/fan/${subject}/sinf/${grade}`;
  const canComplete = !complete && progress >= COMPLETE_AT;

  function handlePlay() {
    if (complete) return;
    setPlaying((v) => !v);
  }

  function handleSkip(deltaSec: number) {
    if (complete) return;
    setProgress((p) =>
      Math.max(0, Math.min(100, p + (deltaSec / TOTAL_SECONDS) * 100)),
    );
  }

  function handleFinishNow() {
    setPlaying(false);
    setProgress(100);
    setComplete(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => nav(backUrl)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-brand-500 hover:text-white"
      >
        <Icon name="ChevronLeft" size={14} />
        Orqaga
      </button>

      <PageHead
        icon="Headphones"
        title={`Audio dars — ${s.name} ${grade}-sinf`}
        desc="Eshitib chiqing va +10 XP qo'lga kiriting."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-800 p-8 sm:p-10"
      >
        {/* Subject icon + lesson title */}
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `${s.color}26`, color: s.color }}
          >
            <Icon name={s.icon} size={28} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-white sm:text-2xl">
            {s.name} {grade}-sinf — Audio dars
          </h2>
          <p className="mt-1.5 text-sm text-white/55">
            Tinglang. 50% dan keyin tugatishingiz mumkin.
          </p>
        </div>

        {/* Circular progress + vaqt */}
        <div className="mt-8 flex items-center justify-center">
          <div className="relative h-[200px] w-[200px]">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full -rotate-90"
              aria-hidden
            >
              <circle
                cx="100"
                cy="100"
                r={RADIUS}
                stroke="currentColor"
                className="text-ink-700"
                strokeWidth="10"
                fill="none"
              />
              <motion.circle
                cx="100"
                cy="100"
                r={RADIUS}
                stroke="var(--color-brand-500)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-3xl font-black tabular-nums text-white">
                {fmt(currentSec)}
              </div>
              <div className="mt-1 text-xs font-medium tabular-nums text-white/45">
                / {fmt(TOTAL_SECONDS)}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => handleSkip(-15)}
            disabled={complete || progress === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-white transition-all hover:border-brand-500 disabled:opacity-40"
            aria-label="15 soniya orqaga"
          >
            <Icon name="SkipBack" size={20} />
          </button>

          <motion.button
            type="button"
            onClick={handlePlay}
            disabled={complete}
            whileTap={{ scale: 0.94 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_24px_rgba(31,41,55,0.35)] transition-colors hover:bg-brand-700 disabled:opacity-50"
            aria-label={playing ? 'Pauza' : 'Boshlash'}
          >
            <Icon name={playing ? 'Pause' : 'Play'} size={30} />
          </motion.button>

          <button
            type="button"
            onClick={() => handleSkip(15)}
            disabled={complete || progress === 100}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-white transition-all hover:border-brand-500 disabled:opacity-40"
            aria-label="15 soniya oldinga"
          >
            <Icon name="SkipForward" size={20} />
          </button>
        </div>

        {/* Waveform animatsiya */}
        <div className="mt-8 flex h-12 items-center justify-center gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full bg-brand-500"
              style={{ height: 14 }}
              animate={
                playing
                  ? { scaleY: [1, 1.6 + (i % 3) * 0.25, 1] }
                  : { scaleY: 1 }
              }
              transition={{
                duration: 0.8,
                repeat: playing ? Infinity : 0,
                ease: 'easeInOut',
                delay: (i % 6) * 0.08,
              }}
            />
          ))}
        </div>

        {/* Linear progress + label */}
        <div className="mt-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="smooth-bar h-full rounded-full bg-brand-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/45">
            <span>{progress}% tinglandi</span>
            <span className="flex items-center gap-1">
              <Icon name="Zap" size={12} className="text-gold" />
              +{REWARD_XP} XP
            </span>
          </div>
        </div>

        {/* Action footer */}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!complete ? (
            <Button
              variant="gold"
              size="lg"
              icon="Check"
              disabled={!canComplete}
              onClick={handleFinishNow}
            >
              {canComplete
                ? 'Tugatish'
                : `Tugatish (${COMPLETE_AT}% dan keyin)`}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              icon="ArrowRight"
              onClick={() => nav(backUrl)}
            >
              Bo'limga qaytish
            </Button>
          )}
        </div>

        {/* Reward overlay */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.6, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="rounded-2xl border border-ink-700 bg-ink-800 px-7 py-6 text-center shadow-2xl"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-gold">
                  <Icon name="Gift" size={28} />
                </div>
                <div className="mt-3 text-lg font-black text-white">
                  Audio yakunlandi!
                </div>
                <div className="mt-1 flex items-center justify-center gap-3 text-sm font-semibold">
                  <span className="inline-flex items-center gap-1 text-gold">
                    <Icon name="Zap" size={14} /> +{REWARD_XP} XP
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Icon name="Coins" size={14} /> +1 tanga
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

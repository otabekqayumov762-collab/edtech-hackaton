import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../store/useApp';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui';
import { Confetti } from '../../../components/Confetti';
import { findCourseSubject, isGradeAvailableForSubject } from '../../../lib/courses';

/* =================================================================
 * CoursePractice — game-style mashq sahifasi
 * URL: /app/fan/:subject/sinf/:grade/mashq
 * Tarkib: 3 ta Quiz + 1 ta Match + 1 ta Order = 5 savol
 * ================================================================= */

interface QuizQ {
  type: 'quiz';
  q: string;
  options: string[];
  correct: number;
}
interface MatchQ {
  type: 'match';
  q: string;
  pairs: [string, string][]; // [term, definition]
}
interface OrderQ {
  type: 'order';
  q: string;
  words: string[];
  correctOrder: number[];
}
type Q = QuizQ | MatchQ | OrderQ;

const QUESTIONS: Q[] = [
  {
    type: 'quiz',
    q: '15 + 27 = ?',
    options: ['32', '42', '35', '40'],
    correct: 1,
  },
  {
    type: 'quiz',
    q: 'Quyidagilardan qaysi biri sifat?',
    options: ['Yugurmoq', 'Tez', 'Stol', 'Olma'],
    correct: 1,
  },
  {
    type: 'quiz',
    q: 'Sohibqiron — kim?',
    options: ['Saydalixon', 'Amir Temur', 'Bobur', 'Ibn Sino'],
    correct: 1,
  },
  {
    type: 'match',
    q: 'Juftlikni toping',
    pairs: [
      ['Toshkent', 'Poytaxt'],
      ['Amir Temur', 'Sohibqiron'],
      ['7', 'Toq son'],
      ['Suv', 'Modda'],
    ],
  },
  {
    type: 'order',
    q: 'Gapni to‘g‘ri tartibga keltiring',
    words: ['Men', 'har kuni', 'maktabga', 'boraman'],
    correctOrder: [0, 1, 2, 3],
  },
];

const FEEDBACK_OK_MS = 800;
const FEEDBACK_BAD_MS = 1000;
const PAIR_COLORS = ['#475569', '#16a34a', '#f59e0b', '#0ea5e9']; // brand, grass, fire, sky

type Phase = 'play' | 'feedback' | 'done';
type Feedback = 'ok' | 'bad' | null;

/* Render-stabil shuffle (Fisher–Yates) — useState initializer + effect on dep change */
function useShuffled<T>(arr: T[], dep: unknown): { items: T[]; orig: number[] } {
  const shuffle = (src: T[]): { items: T[]; orig: number[] } => {
    const indices = src.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      items: indices.map((i) => src[i]),
      orig: indices,
    };
  };
  const [state, setState] = useState<{ items: T[]; orig: number[] }>(() =>
    shuffle(arr),
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(shuffle(arr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  return state;
}

export function CoursePractice() {
  const { subject, grade } = useParams<{ subject: string; grade: string }>();
  const nav = useNavigate();
  const { user, addXp, recordAnswer, patchUser } = useApp();
  const s = findCourseSubject(subject);

  /* ---- core state ---- */
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [phase, setPhase] = useState<Phase>('play');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [floatChip, setFloatChip] = useState<{ key: number; text: string } | null>(
    null,
  );
  const [rewarded, setRewarded] = useState<{
    tier: 'perfect' | 'good' | 'low';
    xp: number;
    coins: number;
  } | null>(null);

  /* ---- per-type state ---- */
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  // pairs: leftIdx -> rightShuffledIdx
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  // order
  const [placed, setPlaced] = useState<number[]>([]);

  const lockRef = useRef(false);
  const finalizedRef = useRef(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[idx];

  /* For match: shuffle right column (stabil per question) */
  const rightShuffled = useShuffled(
    q.type === 'match' ? q.pairs.map((p) => p[1]) : [],
    idx,
  );

  /* ---- reset per-question UI ---- */
  const resetForNext = useCallback(() => {
    setPickedIdx(null);
    setPairs({});
    setActiveLeft(null);
    setPlaced([]);
    setFeedback(null);
  }, []);

  /* ---- finalize reward ---- */
  const finalize = useCallback(
    (correctCount: number, heartsLeft: number) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      let tier: 'perfect' | 'good' | 'low';
      let xp: number;
      let coins: number;
      if (correctCount === total && heartsLeft > 0) {
        tier = 'perfect';
        xp = 30;
        coins = 2;
      } else if (correctCount >= 3 && heartsLeft > 0) {
        tier = 'good';
        xp = 20;
        coins = 1;
      } else {
        tier = 'low';
        xp = 5;
        coins = 0;
      }
      addXp(
        xp,
        tier === 'perfect'
          ? 'Mukammal mashq!'
          : tier === 'good'
            ? 'Mashq yakunlandi'
            : 'Mashq tugadi',
      );
      if (coins > 0 && user) {
        patchUser({ coins: (user.coins ?? 0) + coins });
      }
      setRewarded({ tier, xp, coins });
    },
    [total, addXp, patchUser, user],
  );

  /* ---- advance / end ---- */
  const advance = useCallback(
    (correctNow: boolean) => {
      const newCorrect = correctNow ? correct + 1 : correct;
      const newHearts = correctNow ? hearts : Math.max(0, hearts - 1);
      const isLast = idx + 1 >= total;
      if (newHearts <= 0 || isLast) {
        setPhase('done');
        finalize(newCorrect, newHearts);
      } else {
        setIdx((i) => i + 1);
        resetForNext();
        setPhase('play');
      }
      lockRef.current = false;
    },
    [correct, hearts, idx, total, finalize, resetForNext],
  );

  /* ---- check answer (universal) ---- */
  const check = useCallback(() => {
    if (lockRef.current || phase !== 'play') return;

    let ok = false;
    if (q.type === 'quiz') {
      if (pickedIdx === null) return;
      ok = pickedIdx === q.correct;
    } else if (q.type === 'match') {
      if (Object.keys(pairs).length !== q.pairs.length) return;
      // pair[i] (left i) -> shuffled right idx -> original right idx === i
      ok = q.pairs.every((_, i) => {
        const rShuf = pairs[i];
        if (rShuf === undefined) return false;
        return rightShuffled.orig[rShuf] === i;
      });
    } else if (q.type === 'order') {
      if (placed.length !== q.words.length) return;
      ok = placed.every((w, i) => w === q.correctOrder[i]);
    }

    lockRef.current = true;
    setPhase('feedback');
    setFeedback(ok ? 'ok' : 'bad');
    recordAnswer(ok);

    if (ok) {
      setCorrect((c) => c + 1);
      const chipKey = Date.now();
      setFloatChip({ key: chipKey, text: '+10 XP' });
      setTimeout(() => {
        setFloatChip((cur) => (cur?.key === chipKey ? null : cur));
      }, 700);
      setTimeout(() => advance(true), FEEDBACK_OK_MS);
    } else {
      setWrong((w) => w + 1);
      setHearts((h) => Math.max(0, h - 1));
      setTimeout(() => advance(false), FEEDBACK_BAD_MS);
    }
  }, [phase, q, pickedIdx, pairs, rightShuffled, placed, recordAnswer, advance]);

  /* ---- guard params ---- */
  if (!s || !s.available || !grade || !subject || !isGradeAvailableForSubject(subject, grade)) {
    return <Navigate to="/app/fan" replace />;
  }

  /* ---- result ---- */
  if (phase === 'done' && rewarded) {
    return (
      <ResultScreen
        tier={rewarded.tier}
        xp={rewarded.xp}
        coins={rewarded.coins}
        correct={correct}
        wrong={wrong}
        heartsLeft={hearts}
        total={total}
        subjectName={s.name}
        grade={grade}
        onRetry={() => {
          finalizedRef.current = false;
          lockRef.current = false;
          setIdx(0);
          setCorrect(0);
          setWrong(0);
          setHearts(3);
          setPhase('play');
          setRewarded(null);
          resetForNext();
        }}
        onOther={() => nav('/app/fan')}
      />
    );
  }

  /* ---- derived ---- */
  const progressPct = ((idx + (phase === 'done' ? 1 : 0)) / total) * 100;

  /* ---- enable check button? ---- */
  let canCheck = false;
  if (phase === 'play') {
    if (q.type === 'quiz') canCheck = pickedIdx !== null;
    else if (q.type === 'match')
      canCheck = Object.keys(pairs).length === q.pairs.length;
    else if (q.type === 'order') canCheck = placed.length === q.words.length;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Topbar */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => nav(`/app/fan/${subject}/sinf/${grade}`)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
        >
          <Icon name="ChevronLeft" size={16} /> Orqaga
        </button>

        <div className="flex items-center gap-3">
          {/* Hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={`${i}-${hearts}`}
                initial={i === hearts ? { scale: 1.4 } : false}
                animate={i === hearts ? { scale: 1 } : {}}
                transition={{ duration: 0.4, type: 'spring' }}
                className="inline-flex"
              >
                <Icon
                  name="Heart"
                  size={18}
                  color={i < hearts ? '#e11d48' : '#475569'}
                />
              </motion.span>
            ))}
          </div>

          {/* Progress count */}
          <div className="flex items-center gap-1 rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 text-sm font-mono font-bold text-white/80">
            <Icon name="Target" size={13} />
            <span>
              {Math.min(idx + 1, total)}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Smooth progress bar */}
      <div className="mb-1 flex items-center justify-between text-xs text-white/55">
        <span>
          Savol {idx + 1} / {total}
        </span>
        <span>{Math.round(progressPct)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-800">
        <motion.div
          className="h-full rounded-full bg-brand-600"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="relative mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
        >
          {/* floating +XP chip */}
          <AnimatePresence>
            {floatChip && (
              <motion.span
                key={floatChip.key}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -50 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="pointer-events-none absolute right-6 top-6 rounded-md bg-grass/20 px-2.5 py-1 text-xs font-bold text-grass"
              >
                {floatChip.text}
              </motion.span>
            )}
          </AnimatePresence>

          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ background: `${s.color}22`, color: s.color }}
          >
            <Icon name="Gamepad2" size={12} />
            Mashq · {s.name}
          </span>

          <h2 className="mt-4 text-xl font-bold leading-snug text-white sm:text-2xl">
            {q.q}
          </h2>

          {/* Body — based on q.type */}
          <div className="mt-6">
            {q.type === 'quiz' && (
              <QuizBody
                q={q}
                phase={phase}
                pickedIdx={pickedIdx}
                setPickedIdx={setPickedIdx}
              />
            )}
            {q.type === 'match' && (
              <MatchBody
                q={q}
                phase={phase}
                pairs={pairs}
                setPairs={setPairs}
                activeLeft={activeLeft}
                setActiveLeft={setActiveLeft}
                rightItems={rightShuffled.items}
                rightOrig={rightShuffled.orig}
              />
            )}
            {q.type === 'order' && (
              <OrderBody
                q={q}
                phase={phase}
                placed={placed}
                setPlaced={setPlaced}
              />
            )}
          </div>

          {/* Check button */}
          <div className="mt-6 flex justify-end">
            <Button
              icon={feedback === 'ok' ? 'CheckCircle2' : 'ArrowRight'}
              onClick={check}
              disabled={!canCheck}
            >
              {phase === 'feedback'
                ? feedback === 'ok'
                  ? 'To‘g‘ri!'
                  : 'Xato'
                : 'Tekshirish'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/45">
          {s.name} · {grade}-sinf
        </span>
        <span className="font-semibold text-white/45">
          To‘g‘ri: {correct} · Xato: {wrong}
        </span>
      </div>

      {/* Red flash on wrong */}
      <AnimatePresence>
        {phase === 'feedback' && feedback === 'bad' && (
          <motion.div
            key="red-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-[90] bg-rose-accent"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================================================================
 * Quiz body
 * ================================================================= */
function QuizBody({
  q,
  phase,
  pickedIdx,
  setPickedIdx,
}: {
  q: QuizQ;
  phase: Phase;
  pickedIdx: number | null;
  setPickedIdx: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      {q.options.map((o, i) => {
        const active = pickedIdx === i;
        const showCorrect = phase === 'feedback' && i === q.correct;
        const showWrong =
          phase === 'feedback' && active && i !== q.correct;
        let cls =
          'border-ink-700 bg-ink-900 text-white/70 hover:border-brand-500/60';
        let anim = '';
        if (active && phase === 'play') {
          cls = 'border-brand-500 bg-brand-500/10 text-white';
        }
        if (showCorrect) {
          cls = 'border-grass bg-grass/10 text-white glow-success';
          anim = 'anim-pop';
        } else if (showWrong) {
          cls = 'border-rose-accent bg-rose-accent/10 text-white glow-error';
          anim = 'anim-shake';
        } else if (phase === 'feedback' && !active) {
          cls = 'border-ink-700 bg-ink-900 text-white/45';
        }
        return (
          <button
            key={i}
            disabled={phase !== 'play'}
            onClick={() => setPickedIdx(i)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${cls} ${anim}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                showCorrect
                  ? 'bg-grass text-white'
                  : showWrong
                    ? 'bg-rose-accent text-white'
                    : active
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-800 text-white/70'
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm sm:text-base">{o}</span>
            {showCorrect && (
              <Icon
                name="CheckCircle2"
                size={18}
                className="ml-auto text-grass"
              />
            )}
            {showWrong && (
              <Icon
                name="XCircle"
                size={18}
                className="ml-auto text-rose-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =================================================================
 * Match body — chap (terms) + o‘ng (shuffled definitions)
 * ================================================================= */
function MatchBody({
  q,
  phase,
  pairs,
  setPairs,
  activeLeft,
  setActiveLeft,
  rightItems,
  rightOrig,
}: {
  q: MatchQ;
  phase: Phase;
  pairs: Record<number, number>;
  setPairs: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  activeLeft: number | null;
  setActiveLeft: React.Dispatch<React.SetStateAction<number | null>>;
  rightItems: string[];
  rightOrig: number[];
}) {
  // Find which left is bonded to which right (shuffled idx)
  const rightToLeft: Record<number, number> = {};
  Object.entries(pairs).forEach(([l, r]) => {
    rightToLeft[r] = Number(l);
  });

  function pickLeft(i: number) {
    if (phase !== 'play') return;
    if (pairs[i] !== undefined) {
      // unbind
      setPairs((prev) => {
        const next = { ...prev };
        delete next[i];
        return next;
      });
      setActiveLeft(null);
      return;
    }
    setActiveLeft((cur) => (cur === i ? null : i));
  }

  function pickRight(r: number) {
    if (phase !== 'play') return;
    // if already bound — unbind
    if (rightToLeft[r] !== undefined) {
      setPairs((prev) => {
        const next = { ...prev };
        delete next[rightToLeft[r]];
        return next;
      });
      return;
    }
    if (activeLeft === null) return;
    setPairs((prev) => ({ ...prev, [activeLeft]: r }));
    setActiveLeft(null);
  }

  function leftClasses(i: number) {
    const bound = pairs[i] !== undefined;
    const active = activeLeft === i;
    const correctBond =
      phase === 'feedback' && bound && rightOrig[pairs[i]] === i;
    const wrongBond =
      phase === 'feedback' && bound && rightOrig[pairs[i]] !== i;
    let cls =
      'border-ink-700 bg-ink-900 text-white/70 hover:border-brand-500/60';
    if (active) cls = 'border-brand-500 bg-brand-500/10 text-white';
    if (bound && phase === 'play') {
      const color = PAIR_COLORS[i % PAIR_COLORS.length];
      return {
        cls: 'border-2 text-white',
        style: { borderColor: color, background: `${color}1a` },
      };
    }
    if (correctBond) cls = 'border-grass bg-grass/10 text-white glow-success';
    if (wrongBond)
      cls = 'border-rose-accent bg-rose-accent/10 text-white glow-error';
    return { cls, style: undefined };
  }

  function rightClasses(r: number) {
    const boundTo = rightToLeft[r];
    const bound = boundTo !== undefined;
    const correctBond =
      phase === 'feedback' && bound && rightOrig[r] === boundTo;
    const wrongBond =
      phase === 'feedback' && bound && rightOrig[r] !== boundTo;
    let cls =
      'border-ink-700 bg-ink-900 text-white/70 hover:border-brand-500/60';
    if (bound && phase === 'play') {
      const color = PAIR_COLORS[boundTo % PAIR_COLORS.length];
      return {
        cls: 'border-2 text-white',
        style: { borderColor: color, background: `${color}1a` },
      };
    }
    if (correctBond) cls = 'border-grass bg-grass/10 text-white glow-success';
    if (wrongBond)
      cls = 'border-rose-accent bg-rose-accent/10 text-white glow-error';
    return { cls, style: undefined };
  }

  return (
    <div>
      <p className="mb-4 text-sm text-white/55">
        Chap ustun bilan o‘ng ustunni juftlang.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Left column: terms (orig order) */}
        <div className="space-y-2.5">
          {q.pairs.map(([term], i) => {
            const { cls, style } = leftClasses(i);
            return (
              <button
                key={i}
                disabled={phase !== 'play'}
                onClick={() => pickLeft(i)}
                style={style}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${cls}`}
              >
                <span>{term}</span>
                {pairs[i] !== undefined && (
                  <Icon
                    name="Link2"
                    size={14}
                    color={PAIR_COLORS[i % PAIR_COLORS.length]}
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Right column: definitions (shuffled) */}
        <div className="space-y-2.5">
          {rightItems.map((def, r) => {
            const { cls, style } = rightClasses(r);
            return (
              <button
                key={r}
                disabled={phase !== 'play'}
                onClick={() => pickRight(r)}
                style={style}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${cls}`}
              >
                <span>{def}</span>
                {rightToLeft[r] !== undefined && (
                  <Icon
                    name="Link2"
                    size={14}
                    color={
                      PAIR_COLORS[rightToLeft[r] % PAIR_COLORS.length]
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =================================================================
 * Order body — so‘zlardan gap tuzish
 * ================================================================= */
function OrderBody({
  q,
  phase,
  placed,
  setPlaced,
}: {
  q: OrderQ;
  phase: Phase;
  placed: number[];
  setPlaced: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const available = q.words
    .map((_, i) => i)
    .filter((i) => !placed.includes(i));

  function pushWord(i: number) {
    if (phase !== 'play') return;
    setPlaced((p) => [...p, i]);
  }
  function popWord(i: number) {
    if (phase !== 'play') return;
    setPlaced((p) => p.filter((x) => x !== i));
  }

  const allPlaced = placed.length === q.words.length;
  const correctly =
    allPlaced && placed.every((w, i) => w === q.correctOrder[i]);

  return (
    <div>
      <p className="mb-4 text-sm text-white/55">
        Pastdagi so‘zlarni bosib, gapni tuzing.
      </p>
      {/* Placed slot */}
      <div
        className={`flex min-h-[64px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
          phase === 'feedback'
            ? correctly
              ? 'border-grass bg-grass/5'
              : 'border-rose-accent bg-rose-accent/5'
            : 'border-ink-700 bg-ink-900/60'
        }`}
      >
        {placed.length === 0 && (
          <span className="text-xs text-white/40">
            So‘zlar bu yerda paydo bo‘ladi…
          </span>
        )}
        {placed.map((wIdx, i) => (
          <motion.button
            key={`p-${wIdx}`}
            layout
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            disabled={phase !== 'play'}
            onClick={() => popWord(wIdx)}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-500 bg-brand-500/15 px-3 py-1.5 text-sm font-bold text-white hover:bg-brand-500/25"
          >
            <span className="text-white/45">{i + 1}.</span> {q.words[wIdx]}
          </motion.button>
        ))}
      </div>

      {/* Available words */}
      <div className="mt-4 flex flex-wrap gap-2">
        {available.map((wIdx) => (
          <motion.button
            key={`a-${wIdx}`}
            layout
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            disabled={phase !== 'play'}
            onClick={() => pushWord(wIdx)}
            className="inline-flex rounded-lg border-2 border-ink-700 bg-ink-900 px-3 py-1.5 text-sm font-bold text-white/80 transition-colors hover:border-brand-500 hover:text-white"
          >
            {q.words[wIdx]}
          </motion.button>
        ))}
        {available.length === 0 && (
          <span className="text-xs text-white/40">
            Hamma so‘zlar joylashtirildi.
          </span>
        )}
      </div>
    </div>
  );
}

/* =================================================================
 * Result Screen
 * ================================================================= */
interface ResultProps {
  tier: 'perfect' | 'good' | 'low';
  xp: number;
  coins: number;
  correct: number;
  wrong: number;
  heartsLeft: number;
  total: number;
  subjectName: string;
  grade?: string;
  onRetry: () => void;
  onOther: () => void;
}

function ResultScreen({
  tier,
  xp,
  coins,
  correct,
  wrong,
  heartsLeft,
  total,
  subjectName,
  grade,
  onRetry,
  onOther,
}: ResultProps) {
  const title =
    tier === 'perfect'
      ? 'Mukammal!'
      : tier === 'good'
        ? 'Yaxshi natija'
        : 'Yana urinib ko‘r';
  const sub =
    tier === 'perfect'
      ? 'Hamma savolga to‘g‘ri javob — zo‘r!'
      : tier === 'good'
        ? 'Ko‘pini to‘g‘ri yechdingiz, davom eting.'
        : 'Bir oz mashq qilsangiz natija oshadi.';

  const ringColor =
    tier === 'perfect' ? '#16a34a' : tier === 'good' ? '#475569' : '#e11d48';
  const iconName =
    tier === 'perfect'
      ? 'Trophy'
      : tier === 'good'
        ? 'CheckCircle2'
        : 'RotateCcw';

  return (
    <div className="relative mx-auto max-w-2xl">
      {tier === 'perfect' && <Confetti count={50} />}

      {/* Perfect: radial green glow overlay */}
      {tier === 'perfect' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.35, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(22,163,74,0.55) 0%, rgba(22,163,74,0.15) 40%, transparent 70%)',
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative z-[85] overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 text-center"
      >
        <div className="bg-ink-900 px-8 pt-10 pb-8">
          <motion.div
            initial={{ scale: 0.4, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.15,
              type: 'spring',
              stiffness: 240,
              damping: 14,
            }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl"
            style={{
              background: `${ringColor}22`,
              boxShadow:
                tier === 'perfect'
                  ? `0 0 0 4px ${ringColor}44, 0 0 40px ${ringColor}80`
                  : `0 0 0 2px ${ringColor}33`,
            }}
          >
            <Icon name={iconName} size={44} color={ringColor} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-3xl font-bold text-white"
          >
            {title}
          </motion.h2>
          <p className="mt-2 text-sm text-white/55">{sub}</p>
          <p className="mt-1 text-xs text-white/40">
            {subjectName}
            {grade ? ` · ${grade}-sinf` : ''}
          </p>

          {/* reward chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-sm font-bold text-brand-300">
              <Icon name="Sparkles" size={14} /> +{xp} XP
            </span>
            {coins > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fire/15 px-3 py-1.5 text-sm font-bold text-fire">
                <Icon name="Star" size={14} /> +{coins} tanga
              </span>
            )}
          </motion.div>
        </div>

        {/* Three stat tiles */}
        <div className="grid grid-cols-3 gap-px bg-ink-700">
          {[
            { v: `${correct}/${total}`, l: 'To‘g‘ri', c: '#16a34a' },
            { v: `${wrong}`, l: 'Xato', c: '#e11d48' },
            { v: `${heartsLeft}`, l: 'Hearts qoldi', c: '#0284c7' },
          ].map((x, i) => (
            <motion.div
              key={x.l}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-ink-900 py-5"
            >
              <div className="text-2xl font-bold" style={{ color: x.c }}>
                {x.v}
              </div>
              <div className="mt-0.5 text-xs uppercase tracking-wider text-white/45">
                {x.l}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-ink-700 p-6">
          <Button icon="RotateCcw" onClick={onRetry}>
            Qayta urinish
          </Button>
          <Button variant="dark" icon="BookOpen" onClick={onOther}>
            Boshqa fan
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default CoursePractice;

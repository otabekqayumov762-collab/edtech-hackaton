import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../store/useApp';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui';
import { Confetti } from '../../../components/Confetti';
import { findCourseSubject, isGradeAvailableForSubject } from '../../../lib/courses';
import * as TestsApi from '../../../lib/api/tests';
import type { Test as ApiTest, Question as ApiQuestion } from '../../../lib/api/tests';

/* =================================================================
 * CourseTest — real backend tests + playful UI + per-question feedback
 * URL: /app/fan/:subject/sinf/:grade/test
 * ================================================================= */

type Screen = 'list' | 'loading' | 'test' | 'result' | 'error';
type Phase = 'play' | 'feedback';

interface AnswerRecord {
  questionId: number | string;
  picked: number;
  isCorrect: boolean;
}

export function CourseTest() {
  const { subject, grade } = useParams<{ subject: string; grade: string }>();
  const nav = useNavigate();
  const { addXp } = useApp();
  const s = findCourseSubject(subject);

  // -- guard params (must come AFTER state? no — same as before) --
  // Hooks before any early return
  const [screen, setScreen] = useState<Screen>('list');
  const [tests, setTests] = useState<ApiTest[]>([]);
  const [errMsg, setErrMsg] = useState<string>('');
  const [activeTest, setActiveTest] = useState<ApiTest | null>(null);

  // test-mode state
  const [idx, setIdx] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('play');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [floatChip, setFloatChip] = useState<{ key: number; text: string } | null>(null);

  // gating per-question pick to prevent double-tap
  const lockRef = useRef(false);
  const rewardedRef = useRef(false);

  /* ---- Fetch tests list when on 'list' screen ---- */
  useEffect(() => {
    if (screen !== 'list' || !subject || !grade) return;
    let cancelled = false;
    setErrMsg('');
    setScreen('loading');
    const topicFilter = new URLSearchParams(window.location.search)
      .get('topic')
      ?.trim()
      .toLowerCase();
    TestsApi.list({ subject })
      .then((all) => {
        if (cancelled) return;
        let filtered = all.filter(
          (t) =>
            String(t.subject) === subject &&
            typeof t.title === 'string' &&
            t.title.includes(`${grade}-sinf`),
        );
        if (topicFilter) {
          filtered = filtered.filter((t) =>
            (t.title ?? '').toLowerCase().includes(topicFilter),
          );
        }
        setTests(filtered);
        // Auto-start when exactly one test matches the requested topic
        if (topicFilter && filtered.length === 1) {
          setScreen('loading');
          TestsApi.retrieve(filtered[0].id)
            .then((full) => {
              if (cancelled) return;
              setActiveTest(full);
              setIdx(0);
              setPickedIdx(null);
              setPhase('play');
              setAnswers([]);
              rewardedRef.current = false;
              setScreen((full.questions?.length ?? 0) > 0 ? 'test' : 'list');
            })
            .catch(() => {
              if (cancelled) return;
              setErrMsg("Savollar yuklanmadi");
              setScreen('error');
            });
        } else {
          setScreen('list');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setErrMsg("Internet ulanish yo'q yoki test topilmadi");
        setScreen('error');
      });
    return () => {
      cancelled = true;
    };
    // Intentionally run only on mount / param change. `screen` is the trigger
    // but we set it ourselves inside; guard above prevents re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade]);

  /* ---- Start a test: fetch detail (gives full questions) ---- */
  const startTest = useCallback(async (t: ApiTest) => {
    setErrMsg('');
    setScreen('loading');
    try {
      const detail = await TestsApi.retrieve(t.id);
      setActiveTest(detail);
      setIdx(0);
      setPickedIdx(null);
      setPhase('play');
      setAnswers([]);
      rewardedRef.current = false;
      setScreen('test');
    } catch {
      setErrMsg("Internet ulanish yo'q yoki test topilmadi");
      setScreen('error');
    }
  }, []);

  /* ---- Pick an option: call /tests/answer/ (fallback: client-side) ---- */
  const handlePick = useCallback(
    async (picked: number) => {
      if (!activeTest || lockRef.current || phase !== 'play') return;
      const question = activeTest.questions[idx];
      if (!question) return;
      lockRef.current = true;
      setPickedIdx(picked);

      let isCorrect = false;
      try {
        const res = await TestsApi.answer({
          question_id: question.id,
          picked_index: picked,
        });
        isCorrect = !!res.is_correct;
      } catch {
        // Fallback: if backend hasn't shipped answer endpoint OR network failed,
        // try local `correct` (some test fixtures expose it); else assume wrong.
        if (typeof question.correct === 'number') {
          isCorrect = question.correct === picked;
        } else {
          isCorrect = false;
        }
      }

      setAnswers((prev) => [
        ...prev,
        { questionId: question.id, picked, isCorrect },
      ]);
      setPhase('feedback');

      if (isCorrect) {
        const chipKey = Date.now();
        setFloatChip({ key: chipKey, text: '+4 XP' });
        setTimeout(() => {
          setFloatChip((cur) => (cur?.key === chipKey ? null : cur));
        }, 700);
      }
      lockRef.current = false;
    },
    [activeTest, idx, phase],
  );

  /* ---- Next question / finish ---- */
  const handleNext = useCallback(() => {
    if (!activeTest) return;
    if (idx + 1 >= activeTest.questions.length) {
      setScreen('result');
      return;
    }
    setIdx((i) => i + 1);
    setPickedIdx(null);
    setPhase('play');
  }, [activeTest, idx]);

  /* ---- Finalize: award XP once when result screen mounts ---- */
  useEffect(() => {
    if (screen !== 'result' || !activeTest || rewardedRef.current) return;
    rewardedRef.current = true;

    const total = activeTest.questions.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const baseXp = activeTest.xp ?? 50;
    // award: proportional to correct ratio, min 5
    const earnedXp = Math.max(5, Math.round((correctCount / Math.max(1, total)) * baseXp));

    // Best-effort POST /tests/finish/
    const wrongIndices = answers
      .map((a, i) => (a.isCorrect ? -1 : i))
      .filter((i) => i >= 0);
    setSubmitting(true);
    TestsApi.finish({ test_id: activeTest.id, wrong_indices: wrongIndices })
      .catch(() => {
        // ignore — endpoint may not exist / network issue
      })
      .finally(() => setSubmitting(false));

    const isPerfect = correctCount === total;
    addXp(earnedXp, isPerfect ? 'Mukammal test yakuni!' : 'Test yakunlandi');
  }, [screen, activeTest, answers, addXp]);

  /* ---- Guard params (after all hooks declared) ---- */
  if (!s || !s.available || !grade || !subject || !isGradeAvailableForSubject(subject, grade)) {
    return <Navigate to="/app/fan" replace />;
  }

  /* ============================================================
   * Render: error screen
   * ============================================================ */
  if (screen === 'error') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackBar onBack={() => nav(`/app/fan/${subject}/sinf/${grade}`)} subject={s.name} grade={grade} />
        <div className="mt-10 rounded-xl border border-ink-700 bg-ink-800 p-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: '#e11d4822' }}
          >
            <Icon name="WifiOff" size={32} color="#e11d48" />
          </div>
          <h2 className="text-xl font-bold text-white">Xatolik</h2>
          <p className="mt-2 text-sm text-white/60">{errMsg || "Test yuklanmadi"}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              icon="RotateCcw"
              onClick={() => {
                setErrMsg('');
                setScreen('list');
              }}
            >
              <span style={{ color: '#ffffff' }}>Qayta urinish</span>
            </Button>
            <Button variant="dark" icon="ChevronLeft" onClick={() => nav(`/app/fan/${subject}/sinf/${grade}`)}>
              Orqaga
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
   * Render: loading
   * ============================================================ */
  if (screen === 'loading') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackBar onBack={() => nav(`/app/fan/${subject}/sinf/${grade}`)} subject={s.name} grade={grade} />
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Icon name="Loader2" size={36} color={s.color} />
          </motion.div>
          <p className="text-sm text-white/60">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
   * Render: list of tests for this subject+grade
   * ============================================================ */
  if (screen === 'list') {
    return (
      <div className="mx-auto max-w-2xl">
        <BackBar onBack={() => nav(`/app/fan/${subject}/sinf/${grade}`)} subject={s.name} grade={grade} />

        <div className="mt-6">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ background: `${s.color}22`, color: s.color }}
          >
            <Icon name="ClipboardCheck" size={12} />
            Yakuniy testlar
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            {grade}-sinf · {s.name}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Mavjud testlardan birini tanlang
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
            <Icon name="ClipboardX" size={36} className="mx-auto text-white/30" />
            <p className="mt-3 text-sm text-white/60">
              Hozircha bu sinf uchun test mavjud emas
            </p>
            <p className="mt-1 text-xs text-white/40">Tez kunda qo'shiladi</p>
            <div className="mt-5">
              <Button variant="dark" icon="ChevronLeft" onClick={() => nav(`/app/fan/${subject}/sinf/${grade}`)}>
                Bo'limga qaytish
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {tests.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => startTest(t)}
                className="group relative overflow-hidden rounded-xl border border-ink-700 bg-ink-800 p-5 text-left transition-all hover:border-ink-600 hover:bg-ink-700/60"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}22` }}
                  >
                    <Icon name="ClipboardCheck" size={22} color={s.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-white">
                      {cleanTitle(t.title, grade)}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5">
                        <Icon name="HelpCircle" size={11} />
                        {t.question_count ?? t.questions?.length ?? '?'} savol
                      </span>
                      {t.duration_min ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5">
                          <Icon name="Clock" size={11} />
                          {t.duration_min} min
                        </span>
                      ) : null}
                      {t.xp ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 font-bold text-brand-300">
                          <Icon name="Sparkles" size={11} />+{t.xp} XP
                        </span>
                      ) : null}
                      {t.difficulty ? (
                        <span className="rounded-full bg-ink-900 px-2 py-0.5">
                          {t.difficulty}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Icon
                    name="ChevronRight"
                    size={20}
                    className="mt-1 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/70"
                  />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ============================================================
   * Render: test mode (one question at a time)
   * ============================================================ */
  if (screen === 'test' && activeTest) {
    const total = activeTest.questions.length;
    const q: ApiQuestion = activeTest.questions[idx];
    const progressPct = ((idx + (phase === 'feedback' ? 1 : 0)) / total) * 100;
    const lastAnswer = answers[answers.length - 1];
    const correctAnswerIndex =
      phase === 'feedback' && lastAnswer && lastAnswer.isCorrect ? pickedIdx : null;

    return (
      <div className="mx-auto max-w-2xl">
        {/* Topbar */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Testdan chiqasizmi? Hisob saqlanmaydi.')) {
                setActiveTest(null);
                setScreen('list');
              }
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
          >
            <Icon name="X" size={18} /> Chiqish
          </button>
          <span className="text-xs font-semibold text-white/55">
            {cleanTitle(activeTest.title, grade)}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-1 flex items-center justify-between text-xs text-white/55">
          <span>
            Savol {idx + 1} / {total}
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-800">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
          >
            {/* floating +XP chip */}
            <AnimatePresence>
              {floatChip && (
                <motion.span
                  key={floatChip.key}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -60 }}
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
              <Icon name="Target" size={12} />
              {s.name} · {grade}-sinf
            </span>
            <h2 className="mt-4 text-xl font-bold leading-snug text-white sm:text-2xl">
              {q.text}
            </h2>

            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const isPicked = pickedIdx === i;
                const isThisCorrect =
                  phase === 'feedback' && isPicked && lastAnswer?.isCorrect;
                const isThisWrong =
                  phase === 'feedback' && isPicked && !lastAnswer?.isCorrect;
                const dimmed = phase === 'feedback' && !isPicked && i !== correctAnswerIndex;

                let cls = 'border-ink-700 bg-ink-900 hover:border-ink-600 text-white';
                let anim = '';
                if (isThisCorrect) {
                  cls = 'border-grass bg-grass/15 text-white';
                  anim = 'anim-pop';
                } else if (isThisWrong) {
                  cls = 'border-rose-accent bg-rose-accent/15 text-white';
                  anim = 'anim-shake';
                } else if (dimmed) {
                  cls = 'border-ink-700 bg-ink-900 text-white/45';
                }

                return (
                  <button
                    key={i}
                    disabled={phase !== 'play'}
                    onClick={() => handlePick(i)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${cls} ${anim}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                        isThisCorrect
                          ? 'bg-grass text-white'
                          : isThisWrong
                            ? 'bg-rose-accent text-white'
                            : 'bg-ink-800 text-white/70'
                      }`}
                    >
                      {String.fromCharCode(65 + i).toLowerCase()}
                    </span>
                    <span className="text-sm font-medium sm:text-base">{opt}</span>
                    {isThisCorrect && (
                      <Icon name="CheckCircle2" size={18} className="ml-auto text-grass" />
                    )}
                    {isThisWrong && (
                      <Icon name="XCircle" size={18} className="ml-auto text-rose-accent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Per-question feedback banner */}
            <AnimatePresence>
              {phase === 'feedback' && lastAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-5 rounded-lg border p-4 ${
                    lastAnswer.isCorrect
                      ? 'border-grass/40 bg-grass/10'
                      : 'border-rose-accent/40 bg-rose-accent/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      name={lastAnswer.isCorrect ? 'CheckCircle2' : 'XCircle'}
                      size={18}
                      color={lastAnswer.isCorrect ? '#16a34a' : '#e11d48'}
                    />
                    <div className="flex-1">
                      <div
                        className={`text-sm font-bold ${
                          lastAnswer.isCorrect ? 'text-grass' : 'text-rose-accent'
                        }`}
                      >
                        {lastAnswer.isCorrect ? "To'g'ri javob!" : "Noto'g'ri"}
                      </div>
                      {q.explanation ? (
                        <p className="mt-1 text-xs leading-relaxed text-white/70">
                          {q.explanation}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs leading-relaxed text-white/55">
                          {lastAnswer.isCorrect
                            ? 'Davom eting — keyingi savol!'
                            : "Bunday savollar yana uchraydi. Diqqat bilan o'qing."}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <div className="mt-5 flex justify-end">
          {phase === 'feedback' && (
            <Button
              icon={idx + 1 >= total ? 'Trophy' : 'ArrowRight'}
              onClick={handleNext}
            >
              <span style={{ color: '#ffffff' }}>
                {idx + 1 >= total ? 'Yakunlash' : "Keyingisi"}
              </span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================
   * Render: result screen
   * ============================================================ */
  if (screen === 'result' && activeTest) {
    const total = activeTest.questions.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = total - correctCount;
    const ratio = correctCount / Math.max(1, total);
    const isPerfect = correctCount === total;
    const tier: 'perfect' | 'good' | 'low' = isPerfect
      ? 'perfect'
      : ratio >= 0.6
        ? 'good'
        : 'low';
    const baseXp = activeTest.xp ?? 50;
    const earnedXp = Math.max(5, Math.round(ratio * baseXp));

    return (
      <ResultScreen
        tier={tier}
        xp={earnedXp}
        correct={correctCount}
        wrong={wrongCount}
        total={total}
        subjectName={s.name}
        grade={grade}
        testTitle={cleanTitle(activeTest.title, grade)}
        submitting={submitting}
        questions={activeTest.questions}
        answers={answers}
        onRetry={() => {
          rewardedRef.current = false;
          setIdx(0);
          setPickedIdx(null);
          setPhase('play');
          setAnswers([]);
          setScreen('test');
        }}
        onOther={() => {
          setActiveTest(null);
          setAnswers([]);
          setScreen('list');
        }}
        onExit={() => nav(`/app/fan/${subject}/sinf/${grade}`)}
      />
    );
  }

  return null;
}

/* ====================================================
 * BackBar (used in list / loading / error)
 * ==================================================== */
function BackBar({
  onBack,
  subject,
  grade,
}: {
  onBack: () => void;
  subject: string;
  grade?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
      >
        <Icon name="ChevronLeft" size={16} /> Orqaga
      </button>
      <span className="text-xs font-semibold text-white/45">
        {subject}
        {grade ? ` · ${grade}-sinf` : ''}
      </span>
    </div>
  );
}

/* ====================================================
 * Helpers
 * ==================================================== */
function cleanTitle(title: string, grade?: string): string {
  // Strip leading "<grade>-sinf · " prefix if present, for cleaner card UI
  if (!grade) return title;
  const re = new RegExp(`^\\s*${grade}-sinf\\s*[·•\\-:]\\s*`);
  return title.replace(re, '').trim() || title;
}

/* ====================================================
 * Result Screen
 * ==================================================== */
interface ResultProps {
  tier: 'perfect' | 'good' | 'low';
  xp: number;
  correct: number;
  wrong: number;
  total: number;
  subjectName: string;
  grade?: string;
  testTitle: string;
  submitting: boolean;
  questions: ApiQuestion[];
  answers: AnswerRecord[];
  onRetry: () => void;
  onOther: () => void;
  onExit: () => void;
}

function ResultScreen({
  tier,
  xp,
  correct,
  wrong,
  total,
  subjectName,
  grade,
  testTitle,
  submitting,
  questions,
  answers,
  onRetry,
  onOther,
  onExit,
}: ResultProps) {
  const [showReview, setShowReview] = useState(false);

  const title =
    tier === 'perfect'
      ? 'Mukammal!'
      : tier === 'good'
        ? 'Yaxshi natija'
        : "Yana urinib ko'r";
  const sub =
    tier === 'perfect'
      ? "Bironta xato yo'q — zo'r ish!"
      : tier === 'good'
        ? "Yaxshi natija, davom eting."
        : "Bir oz mashq qilsangiz natija oshadi.";

  const ringColor =
    tier === 'perfect' ? '#16a34a' : tier === 'good' ? '#475569' : '#e11d48';
  const iconName =
    tier === 'perfect' ? 'Trophy' : tier === 'good' ? 'CheckCircle2' : 'RotateCcw';

  return (
    <div className="relative mx-auto max-w-2xl">
      {tier === 'perfect' && <Confetti count={50} />}

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
            transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 14 }}
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
            {testTitle} · {subjectName}
            {grade ? ` · ${grade}-sinf` : ''}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-sm font-bold text-brand-300">
              <Icon name="Sparkles" size={14} /> +{xp} XP
            </span>
            {submitting && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-700 px-3 py-1.5 text-xs text-white/60">
                <Icon name="Loader2" size={12} /> Saqlanmoqda...
              </span>
            )}
          </motion.div>
        </div>

        {/* Three stat tiles */}
        <div className="grid grid-cols-3 gap-px bg-ink-700">
          {[
            { v: `${correct}/${total}`, l: "To'g'ri", c: '#16a34a' },
            { v: `${wrong}`, l: "Noto'g'ri", c: '#e11d48' },
            { v: `${Math.round((correct / Math.max(1, total)) * 100)}%`, l: 'Natija', c: '#0284c7' },
          ].map((x, i) => (
            <motion.div
              key={x.l}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-ink-800 py-5"
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
            <span style={{ color: '#ffffff' }}>Qayta urinish</span>
          </Button>
          <Button
            variant="dark"
            icon={showReview ? 'ChevronUp' : 'List'}
            onClick={() => setShowReview((v) => !v)}
          >
            {showReview ? 'Yashirish' : 'Tahlil'}
          </Button>
          <Button variant="dark" icon="BookOpen" onClick={onOther}>
            Boshqa test
          </Button>
          <Button variant="dark" icon="LogOut" onClick={onExit}>
            Chiqish
          </Button>
        </div>
      </motion.div>

      {/* Per-question review */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 space-y-2"
          >
            {questions.map((q, i) => {
              const a = answers[i];
              const ok = a?.isCorrect;
              return (
                <div
                  key={q.id}
                  className={`rounded-lg border p-4 text-left ${
                    ok
                      ? 'border-grass/30 bg-grass/5'
                      : 'border-rose-accent/30 bg-rose-accent/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-bold text-white/45">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{q.text}</p>
                      <p className="mt-1 text-xs text-white/55">
                        Sizning javobingiz:{' '}
                        <span className={ok ? 'text-grass' : 'text-rose-accent'}>
                          {a ? q.options[a.picked] : '—'}
                        </span>
                      </p>
                      {q.explanation && (
                        <p className="mt-1 text-xs text-white/45">{q.explanation}</p>
                      )}
                    </div>
                    <Icon
                      name={ok ? 'CheckCircle2' : 'XCircle'}
                      size={18}
                      color={ok ? '#16a34a' : '#e11d48'}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CourseTest;

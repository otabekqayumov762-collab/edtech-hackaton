import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';
import { Confetti } from '../../components/Confetti';
import { ErrorReview } from '../../components/ErrorReview';
import { PageHead, Empty } from './_shared';
import type { Question, SubjectId } from '../../lib/types';
import { XP } from '../../lib/gamification';
import type { AnsweredQuestion } from '../../lib/errorAnalysis';
import * as testsApi from '../../lib/api/tests';

type SubjectChoice = SubjectId | 'mix';
type QuestionWithSubject = Question & { _subject: SubjectId };

interface SubjectChip {
  id: SubjectChoice;
  label: string;
  icon: string;
}

const SUBJECT_CHIPS: SubjectChip[] = [
  { id: 'mix', label: 'Aralash', icon: 'Shuffle' },
  { id: 'matematika', label: 'Matematika', icon: 'Sigma' },
  { id: 'ona-tili', label: 'Ona tili + Adabiyot', icon: 'BookText' },
  { id: 'tarix', label: 'Tarix', icon: 'ScrollText' },
];

const POOL_SIZE = 10;

function pickPool(
  allQuestions: QuestionWithSubject[],
  subject: SubjectChoice,
  n: number,
): QuestionWithSubject[] {
  const filtered =
    subject === 'mix'
      ? allQuestions
      : allQuestions.filter((q) => q._subject === subject);
  const source = filtered.length > 0 ? filtered : allQuestions;
  return [...source].sort(() => Math.random() - 0.5).slice(0, n);
}

export function Practice() {
  const { addXp } = useApp();
  const nav = useNavigate();

  const [allQuestions, setAllQuestions] = useState<QuestionWithSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    testsApi
      .list()
      .then((tests) => {
        if (cancelled) return;
        const all: QuestionWithSubject[] = tests.flatMap((t) =>
          (t.questions ?? []).map((q) => ({
            id: String(q.id),
            text: q.text,
            options: q.options ?? [],
            correct: q.correct ?? 0,
            explanation: q.explanation ?? '',
            _subject: String(t.subject) as SubjectId,
          })),
        );
        setAllQuestions(all);
      })
      .catch(() => {
        if (!cancelled) setAllQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [started, setStarted] = useState(false);
  const [subject, setSubject] = useState<SubjectChoice>('mix');
  const [seed, setSeed] = useState(0);

  const pool = useMemo<QuestionWithSubject[]>(() => {
    void seed;
    return pickPool(allQuestions, subject, POOL_SIZE);
  }, [seed, subject, allQuestions]);

  const [retryPool, setRetryPool] = useState<QuestionWithSubject[] | null>(
    null,
  );
  const activePool: QuestionWithSubject[] =
    retryPool && retryPool.length > 0 ? retryPool : pool;

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [showReview, setShowReview] = useState(false);

  const advanceLockRef = useRef(false);
  const recordedRef = useRef(false);

  const lastActive = idx === activePool.length - 1;
  const q = activePool[idx];

  const handleSubjectChange = useCallback((next: SubjectChoice) => {
    setSubject(next);
    setSeed((s) => s + 1);
    setIdx(0);
    setPicked(null);
    setReveal(false);
    setCorrect(0);
    setDone(false);
    setTimeLeft(30);
    setAnswers([]);
    setShowReview(false);
    setRetryPool(null);
    recordedRef.current = false;
  }, []);

  const recordCurrent = useCallback(
    (pickedNow: number | null) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      const cur = activePool[idx];
      if (!cur) return;
      const aq: AnsweredQuestion = {
        index: idx,
        subject: cur._subject,
        kind: 'choice',
        question: cur.text,
        options: cur.options,
        correctAnswer: cur.options[cur.correct],
        userAnswer: pickedNow !== null ? cur.options[pickedNow] : null,
        isCorrect: pickedNow === cur.correct,
        explanation: cur.explanation,
      };
      setAnswers((prev) => [...prev, aq]);
    },
    [idx, activePool],
  );

  const goNext = useCallback(() => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    if (lastActive) {
      addXp(XP.dailyChallenge, 'Kunlik challenge');
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
      setReveal(false);
      setTimeLeft(30);
      recordedRef.current = false;
    }
    setTimeout(() => {
      advanceLockRef.current = false;
    }, 50);
  }, [lastActive, addXp]);

  useEffect(() => {
    if (!started || done || reveal) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        recordCurrent(picked);
        setTimeLeft(0);
        setReveal(true);
      } else {
        setTimeLeft((v) => v - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, done, reveal, picked, recordCurrent]);

  useEffect(() => {
    if (!reveal || done) return;
    const t = setTimeout(() => goNext(), 4000);
    return () => clearTimeout(t);
  }, [reveal, done, goNext]);

  const retryWrong = useCallback(() => {
    const wrongQuestions = answers
      .filter((a) => !a.isCorrect)
      .map((a) => activePool[a.index])
      .filter((x): x is QuestionWithSubject => Boolean(x));
    if (wrongQuestions.length === 0) return;
    setRetryPool(wrongQuestions);
    setIdx(0);
    setPicked(null);
    setReveal(false);
    setCorrect(0);
    setDone(false);
    setTimeLeft(30);
    setAnswers([]);
    setShowReview(false);
    recordedRef.current = false;
  }, [answers, activePool]);

  const resetAll = useCallback(() => {
    setStarted(false);
    setIdx(0);
    setPicked(null);
    setReveal(false);
    setCorrect(0);
    setDone(false);
    setTimeLeft(30);
    setAnswers([]);
    setShowReview(false);
    setRetryPool(null);
    setSeed((s) => s + 1);
    recordedRef.current = false;
  }, []);

  // --- Start screen ---
  if (!started) {
    return (
      <div>
        <PageHead
          icon="Dumbbell"
          title="Mashqlar"
          desc="Kunlik challenge — fanni tanlang va tezkor mashq qiling"
        />
        {loading ? (
          <p className="py-10 text-center text-sm text-white/55">
            Savollar yuklanmoqda...
          </p>
        ) : allQuestions.length === 0 ? (
          <Empty
            icon="Dumbbell"
            title="Savollar topilmadi"
            desc="Hozircha mashq uchun savollar mavjud emas — testlar ro‘yxati bo‘sh."
          />
        ) : (
          <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-ink-700 bg-ink-800 p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="CalendarCheck" size={28} />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-white">
              Kunlik challenge
            </h2>
            <p className="mt-2 text-white/55">
              10 ta savol. To‘g‘ri javob bersangiz darhol XP olasiz va kunlik
              seriyangizni saqlaysiz.
            </p>

            <div className="mt-6 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/55">
                Fan
              </p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_CHIPS.map((chip) => {
                  const active = subject === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleSubjectChange(chip.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-600 text-white'
                          : 'border-ink-700 bg-ink-900 text-white/65 hover:border-brand-400 hover:text-white'
                      }`}
                    >
                      <Icon name={chip.icon} size={13} />
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-6 text-sm text-white/55">
              <span className="flex items-center gap-1.5">
                <Icon name="ClipboardCheck" size={15} /> {pool.length} savol
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="Zap" size={15} className="text-gold" /> +
                {XP.dailyChallenge} XP
              </span>
            </div>
            <Button
              variant="gold"
              size="lg"
              block
              className="mt-7"
              icon="Play"
              onClick={() => {
                setRetryPool(null);
                setIdx(0);
                setPicked(null);
                setReveal(false);
                setCorrect(0);
                setDone(false);
                setTimeLeft(30);
                setAnswers([]);
                setShowReview(false);
                recordedRef.current = false;
                setStarted(true);
              }}
              disabled={pool.length === 0}
            >
              Challenge'ni boshlash
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Done screen ---
  if (done) {
    if (showReview) {
      return (
        <div>
          <ErrorReview
            answers={answers}
            onRetryWrong={retryWrong}
            onClose={() => setShowReview(false)}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg">
        {correct === activePool.length && <Confetti count={70} />}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800 text-center"
        >
          <div className="bg-ink-900 px-8 pt-10 pb-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-brand-600">
              <Icon name="PartyPopper" size={40} className="text-ink-950" />
            </div>
            <h2 className="mt-6 text-3xl font-black text-white">
              Challenge yakunlandi!
            </h2>
            <p className="mt-2 text-white/55">
              {correct} / {activePool.length} to‘g‘ri javob
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 font-bold text-gold">
              <Icon name="Zap" size={16} /> +{XP.dailyChallenge} XP olindi
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 p-6">
            <Button
              icon="Eye"
              variant="primary"
              onClick={() => setShowReview(true)}
            >
              Xatolarni ko‘rish
            </Button>
            <Button icon="RotateCcw" variant="dark" onClick={resetAll}>
              Yana bir bor
            </Button>
            <Button variant="dark" icon="Home" onClick={() => nav('/app')}>
              Bosh sahifa
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!q) return null;

  // --- Question screen ---
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-sm text-white/55">
        <span>
          Savol {idx + 1} / {activePool.length}
          {retryPool && (
            <span className="ml-2 rounded-full bg-rose-accent/15 px-2 py-0.5 text-[10px] font-bold text-rose-accent">
              XATOLAR
            </span>
          )}
        </span>
        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-1.5 text-sm font-bold ${
              timeLeft <= 10 ? 'text-rose-accent' : 'text-white/70'
            }`}
          >
            <Icon
              name={timeLeft <= 10 ? 'Timer' : 'Clock'}
              size={14}
              className={timeLeft <= 10 ? 'animate-pulse' : ''}
            />
            0:{timeLeft.toString().padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <Icon name="CheckCircle2" size={14} /> {correct} to‘g‘ri
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-ink-800">
        <motion.div
          className="h-full rounded-full bg-brand-500"
          animate={{ width: `${((idx + 1) / activePool.length) * 100}%` }}
        />
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-800">
        <motion.div
          key={idx}
          className={`h-full rounded-full ${
            timeLeft <= 10 ? 'bg-rose-accent' : 'bg-brand-600'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 30) * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold leading-snug text-white">
            {q.text}
          </h2>
          <div className="mt-6 space-y-3">
            {q.options.map((o, i) => {
              const isCorrect = i === q.correct;
              const isPicked = picked === i;
              let cls =
                'border-ink-700 bg-ink-900 hover:border-brand-400 hover:bg-brand-600/5 text-white';
              let badgeCls = 'bg-ink-800 text-white/60';
              if (reveal && isCorrect) {
                cls =
                  'border-emerald-500 bg-emerald-500/15 text-emerald-900 glow-success';
                badgeCls = 'bg-emerald-500 text-white';
              } else if (reveal && isPicked && !isCorrect) {
                cls = 'border-rose-500 bg-rose-500/15 text-rose-900 anim-shake';
                badgeCls = 'bg-rose-500 text-white';
              } else if (isPicked) {
                cls = 'border-brand-500 bg-brand-600/20 text-white';
                badgeCls = 'bg-brand-600 text-white';
              }
              return (
                <button
                  key={i}
                  disabled={reveal}
                  onClick={() => setPicked(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${cls}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${badgeCls}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium">{o}</span>
                  {reveal && isCorrect && (
                    <Icon
                      name="CheckCircle2"
                      size={20}
                      className="ml-auto text-emerald-600"
                    />
                  )}
                  {reveal && isPicked && !isCorrect && (
                    <Icon
                      name="XCircle"
                      size={20}
                      className="ml-auto text-rose-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {reveal && (
            <div className="mt-5 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-white/65">
              <b className="text-brand-300">Izoh:</b> {q.explanation}
            </div>
          )}

          {!reveal ? (
            <Button
              block
              size="lg"
              className="mt-7"
              disabled={picked === null}
              onClick={() => {
                if (picked === q.correct) setCorrect((c) => c + 1);
                recordCurrent(picked);
                setReveal(true);
              }}
            >
              Javobni tekshirish
            </Button>
          ) : (
            <div className="mt-7">
              <Button
                block
                size="lg"
                icon={lastActive ? 'Trophy' : 'ArrowRight'}
                onClick={goNext}
              >
                {lastActive ? 'Yakunlash' : 'Keyingi savol'}
              </Button>
              <p className="mt-2 text-center text-xs text-white/45">
                Avtomatik 4 soniyada o‘tadi...
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

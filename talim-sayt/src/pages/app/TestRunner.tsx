import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';
import { Confetti } from '../../components/Confetti';
import * as testsApi from '../../lib/api/tests';
import * as subjectsApi from '../../lib/api/subjects';
import type { Test as LocalTest, SubjectId } from '../../lib/types';

function adaptTest(t: testsApi.Test): LocalTest {
  return {
    id: String(t.id),
    subject: String(t.subject) as SubjectId,
    title: t.title,
    difficulty: (t.difficulty as LocalTest['difficulty']) ?? 'O‘rta',
    durationMin: t.duration_min ?? 10,
    xp: t.xp ?? 0,
    questions: (t.questions ?? []).map((q) => ({
      id: String(q.id),
      text: q.text,
      options: q.options,
      correct: q.correct ?? 0,
      explanation: q.explanation ?? '',
    })),
  };
}

export function TestRunner() {
  const { id } = useParams();
  const { user, finishTest, recordAnswer } = useApp();
  const nav = useNavigate();

  const [test, setTest] = useState<LocalTest | null>(null);
  const [subject, setSubject] = useState<subjectsApi.Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [queue, setQueue] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [correctIdxs, setCorrectIdxs] = useState<Set<number>>(new Set());
  const [wrongIdxs, setWrongIdxs] = useState<Set<number>>(new Set());
  const [retryMode, setRetryMode] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<{
    xp: number;
    perfect: boolean;
    correct: number;
    total: number;
  } | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    testsApi
      .retrieve(id)
      .then((raw) => {
        if (cancelled) return;
        const adapted = adaptTest(raw);
        setTest(adapted);
        setQueue(adapted.questions.map((_, i) => i));
        // best-effort subject fetch
        subjectsApi
          .retrieve(adapted.subject)
          .then((s) => {
            if (!cancelled) setSubject(s);
          })
          .catch(() => {
            /* ignore */
          });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Testni yuklab bo‘lmadi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <p className="py-20 text-center text-sm text-white/55">Yuklanmoqda...</p>
    );
  }

  if (loadError || !test) {
    return (
      <div className="py-20 text-center text-white/50">
        {loadError ?? 'Test topilmadi.'}{' '}
        <Link to="/app/testlar" className="text-brand-300">
          Orqaga
        </Link>
      </div>
    );
  }

  const sColor = subject?.color ?? '#a997ff';
  const sIcon = subject?.icon ?? 'BookOpen';
  const sName = subject?.name ?? test.subject;

  const qIndex = queue[pos];
  const q = test.questions[qIndex];

  function finalize() {
    finalizeWith(wrongIdxs);
  }

  function submit() {
    if (picked === null || advancingRef.current || !test) return;
    const isCorrect = picked === q.correct;
    advancingRef.current = true;
    setFlash(isCorrect ? 'ok' : 'bad');
    recordAnswer(isCorrect);
    const nextWrongs = new Set(wrongIdxs);
    if (isCorrect) {
      const nc = new Set(correctIdxs);
      nc.add(qIndex);
      setCorrectIdxs(nc);
      if (retryMode) {
        nextWrongs.delete(qIndex);
      }
    } else {
      nextWrongs.add(qIndex);
    }
    setWrongIdxs(nextWrongs);
    setTimeout(() => {
      setFlash(null);
      setPicked(null);
      advancingRef.current = false;
      const nextPos = pos + 1;
      if (nextPos < queue.length) {
        setPos(nextPos);
      } else if (!retryMode && nextWrongs.size > 0) {
        setShowRetryPrompt(true);
      } else {
        finalizeWith(nextWrongs);
      }
    }, 720);
  }

  function finalizeWith(wrongs: Set<number>) {
    if (!test) return;
    const total = test.questions.length;
    const finalWrongs = Array.from(wrongs);
    const correct = total - finalWrongs.length;
    const res = finishTest(test, correct, finalWrongs);
    // best-effort backend sync — fire-and-forget
    testsApi
      .finish({ test_id: test.id, wrong_indices: finalWrongs })
      .catch(() => {
        /* offline / not implemented — local state still updates */
      });
    setOutcome(res);
    setDone(true);
  }

  function startRetry() {
    const list = Array.from(wrongIdxs);
    setQueue(list);
    setPos(0);
    setRetryMode(true);
    setShowRetryPrompt(false);
  }

  /* ============ Result screen ============ */
  if (done && outcome) {
    const pct = Math.round((outcome.correct / outcome.total) * 100);
    const great = pct >= 60;
    return (
      <div className="mx-auto max-w-2xl">
        {outcome.perfect && <Confetti count={50} />}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800 text-center"
        >
          <div className="bg-ink-900 px-8 pt-10 pb-8">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-xl ${
                great ? 'bg-brand-600' : 'bg-ink-700'
              }`}
            >
              <Icon
                name={outcome.perfect ? 'Trophy' : great ? 'CheckCircle2' : 'RotateCcw'}
                size={36}
                className="text-white"
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-white">
              {outcome.perfect ? 'Mukammal' : great ? 'Yaxshi natija' : 'Yana urinib ko‘ring'}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {test.title} — {sName}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-ink-700">
            {[
              { v: `${outcome.correct}/${outcome.total}`, l: 'To‘g‘ri' },
              { v: `${pct}%`, l: 'Aniqlik' },
              { v: `+${outcome.xp}`, l: 'XP' },
            ].map((x) => (
              <div key={x.l} className="bg-ink-800 py-5">
                <div className="text-xl font-bold text-white">{x.v}</div>
                <div className="text-xs text-white/45">{x.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-ink-700 p-6">
            <Button
              icon="RotateCcw"
              onClick={() => {
                setQueue(test.questions.map((_, i) => i));
                setPos(0);
                setPicked(null);
                setCorrectIdxs(new Set());
                setWrongIdxs(new Set());
                setRetryMode(false);
                setDone(false);
                setOutcome(null);
              }}
            >
              Qayta yechish
            </Button>
            <Button variant="outline" icon="ClipboardList" onClick={() => nav('/app/testlar')}>
              Boshqa testlar
            </Button>
            <Button variant="dark" icon="Home" onClick={() => nav('/app')}>
              Bosh sahifa
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ============ Retry prompt ============ */
  if (showRetryPrompt) {
    return (
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-ink-700 bg-ink-800 p-7 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-accent/20 text-rose-accent">
            <Icon name="RotateCcw" size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            {wrongIdxs.size} ta xato qoldi
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Xato qilgan savollarni qaytadan ishlab ko‘ring — bu marta haqiqatan ham mustahkamlaysiz.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button icon="Play" block onClick={startRetry}>
              Xatolarni qaytadan
            </Button>
            <Button variant="dark" block onClick={finalize}>
              Yakunlash
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ============ Quiz screen ============ */
  const progress = queue.length > 0 ? ((pos + 1) / queue.length) * 100 : 0;
  const lives = user?.lives ?? 0;
  const livesMax = user?.livesMax ?? 10;

  if (!q) {
    return (
      <div className="py-20 text-center text-white/50">
        Savollar mavjud emas.{' '}
        <Link to="/app/testlar" className="text-brand-300">
          Orqaga
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => nav('/app/testlar')}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
        >
          <Icon name="X" size={16} /> Chiqish
        </button>
        <div className="flex items-center gap-3">
          {retryMode && (
            <span className="rounded-md bg-rose-accent/15 px-2.5 py-1 text-xs font-bold text-rose-accent">
              Xatolarni qayta
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: livesMax }).map((_, i) => (
              <Icon
                key={i}
                name={i < lives ? 'Heart' : 'HeartOff'}
                size={15}
                color={i < lives ? '#e11d48' : '#3a2c80'}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm text-white/55">
        <span>
          Savol {pos + 1} / {queue.length}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink-800">
        <motion.div
          className="h-full rounded-full bg-brand-500"
          animate={{ width: `${progress}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${qIndex}-${retryMode}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="mt-6 rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${sColor}26`, color: sColor }}
          >
            <Icon name={sIcon} size={13} /> {sName}
          </span>
          <h2 className="mt-4 text-xl font-bold leading-snug text-white">{q.text}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((o, i) => {
              const active = picked === i;
              const showOk = flash === 'ok' && i === q.correct;
              const showBad = flash === 'bad' && i === picked;
              let cls = 'border-ink-700 bg-ink-900 hover:border-ink-600 text-white';
              if (showOk) cls = 'border-grass bg-grass/15 text-white';
              else if (showBad) cls = 'border-rose-accent bg-rose-accent/15 text-white';
              else if (active && flash === null)
                cls = 'border-brand-500 bg-brand-600/20 text-white';
              return (
                <button
                  key={i}
                  onClick={() => flash === null && setPicked(i)}
                  disabled={flash !== null}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${cls}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                      active ? 'bg-brand-600 text-white' : 'bg-ink-800 text-white/55'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium">{o}</span>
                  {showOk && (
                    <Icon name="CheckCircle2" size={18} className="ml-auto text-grass" />
                  )}
                  {showBad && (
                    <Icon name="XCircle" size={18} className="ml-auto text-rose-accent" />
                  )}
                </button>
              );
            })}
          </div>
          <Button
            block
            size="lg"
            className="mt-7"
            disabled={picked === null || flash !== null}
            onClick={submit}
            icon="ArrowRight"
          >
            Javobni yuborish
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

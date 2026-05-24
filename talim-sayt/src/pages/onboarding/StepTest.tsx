import { useMemo, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { OnboardingShell } from './OnboardingShell';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/useApp';
import { TESTS, SUBJECTS } from '../../lib/mockData';
import type { Question, Test } from '../../lib/types';

interface PickedQuestion {
  q: Question;
  subjectId: Test['subject'];
  difficulty: Test['difficulty'];
}

function pickPlacementQuestions(): PickedQuestion[] {
  const byDiff: Record<Test['difficulty'], PickedQuestion[]> = {
    Oson: [],
    'O‘rta': [],
    Qiyin: [],
  };
  for (const t of TESTS) {
    for (const q of t.questions) {
      byDiff[t.difficulty].push({ q, subjectId: t.subject, difficulty: t.difficulty });
    }
  }
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const result: PickedQuestion[] = [
    ...shuffle(byDiff.Oson).slice(0, 2),
    ...shuffle(byDiff['O‘rta']).slice(0, 2),
    ...shuffle(byDiff.Qiyin).slice(0, 1),
  ];
  return shuffle(result).slice(0, 5);
}

export function StepTest() {
  const { user } = useApp();
  const nav = useNavigate();

  const items = useMemo(() => pickPlacementQuestions(), []);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [correct, setCorrect] = useState(0);
  const advancingRef = useRef(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.dailyMinutes == null) return <Navigate to="/onboarding/vaqt" replace />;
  if (!user.weakSubjects || user.weakSubjects.length === 0)
    return <Navigate to="/onboarding/fanlar" replace />;

  const current = items[pos];
  const subject = SUBJECTS.find((s) => s.id === current.subjectId)!;

  const submit = () => {
    if (picked == null || advancingRef.current) return;
    advancingRef.current = true;
    const isCorrect = picked === current.q.correct;
    setFlash(isCorrect ? 'ok' : 'bad');
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setTimeout(() => {
      setFlash(null);
      setPicked(null);
      advancingRef.current = false;
      const nextPos = pos + 1;
      if (nextPos >= items.length) {
        setCorrect(nextCorrect);
        nav('/onboarding/natija', {
          state: { correct: nextCorrect, total: items.length },
        });
      } else {
        setCorrect(nextCorrect);
        setPos(nextPos);
      }
    }, 650);
  };

  return (
    <OnboardingShell
      step={3}
      title="Darajangizni aniqlaymiz"
      subtitle="5 ta tezkor savol — javoblar dasturni moslashtiradi."
    >
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Savol {pos + 1} / {items.length}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {current.difficulty}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((pos + 1) / items.length) * 100}%` }}
        />
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        <Icon name={subject.icon} size={12} /> {subject.name}
      </span>

      <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-900">
        {current.q.text}
      </h2>

      <div className="mt-6 space-y-2.5">
        {current.q.options.map((o, i) => {
          const active = picked === i;
          const showOk = flash === 'ok' && i === current.q.correct;
          const showBad = flash === 'bad' && i === picked;
          let cls =
            'border-slate-200 bg-white hover:border-slate-300 text-slate-800';
          if (showOk)
            cls = 'border-green-500 bg-green-50 text-green-800';
          else if (showBad)
            cls = 'border-red-500 bg-red-50 text-red-800';
          else if (active && flash === null)
            cls = 'border-blue-600 bg-blue-50 text-slate-900';
          return (
            <button
              key={i}
              type="button"
              onClick={() => flash === null && setPicked(i)}
              disabled={flash !== null}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors ${cls}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                  active && flash === null
                    ? 'bg-blue-600 text-white'
                    : showOk
                      ? 'bg-green-500 text-white'
                      : showBad
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-medium">{o}</span>
              {showOk && (
                <Icon
                  name="CheckCircle2"
                  size={18}
                  className="ml-auto text-green-600"
                />
              )}
              {showBad && (
                <Icon
                  name="XCircle"
                  size={18}
                  className="ml-auto text-red-600"
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={picked === null || flash !== null}
        onClick={submit}
        className="mt-8 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        {pos + 1 === items.length ? 'Natijani ko‘rish' : 'Keyingisi'}
      </button>
    </OnboardingShell>
  );
}

import { useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { OnboardingShell } from './OnboardingShell';
import { useApp } from '../../store/useApp';
import type { User } from '../../lib/types';

type Level = NonNullable<User['placementLevel']>;

function computeLevel(correct: number): Level {
  if (correct >= 4) return 'Yuqori';
  if (correct >= 2) return 'O‘rta';
  return 'Boshlang‘ich';
}

const DESCRIPTION: Record<Level, string> = {
  'Boshlang‘ich':
    'Asoslarni mustahkamlashdan boshlaymiz. Har bir mavzu sekin-asta, izchil tartibda.',
  'O‘rta':
    'Sizda yaxshi baza bor. Tipik xatolar ustida ishlaymiz va o‘rta-yuqori darajaga olib o‘tamiz.',
  Yuqori:
    'Zo‘r natija. Murakkab masalalar va imtihon stilidagi savollar bilan davom etamiz.',
};

export function StepResult() {
  const { user, patchUser } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const state = loc.state as { correct?: number; total?: number } | null;

  const correct = state?.correct ?? 0;
  const total = state?.total ?? 5;
  const level: Level = useMemo(() => computeLevel(correct), [correct]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.dailyMinutes == null) return <Navigate to="/onboarding/vaqt" replace />;
  if (!user.weakSubjects || user.weakSubjects.length === 0)
    return <Navigate to="/onboarding/fanlar" replace />;
  if (!state) return <Navigate to="/onboarding/test" replace />;

  const finish = () => {
    patchUser({
      placementLevel: level,
      dailyMinutes: user.dailyMinutes,
      weakSubjects: user.weakSubjects,
    });
    nav('/app');
  };

  return (
    <OnboardingShell
      step={4}
      title="Tahlil tayyor"
      subtitle="Quyidagi daraja sizning javoblaringiz asosida aniqlandi."
    >
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">Sizning darajangiz</p>
        <h2 className="mt-1 text-4xl font-bold tracking-tight text-blue-700">
          {level}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {DESCRIPTION[level]}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="To‘g‘ri" value={`${correct}/${total}`} />
        <Stat label="Vaqt" value={`${user.dailyMinutes} daq.`} />
        <Stat label="Fokus" value={`${user.weakSubjects.length} fan`} />
      </div>

      <button
        type="button"
        onClick={finish}
        className="mt-10 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Boshlash
      </button>
    </OnboardingShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

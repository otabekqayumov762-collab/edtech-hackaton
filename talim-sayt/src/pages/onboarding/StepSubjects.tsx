import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { OnboardingShell } from './OnboardingShell';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/useApp';
import { SUBJECTS } from '../../lib/mockData';
import type { SubjectId } from '../../lib/types';

export function StepSubjects() {
  const { user, patchUser } = useApp();
  const nav = useNavigate();
  const [picked, setPicked] = useState<SubjectId[]>(user?.weakSubjects ?? []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.dailyMinutes == null) return <Navigate to="/onboarding/vaqt" replace />;

  const toggle = (id: SubjectId) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const submit = () => {
    if (picked.length === 0) return;
    patchUser({ weakSubjects: picked });
    nav('/onboarding/test');
  };

  return (
    <OnboardingShell
      step={2}
      title="Qaysi fanlarda qiynaladingiz?"
      subtitle="Bir nechta tanlash mumkin. Shu fanlardan boshlaymiz."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SUBJECTS.map((s) => {
          const active = picked.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {s.name}
              </span>
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Icon name="Check" size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-slate-600">
        Tanlangan:{' '}
        <span className="font-semibold text-slate-900">{picked.length}</span> ta
        fan. Kamida 1 ta tanlang.
      </p>

      <button
        type="button"
        disabled={picked.length === 0}
        onClick={submit}
        className="mt-8 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        Davom etish
      </button>
    </OnboardingShell>
  );
}

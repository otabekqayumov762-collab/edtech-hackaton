import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { OnboardingShell } from './OnboardingShell';
import { useApp } from '../../store/useApp';

const OPTIONS = [10, 20, 30, 45, 60];
const LABEL: Record<number, string> = {
  10: 'Yengil tezda',
  20: 'Barqaror',
  30: 'Tavsiya etiladi',
  45: 'Jiddiy',
  60: 'Maksimal',
};

export function StepTime() {
  const { user, patchUser } = useApp();
  const nav = useNavigate();
  const [pick, setPick] = useState<number | null>(user?.dailyMinutes ?? 30);

  if (!user) return <Navigate to="/login" replace />;

  const submit = () => {
    if (pick == null) return;
    patchUser({ dailyMinutes: pick });
    nav('/onboarding/fanlar');
  };

  return (
    <OnboardingShell
      step={1}
      title="Kuniga qancha vaqt ajratasiz?"
      subtitle="Real maqsad qo‘ying — izchillik muhim."
    >
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((m) => {
          const active = pick === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setPick(m)}
              className={`inline-flex items-center justify-center h-14 px-6 rounded-xl border-2 text-sm font-semibold transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {m} daqiqa
            </button>
          );
        })}
      </div>

      {pick != null && (
        <p className="mt-5 text-sm text-slate-600">
          Tanlandi: <span className="font-semibold text-slate-900">{LABEL[pick]}</span>
        </p>
      )}

      <button
        type="button"
        disabled={pick == null}
        onClick={submit}
        className="mt-10 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        Davom etish
      </button>
    </OnboardingShell>
  );
}

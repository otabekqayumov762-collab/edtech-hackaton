import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/Brand';

interface Props {
  step: 1 | 2 | 3 | 4;
  total?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function OnboardingShell({
  step,
  total = 4,
  title,
  subtitle,
  children,
}: Props) {
  const pct = (step / total) * 100;
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex">
            <BrandMark size={28} />
          </Link>
          <span className="text-sm text-slate-500">
            Qadam {step} / {total}
          </span>
        </header>

        <div className="mb-10">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-slate-600">{subtitle}</p>
          )}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

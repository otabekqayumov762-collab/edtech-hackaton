import type { ReactNode } from 'react';
import { Icon } from '../../components/Icon';

export function PageHead({
  title,
  desc,
  icon,
  action,
}: {
  title: string;
  desc?: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon name={icon} size={22} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          {desc && <p className="mt-1 text-sm text-white/45">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  icon,
  color,
  value,
  label,
  iconNode,
}: {
  icon?: string;
  color: string;
  value: ReactNode;
  label: string;
  /** Oddiy ikon o‘rniga (masalan StreakFire) */
  iconNode?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[148px] flex-col rounded-xl border border-ink-700 bg-ink-800 p-5">
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `${color}26`, color: icon ? color : undefined }}
      >
        {iconNode ?? (icon ? <Icon name={icon} size={28} /> : null)}
      </span>
      <div className="mt-auto pt-4">
        <div className="text-3xl font-black leading-none text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="mt-1.5 text-sm text-white/45">{label}</div>
      </div>
    </div>
  );
}

export function Empty({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-700 bg-ink-900/50 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink-800 text-white/40">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="mt-4 font-bold text-white">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-white/45">{desc}</p>
    </div>
  );
}

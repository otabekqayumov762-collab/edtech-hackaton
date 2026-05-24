import { useEffect } from 'react';
import { Icon } from '../Icon';

interface BadgeUnlockProps {
  title: string;
  description?: string;
  icon?: string;
  onDismiss: () => void;
}

export function BadgeUnlock({
  title,
  description,
  icon = 'Trophy',
  onDismiss,
}: BadgeUnlockProps) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(), 3500);
    return () => window.clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="anim-pop block w-full text-left"
        style={{
          boxShadow:
            '0 18px 40px -10px rgba(0,0,0,0.45), 0 0 0 1px rgba(251,191,36,0.45), 0 0 28px rgba(251,191,36,0.45)',
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-brand-600 p-5 text-white">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(251,191,36,0.18)', color: '#fbbf24' }}
          >
            <Icon name={icon} size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/65">
              Yangi nishon
            </p>
            <p className="truncate text-base font-bold leading-tight">{title}</p>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/75">
                {description}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

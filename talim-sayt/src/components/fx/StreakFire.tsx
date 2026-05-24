import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

interface StreakFireProps {
  streak: number;
  size?: Size;
  className?: string;
  showValue?: boolean;
}

const SIZE_PX: Record<Size, number> = { sm: 14, md: 18, lg: 24 };

function glowFor(streak: number): { color: string; shadow: string } {
  if (streak >= 100) {
    return {
      color: '#60a5fa',
      shadow:
        'drop-shadow(0 0 6px rgba(96,165,250,0.85)) drop-shadow(0 0 14px rgba(251,191,36,0.6))',
    };
  }
  if (streak >= 30) {
    return {
      color: '#f43f5e',
      shadow:
        'drop-shadow(0 0 6px rgba(244,63,94,0.85)) drop-shadow(0 0 12px rgba(168,85,247,0.55))',
    };
  }
  if (streak >= 7) {
    return {
      color: '#fbbf24',
      shadow: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))',
    };
  }
  return { color: '#f97316', shadow: 'none' };
}

export function StreakFire({
  streak,
  size = 'md',
  className = '',
  showValue = false,
}: StreakFireProps) {
  const px = SIZE_PX[size];
  const { color, shadow } = glowFor(streak);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <motion.span
        className="inline-flex"
        style={{ color, filter: shadow }}
        animate={{ scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flame size={px} strokeWidth={2.2} />
      </motion.span>
      {showValue && (
        <span className="text-sm font-bold tabular-nums">
          {streak.toLocaleString()}
        </span>
      )}
    </span>
  );
}

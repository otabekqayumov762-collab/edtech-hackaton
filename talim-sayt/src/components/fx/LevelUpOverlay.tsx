import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface LevelUpOverlayProps {
  level: number;
  onDismiss: () => void;
}

const RING_COLORS = ['#fbbf24', '#4f46e5', '#16a34a'];

export function LevelUpOverlay({ level, onDismiss }: LevelUpOverlayProps) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(), 3000);
    return () => window.clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      key={`lvl-${level}`}
      onClick={onDismiss}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center bg-brand-600/40 backdrop-blur-sm"
      role="dialog"
      aria-label="Level up"
    >
      <div className="relative flex flex-col items-center justify-center">
        {RING_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute h-40 w-40 rounded-full border-4"
            style={{ borderColor: color }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: [0, 2.5], opacity: [0.6, 0] }}
            transition={{
              duration: 1.6,
              delay: i * 0.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 18,
            delay: 0.05,
          }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <span className="font-display text-7xl font-black leading-none text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]">
            {level}
          </span>
          <span className="mt-3 text-2xl font-bold uppercase tracking-wider text-white">
            Level Up!
          </span>
          <span className="mt-2 text-sm text-white/70">
            Bosing yoki kuting
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

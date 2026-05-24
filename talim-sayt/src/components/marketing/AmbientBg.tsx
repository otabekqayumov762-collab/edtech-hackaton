import { motion } from 'framer-motion';

/**
 * Subtle ambient background — slow gradient mesh + floating particles.
 * Designed for the Landing hero zone. Brand-blue palette only.
 * Performance-friendly: pure CSS blob animations + 7 motion particles.
 */
export function AmbientBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Slow gradient mesh — 3 blurred blobs */}
      <div className="absolute inset-0 opacity-60">
        <div className="animate-blob absolute -left-20 -top-32 h-[480px] w-[480px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="animate-blob-2 absolute -right-24 top-1/3 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="animate-blob-3 absolute -bottom-20 left-1/4 h-[380px] w-[380px] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      {/* Floating particles */}
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-blue-400/50"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { PhoneMockup } from './PhoneMockup';

/* Scroll-driven 3D iPhone — comes in tilted (Apple-style), straightens as user scrolls. */

export function Phone3D({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Track scroll progress across FULL element visibility window.
  // start end → element top hits viewport bottom (progress=0, just entering)
  // end start → element bottom hits viewport top (progress=1, just leaving)
  // Bu uzun masofa → animatsiya ancha sekinroq bo'ladi
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Smoother + slower spring (kichik stiffness, katta damping)
  const smooth = useSpring(scrollYProgress, {
    stiffness: 35,
    damping: 28,
    mass: 0.9,
  });

  // Cubic ease-out: 1 - (1-t)^3
  // Demo bilan to'liq mos: -32 → 0, 14 → 0, 0.78 → 1, 40 → 0
  const rotY = useTransform(smooth, (t) => {
    const e = 1 - Math.pow(1 - t, 3);
    return -32 + 32 * e;
  });
  const rotX = useTransform(smooth, (t) => {
    const e = 1 - Math.pow(1 - t, 3);
    return 14 - 14 * e;
  });
  const yV = useTransform(smooth, (t) => {
    const e = 1 - Math.pow(1 - t, 3);
    return 40 - 40 * e;
  });

  if (reduce) {
    return (
      <div
        ref={ref}
        className={`relative mx-auto max-w-full ${className}`}
      >
        <PhoneMockup tilt={0} />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative mx-auto max-w-full ${className}`}
      style={{ perspective: '1400px', perspectiveOrigin: '50% 45%' }}
    >
      <motion.div
        className="[transform:translateZ(0)]"
        style={{
          rotateY: rotY,
          rotateX: rotX,
          y: yV,
          transformStyle: 'preserve-3d',
        }}
      >
        <PhoneMockup tilt={0} />
      </motion.div>
    </div>
  );
}

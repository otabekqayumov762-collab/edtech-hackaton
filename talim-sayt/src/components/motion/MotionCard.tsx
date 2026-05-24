import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export function MotionCard(props: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      {...props}
    />
  );
}

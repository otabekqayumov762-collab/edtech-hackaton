import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export function MotionButton(props: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      {...props}
    />
  );
}

'use client';

import { motion } from 'framer-motion';

// Easing presets
export const EASE_SPRING = [0.175, 0.885, 0.32, 1.275];
export const EASE_SMOOTH = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1];

/**
 * FadeIn: Entrance component with optional directional offset & delay
 */
export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 20,
  className = '',
  ...props
}) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance, x: 0 };
      case 'down': return { y: -distance, x: 0 };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: EASE_SMOOTH,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn: Physics-based spring scale entrance component
 */
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  initialScale = 0.92,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: EASE_SMOOTH,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer: Parent container for cascading staggered child animations
 */
export function StaggerContainer({
  children,
  staggerChildren = 0.08,
  delayChildren = 0.05,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem: Individual item rendered within StaggerContainer
 */
export function StaggerItem({
  children,
  className = '',
  yOffset = 18,
  ...props
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.45,
            ease: EASE_SMOOTH,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * HoverCard: Card wrapper with subtle springy elevation and press physics
 */
export function HoverCard({
  children,
  className = '',
  liftAmount = -4,
  ...props
}) {
  return (
    <motion.div
      whileHover={{
        y: liftAmount,
        transition: { duration: 0.25, ease: EASE_SMOOTH },
      }}
      whileTap={{
        scale: 0.985,
        y: liftAmount / 2,
        transition: { duration: 0.1 },
      }}
      className={`med-card-hover ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedProgressBar: Smooth bar growth animation for diagnostic scores
 */
export function AnimatedProgressBar({
  progress = 0,
  duration = 0.9,
  delay = 0.1,
  colorClass = 'bg-emerald-500',
  heightClass = 'h-2.5',
  className = '',
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800 ${heightClass} ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{
          duration,
          delay,
          ease: EASE_SMOOTH,
        }}
        className={`h-full rounded-full ${colorClass}`}
      />
    </div>
  );
}

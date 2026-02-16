'use client';

/**
 * Prithvi — Reusable Motion Components
 * A cohesive animation system using Framer Motion.
 * All animations follow: calm, intentional, no bounce.
 */

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useEffect, useState, type ReactNode } from 'react';

// ─── Shared Easing ───────────────────────────────────────
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// ─── RevealSection ───────────────────────────────────────
// Wraps a full-width section with fade + translateY on scroll entry.

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function RevealSection({
  children,
  className = '',
  delay = 0,
  once = true,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer ────────────────────────────────────
// Wraps children and staggers their entrance animations.

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-60px' });

  const parent: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={parent}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}

// ─── FloatingWrapper ─────────────────────────────────────
// Adds a slow floating animation (4–6s loop) to children.

interface FloatingWrapperProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

export function FloatingWrapper({
  children,
  className = '',
  duration = 6,
  distance = 6,
}: FloatingWrapperProps) {
  return (
    <motion.div
      animate={{ y: [0, -distance, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedCounter ─────────────────────────────────────
// Smoothly counts from 0 to a target number.

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className = '',
  decimals = 0,
  suffix = '',
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── ScaleCard ───────────────────────────────────────────
// A card that scales in from 0.96 → 1 on scroll entry.

interface ScaleCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScaleCard({ children, className = '', delay = 0 }: ScaleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── FadeIn ──────────────────────────────────────────────
// Simple opacity fade for lighter elements.

export function FadeIn({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideIn ─────────────────────────────────────────────
// Slides in from a direction.

export function SlideIn({
  children,
  className = '',
  direction = 'left',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}) {
  const offsets = {
    left: { x: -60, y: 0 },
    right: { x: 60, y: 0 },
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
  };

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offsets[direction] }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedPresence wrapper for data transitions ───────
export function DataTransition({
  children,
  dataKey,
  className = '',
}: {
  children: ReactNode;
  dataKey: string | number;
  className?: string;
}) {
  return (
    <motion.div
      key={dataKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

'use client';

/**
 * Prithvi — Cursor Glow Effect
 * A subtle radial gradient that follows the mouse cursor,
 * plus magnetic hover effects on interactive elements.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [hoveringInteractive, setHoveringInteractive] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring-based following
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    if (!visible) setVisible(true);
  }, [cursorX, cursorY, visible]);

  const handleMouseDown = useCallback(() => setClicked(true), []);
  const handleMouseUp = useCallback(() => setClicked(false), []);
  const handleMouseLeave = useCallback(() => setVisible(false), []);
  const handleMouseEnter = useCallback(() => setVisible(true), []);

  useEffect(() => {
    // Detect interactive elements
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('button, a, select, input, [role="button"], .magnetic-hover');
      setHoveringInteractive(!!interactive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleOver);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleOver);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleMouseLeave, handleMouseEnter]);

  // Hide on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Large ambient glow */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: visible ? 0.5 : 0,
          scale: clicked ? 0.8 : hoveringInteractive ? 1.5 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className="w-[300px] h-[300px] rounded-full"
          style={{
            background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)`,
            opacity: 0.08,
          }}
        />
      </motion.div>

      {/* Small precise dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: clicked ? 0.6 : hoveringInteractive ? 2.2 : 1,
          width: hoveringInteractive ? 40 : 8,
          height: hoveringInteractive ? 40 : 8,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
          mass: 0.3,
        }}
      >
        <div
          className="w-full h-full rounded-full bg-white"
          style={{ opacity: hoveringInteractive ? 0.15 : 0.7 }}
        />
      </motion.div>

      {/* Click ripple */}
      <AnimatePresence>
        {clicked && (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9998]"
            style={{
              x: cursorX,
              y: cursorY,
              translateX: '-50%',
              translateY: '-50%',
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div
              className="w-10 h-10 rounded-full border border-accent/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

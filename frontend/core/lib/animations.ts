import { Variants } from 'framer-motion'

// --- keep these names, upgrade the values ---
export const floatUp: Variants = {
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.34,1.56,0.64,1] } },
}
export const zeroG = {
  animate: { y: [0, -12, 0], rotate: [0, 1, 0, -1, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
}
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
}
export const slideIn: Variants = {
  initial: { opacity: 0, x: -20, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.2,0,0,1] } },
  exit: { opacity: 0, x: 20, filter: 'blur(4px)', transition: { duration: 0.2 } },
}
export const stagger = (i: number) => ({
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.07, duration: 0.5, ease: [0.34,1.56,0.64,1] } },
})

// --- NEW exports ---

// Full page enter/exit transition — wrap each page in this
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.2,0,0,1] } },
  exit:    { opacity: 0, y: -20, scale: 1.01, transition: { duration: 0.3, ease: [0.4,0,1,1] } },
}

// Reveal on scroll — use with whileInView
export const revealUp: Variants = {
  hidden:  { opacity: 0, y: 60, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: [0.34,1.56,0.64,1] } },
}
export const revealLeft: Variants = {
  hidden:  { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.2,0,0,1] } },
}
export const revealRight: Variants = {
  hidden:  { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.2,0,0,1] } },
}

// Number counter animation — use with useMotionValue + animate
export const countUp = (from: number, to: number, duration = 1.2) => ({
  from, to, duration, ease: 'easeOut'
})

export { useTilt } from '@/core/hooks/useTilt'

// Hover lift — subtle 3D press effect
export const hoverLift = {
  whileHover: { y: -4, scale: 1.02, rotateX: 2, rotateY: 2, transition: { duration: 0.2, ease: [0.2,0,0,1] } },
  whileTap:   { y: 0, scale: 0.97, transition: { duration: 0.1 } },
}

// Accent pulse — orange dot / indicator
export const accentPulse = {
  animate: { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
}

// Shimmer loading skeleton
export const shimmer = {
  animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
}

// Number ticker for stats (count up on mount)
export const ticker: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.34,1.56,0.64,1] } },
}

// Staggered list container
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
export const listItem: Variants = {
  hidden:   { opacity: 0, x: -16, scale: 0.97 },
  visible:  { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: [0.34,1.56,0.64,1] } },
}

// Success burst — execute_swap confirmed
export const successBurst: Variants = {
  initial: { scale: 0, opacity: 0, rotate: -10 },
  animate: { scale: [0, 1.15, 1], opacity: 1, rotate: 0, transition: { duration: 0.5, ease: [0.34,1.56,0.64,1] } },
  exit:    { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
}

// Drawer slide up — mobile bottom sheets
export const drawerUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.34,1.56,0.64,1] } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.3, ease: [0.4,0,1,1] } },
}

// Floating ambient orb (background decoration — NOT glassmorphism, flat colour)
export const orb = (delay = 0) => ({
  animate: { x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.95, 1] },
  transition: { duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay },
})

// Tab indicator slide
export const tabIndicator: Variants = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1, transition: { duration: 0.25, ease: [0.2,0,0,1] } },
}

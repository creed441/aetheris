'use client'
import { motion } from 'framer-motion'
import { pageTransition } from '@/core/lib/animations'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

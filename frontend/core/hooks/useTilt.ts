'use client'
import { useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

export function useTilt(intensity = 12) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 300, damping: 30 })
  const scale = useSpring(1, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
    scale.set(1.02)
  }
  const handleMouseLeave = () => { x.set(0); y.set(0); scale.set(1) }
  return { ref, style: { rotateX, rotateY, scale, transformPerspective: 1000 }, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }
}

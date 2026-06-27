'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

interface Props { value: number; prefix?: string; suffix?: string; decimals?: number; className?: string }
export function AnimatedNumber({ value, prefix='', suffix='', decimals=2, className='' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const controls = animate(parseFloat(el.textContent?.replace(/[^\d.-]/g, '') ?? '0'), value, {
      duration: 1.2, ease: 'easeOut',
      onUpdate: (v) => { el.textContent = prefix + v.toFixed(decimals).toLocaleString() + suffix }
    })
    return controls.stop
  }, [value, prefix, suffix, decimals])
  return <span ref={ref} className={className}>{prefix}{(0).toFixed(decimals)}{suffix}</span>
}

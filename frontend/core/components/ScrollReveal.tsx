'use client';

import { useScrollReveal } from '@/core/hooks/useScrollReveal';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in';
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function ScrollReveal({ animation = 'fade-up', delay = 0, className = '', children }: ScrollRevealProps) {
  const { ref, isInView } = useScrollReveal();

  return (
    <div
      ref={ref as any}
      className={`animate-${animation} ${isInView ? 'in-view' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

'use client';
import { SwapCard } from '@/features/trade/SwapCard';
import { BottomNav } from '@/core/components/BottomNav';
import { ScrollReveal } from '@/core/components/ScrollReveal';

export default function SwapPage() {
  return (
    <main className="min-h-screen bg-transparent flex flex-col items-center pt-[100px] pb-32 px-6 relative z-10">
      <div className="w-full max-w-[480px] px-0 mx-auto flex flex-col gap-8">
        <ScrollReveal 
          animation="fade-up"
          delay={0}
          className="text-center flex flex-col gap-3"
        >
          <h1 className="font-display font-[800] text-[48px] text-[var(--text-primary)] tracking-tight uppercase leading-none">Token Swap</h1>
          <p className="font-body text-[var(--text-secondary)]">
            Instant on-chain swaps via Soroban AMM
          </p>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={100}>
          <SwapCard />
        </ScrollReveal>

        {/* Price Chart Placeholder */}
        <ScrollReveal 
          animation="scale-in"
          delay={200}
          className="glass-card rounded-2xl h-[60px] flex items-center justify-center mt-4 border border-[var(--border-subtle)] border-dashed hover:border-[rgba(200,255,0,0.3)] transition-colors"
        >
          <span className="font-mono italic text-[var(--text-secondary)] text-sm tracking-wide">Price chart — coming soon</span>
        </ScrollReveal>
      </div>
      <div className="pb-20">
        <BottomNav />
      </div>
    </main>
  );
}

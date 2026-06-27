'use client';
import { LiquidityCard } from '@/features/pool/LiquidityCard';
import { BottomNav } from '@/core/components/BottomNav';
import { AnimatedNumber } from '@/core/components/AnimatedNumber';
import { usePoolStats } from '@/core/hooks/usePoolStats';
import { ScrollReveal } from '@/core/components/ScrollReveal';

export default function PoolPage() {
  const { tvl, apy } = usePoolStats();

  const STEPS = [
    { title: 'Add Assets', desc: 'Deposit both AETH and XLM in equal value to the liquidity pool.' },
    { title: 'Earn Yield', desc: 'Automatically earn a share of every protocol transaction fee.' },
    { title: 'Withdraw Anytime', desc: 'Redeem your LP tokens for your original assets plus earnings.' },
  ];

  return (
    <main className="min-h-screen bg-transparent p-6 pt-24 pb-32 relative">
      <div className="max-w-4xl mx-auto flex flex-col gap-16 relative z-10">
        
        {/* Header & Main Card */}
        <ScrollReveal 
          animation="fade-up"
          delay={0}
          className="max-w-lg mx-auto w-full flex flex-col gap-8"
        >
          <div className="text-center flex flex-col gap-3">
            <h1 className="text-4xl md:text-5xl font-display font-[800] text-[var(--text-primary)] tracking-tight uppercase">Protocol Liquidity</h1>
            <p className="font-body text-[var(--text-secondary)] text-base">Supply assets to the Soroban pool and earn protocol fees.</p>
          </div>
          <LiquidityCard />
        </ScrollReveal>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            { label: 'Total Value Locked', value: parseFloat(tvl), prefix: '$', decimals: 0 },
            { label: 'Your Pool Share', value: 1.24, suffix: '%', decimals: 2 },
            { label: 'Active APY', value: parseFloat(apy), suffix: '%', decimals: 1 },
          ].map((stat, i) => (
            <ScrollReveal
              key={stat.label}
              animation="fade-up"
              delay={i * 100}
              className="glass-card p-6 border border-[var(--border-subtle)] relative overflow-hidden group bg-white"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[rgba(37,99,235,0.2)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <p className="font-body text-[11px] font-[700] uppercase tracking-widest text-[var(--text-secondary)] mb-2">{stat.label}</p>
              <div className="font-mono text-3xl font-bold text-[var(--text-primary)]">
                <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* How it works */}
        <div className="flex flex-col gap-10 mt-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[55%] left-[10%] right-[10%] h-[1px] border-t border-dashed border-[var(--border-aether)] opacity-20 -z-10" />

          <ScrollReveal animation="fade-up">
            <h2 className="text-2xl font-display font-[800] text-[var(--text-primary)] uppercase tracking-tight text-center">How it works</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal 
                key={i}
                animation="fade-up"
                delay={i * 100}
                className="glass-card p-8 border border-[var(--border-subtle)] flex flex-col gap-4 relative overflow-hidden bg-white"
              >
                {/* Large Watermark Number */}
                <div className="absolute -bottom-8 -right-4 font-display font-[900] text-[120px] leading-none text-[var(--aether)] opacity-5 select-none">
                  {i + 1}
                </div>
                
                <h3 className="text-base font-display font-[700] text-[var(--text-primary)] uppercase tracking-wide relative z-10">{step.title}</h3>
                <p className="font-body text-[var(--text-secondary)] text-sm leading-relaxed relative z-10">{step.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

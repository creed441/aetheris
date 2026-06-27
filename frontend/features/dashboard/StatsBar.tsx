'use client';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Droplets, Zap, RefreshCw, Activity } from 'lucide-react';
import { useAetherPrice } from '@/core/hooks/useAetherPrice';
import { usePoolStats } from '@/core/hooks/usePoolStats';
import { stagger, accentPulse } from '@/core/lib/animations';
import { AnimatedNumber } from '@/core/components/AnimatedNumber';
import { SkeletonCard } from '@/core/components/Skeleton';
import useSWR from 'swr';

interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: string;
  icon: React.ElementType;
}

const StatMetric = memo(function StatMetric({ item, index }: { item: StatItem; index: number }) {
  const { icon: Icon, label, value, prefix, suffix, decimals, delta } = item;
  const isPositive = delta?.startsWith('+');

  return (
    <motion.div
      variants={stagger(index)}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.02)] hover:border-blue-200 transition-colors group"
    >
      <div className="flex justify-between items-start">
        <div className="text-label text-slate-400 group-hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider">{label}</div>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors text-slate-400 group-hover:text-blue-500">
          <Icon size={16} />
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        {delta && (
          <div className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {delta}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const StatsBar = memo(function StatsBar() {
  const { price, change24h, isLoading: priceLoading } = useAetherPrice();
  const { tvl, volume24h, apy, isLoading: poolLoading } = usePoolStats();
  const { isValidating: priceValidating } = useSWR('/api/price');
  const { isValidating: poolValidating }  = useSWR('/api/pool');
  const isValidating = priceValidating || poolValidating;
  const isLoading    = priceLoading || poolLoading;

  const stats: StatItem[] = [
    {
      label: 'AETH Price',
      value: parseFloat(price),
      prefix: '$',
      decimals: 4,
      delta: `${parseFloat(change24h) >= 0 ? '+' : ''}${change24h}%`,
      icon: TrendingUp,
    },
    {
      label: 'Total Value Locked',
      value: parseFloat(tvl),
      prefix: '$',
      decimals: 0,
      delta: '+4.2%',
      icon: Droplets,
    },
    {
      label: '24h Volume',
      value: parseFloat(volume24h),
      prefix: '$',
      decimals: 0,
      delta: '-1.8%',
      icon: Zap,
    },
    {
      label: 'Current APY',
      value: parseFloat(apy),
      suffix: '%',
      decimals: 1,
      delta: '+0.5%',
      icon: Activity,
    },
  ];

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
            <TrendingUp size={18} className="text-[var(--aether)]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Protocol Pulse</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.div {...accentPulse} className="w-1.5 h-1.5 rounded-full bg-[var(--aether)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live testnet Feed</span>
            </div>
          </div>
        </div>
        
        <RefreshCw
          size={16}
          className={`text-slate-300 transition-colors cursor-pointer ${isValidating ? 'animate-spin text-[var(--aether)]' : ''}`}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} rows={2} />)
          : stats.map((s, i) => <StatMetric key={s.label} item={s} index={i} />)
        }
      </div>
    </section>
  );
});

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Link2, RefreshCw, Coins } from 'lucide-react';
import { useTrustline } from '@/core/hooks/useTrustline';
import { successBurst } from '@/core/lib/animations';
import { useState } from 'react';
import useSWR from 'swr';

export function TrustlineCard({ publicKey }: { publicKey: string }) {
  const { hasTrustline, aetherBalance, aetherLimit, isLoading, isAdding, addTrustline } =
    useTrustline(publicKey);
  const { isValidating } = useSWR(publicKey ? `/api/balance/${publicKey}` : null);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async () => {
    await addTrustline();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 5000);
  };

  const greenPulse = {
    animate: { scale: [1, 1.25, 1], opacity: [1, 0.5, 1] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center gap-4 animate-pulse bg-white">
        <RefreshCw size={20} className="animate-spin text-slate-300" />
        <div className="flex flex-col gap-2 w-full">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!hasTrustline ? (
        <motion.div
          key="warning"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative overflow-hidden bg-white"
        >
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl z-10">
            <AlertCircle size={24} className="text-[var(--aether)]" />
          </div>
          <div className="flex-1 z-10">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wide">Trustline Required</h3>
            <p className="font-body text-[var(--text-secondary)] text-sm mt-1">
              To receive and trade AETH tokens, your wallet must first establish a trustline.
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="btn-aether w-full sm:w-auto px-6 py-3 z-10 disabled:opacity-50 flex items-center justify-center gap-2 font-bold uppercase tracking-wide text-xs cursor-pointer"
          >
            {isAdding ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Link2 size={16} />
                <span>Add Trustline</span>
              </>
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          variants={successBurst}
          initial="initial"
          animate="animate"
          className="glass-card p-6 flex flex-col gap-6 bg-white"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <motion.div 
                  variants={greenPulse}
                  animate="animate"
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
              </div>
              <h3 className="font-display text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">Trustline Active</h3>
            </div>
            <div className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              Limit: {parseFloat(aetherLimit).toLocaleString()} AETH
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-[var(--border-subtle)] pt-5">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Portfolio Balance</span>
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-emerald-500" />
                <span className="font-mono text-3xl font-bold text-[var(--text-primary)] leading-none">
                  {parseFloat(aetherBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
                <span className="font-display text-sm font-bold text-emerald-500 mb-1">AETH</span>
              </div>
            </div>
            <RefreshCw
              size={14}
              className={`text-[var(--text-secondary)] transition-colors cursor-pointer ${isValidating ? 'animate-spin text-[var(--aether)]' : ''}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

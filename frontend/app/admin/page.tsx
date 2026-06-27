'use client';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Loader2, RefreshCw, Coins, Droplets } from 'lucide-react';
import { useFreighter } from '@/core/hooks/useFreighter';
import { BottomNav } from '@/core/components/BottomNav';
import { revealUp, floatUp } from '@/core/lib/animations';

const ADMIN_WALLETS = [
  'GDG6D267U5S3O3O6U2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2', // Example issuer
  'GBY27H725NURXU2OQ75Q75Q75Q75Q75Q75Q75Q75Q75Q75Q75Q75Q75Q', // Local test wallet
];

// --- Subcomponents ---

const MintCard = memo(function MintCard({ publicKey }: { publicKey: string }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const mint = async () => {
    if (!recipient || !amount) {
      setResult({ ok: false, msg: 'Recipient and Amount are required' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/mint', {
        method: 'POST',
        body: JSON.stringify({ recipient, amount, callerPubKey: publicKey }),
      });
      const data = await res.json();
      setResult({ ok: !!data.hash, msg: data.hash ? `Success! Hash: ${data.hash.slice(0, 16)}...` : data.error || 'Mint failed' });
    } catch {
      setResult({ ok: false, msg: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card h-full flex flex-col gap-6 p-8 bg-white shadow-sm border border-[var(--border-subtle)] rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--aether)] border border-blue-100">
          <Coins size={24} />
        </div>
        <div>
          <h2 className="text-base font-display font-bold uppercase tracking-wide text-[var(--text-primary)]">Mint AETH</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Issue new tokens from the protocol reserve</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Recipient</label>
            <button 
              onClick={() => setRecipient(publicKey)}
              className="text-[10px] font-bold text-[var(--aether)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Mint to self
            </button>
          </div>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="G..."
            className="bg-[rgba(0,0,0,0.015)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--text-primary)] focus:border-[var(--aether)] outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-[rgba(0,0,0,0.015)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:border-[var(--aether)] outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={mint}
        disabled={loading}
        className="w-full btn-aether py-4 disabled:opacity-50 flex justify-center cursor-pointer"
      >
        {loading ? <RefreshCw size={20} className="animate-spin mx-auto" /> : 'Execute Mint'}
      </button>

      {result && (
        <div className={`p-4 rounded-xl text-xs font-bold border ${result.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
          {result.msg}
        </div>
      )}
    </div>
  );
});

const PoolStatsCard = memo(function PoolStatsCard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setStats(await (await fetch('/api/pool')).json()); } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="glass-card flex flex-col gap-6 p-8 bg-white shadow-sm border border-[var(--border-subtle)] rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--aether)]">
            <Droplets size={24} />
          </div>
          <h2 className="text-base font-display font-bold uppercase tracking-wide text-[var(--text-primary)]">Pool Status</h2>
        </div>
        <button onClick={refresh} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      {!stats && !loading ? (
        <div className="py-10 text-center text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest">Click refresh to load data</div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'AETH Reserve', val: stats.aetherReserve, unit: 'AETH' },
            { label: 'XLM Reserve', val: stats.xlmReserve, unit: 'XLM' },
            { label: 'Market Price', val: stats.price, unit: 'XLM/AETH' },
            { label: 'LP Count', val: stats.providers, unit: 'Users' },
          ].map((s) => (
            <div key={s.label} className="bg-[rgba(0,0,0,0.015)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">{s.label}</p>
              <p className="text-base font-mono font-bold text-[var(--text-primary)]">{parseFloat(s.val || 0).toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[var(--aether)]">{s.unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// --- Main Page ---

export default function AdminPage() {
  const { isConnected, connect, publicKey, isLoading } = useFreighter();

  if (isLoading) return (
    <main className="min-h-screen bg-transparent flex items-center justify-center p-6">
      <Loader2 size={36} className="animate-spin text-[var(--aether)]" />
    </main>
  );

  if (!isConnected) return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <motion.div variants={revealUp} initial="hidden" animate="visible" className="glass-card max-w-md w-full text-center flex flex-col items-center gap-8 p-10 bg-white border border-[var(--border-subtle)] shadow-md rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--aether)]">
          <Lock size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">Admin Panel</h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Restricted access area. Connect authorized wallet.</p>
        </div>
        <button className="w-full btn-aether py-4 cursor-pointer" onClick={connect}>
          Connect Authorized Wallet
        </button>
      </motion.div>
    </main>
  );

  return (
    <main className="min-h-screen p-6 pt-28 pb-32">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        <motion.div variants={revealUp} initial="hidden" animate="visible" className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--aether)]">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black uppercase tracking-tight text-[var(--text-primary)]">System Console</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {typeof publicKey === 'string' 
                  ? publicKey 
                  : (publicKey as any)?.address || (publicKey as any)?.publicKey || String(publicKey)}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div variants={floatUp} initial="initial" animate="animate">
            <MintCard publicKey={publicKey} />
          </motion.div>
          <motion.div variants={floatUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
            <PoolStatsCard />
          </motion.div>
        </div>
        
      </div>
      <BottomNav />
    </main>
  );
}

'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, Wallet, CheckCircle2, ExternalLink } from 'lucide-react';
import { useFreighter } from '@/core/hooks/useFreighter';
import { useAetherBalance } from '@/core/hooks/useAetherBalance';
import { usePoolStats } from '@/core/hooks/usePoolStats';
import { useAetherPrice } from '@/core/hooks/useAetherPrice';
import { floatUp, successBurst } from '@/core/lib/animations';
import { useTilt } from '@/core/hooks/useTilt';
import { AnimatedNumber } from '@/core/components/AnimatedNumber';
import { ammVaultContract, signAndSubmit, nativeToScVal, Address } from '@/core/lib/soroban';

export function LiquidityCard() {
  const { isConnected, connect, publicKey } = useFreighter();
  const { aetherBalance, xlmBalance, mutate: mutateAETH } = useAetherBalance(publicKey);
  const { tvl, xlmReserve, aetherReserve, apy, isLoading, mutate: mutatePool } = usePoolStats();
  const { price } = useAetherPrice();
  
  const [tab, setTab] = useState<'add' | 'remove'>('add');
  const [aetherAmt, setAetherAmt] = useState('');
  const [xlmAmt, setXlmAmt] = useState('');
  const [lpAmt, setLpAmt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ txHash: string } | null>(null);

  const { ref: tiltRef, style: tiltStyle, ...tiltHandlers } = useTilt(6);

  const aetherReserveNum = parseFloat(aetherReserve) || 0;
  const xlmReserveNum = parseFloat(xlmReserve) || 0;
  
  const priceVal = parseFloat(price) || 0.05;
  const ratio = (aetherReserveNum > 0 && xlmReserveNum > 0) 
    ? xlmReserveNum / aetherReserveNum 
    : priceVal;

  const handleAetherChange = (v: string) => {
    setAetherAmt(v);
    if (!v) {
      setXlmAmt('');
    } else {
      setXlmAmt((parseFloat(v) * ratio).toFixed(6));
    }
  };

  const handleXlmChange = (v: string) => {
    setXlmAmt(v);
    if (!v) {
      setAetherAmt('');
    } else {
      setAetherAmt((parseFloat(v) / ratio).toFixed(6));
    }
  };

  const submit = async () => {
    if (!isConnected || !publicKey) return connect();
    if (tab === 'add' && (!aetherAmt || parseFloat(aetherAmt) <= 0)) return;
    if (tab === 'remove' && (!lpAmt || parseFloat(lpAmt) <= 0)) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/liquidity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          action: tab,
          aetherAmt,
          xlmAmt,
          lpAmt
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to prepare liquidity transaction');

      // 2. Sign transaction with Freighter
      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(data.xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : (signedResult as any)?.signedTxXdr;

      if (!signedXDR) throw new Error('Signing failed or rejected by user');

      // 3. Submit to Horizon
      const { Horizon, TransactionBuilder } = await import('@stellar/stellar-sdk');
      const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
      const tx = TransactionBuilder.fromXDR(signedXDR, 'Test SDF Network ; September 2015');
      const submitRes = await horizon.submitTransaction(tx as any);
      
      const hash = submitRes.hash;
      setSuccess({ txHash: hash });
      setAetherAmt(''); setXlmAmt(''); setLpAmt('');
      mutateAETH();
      mutatePool();
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message;
      if (e.response?.data?.extras?.result_codes) {
        errMsg = JSON.stringify(e.response.data.extras.result_codes);
      }
      alert("Transaction failed: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto relative">
      {/* APY Badge */}
      <div className="absolute -top-4 -right-4 z-20 bg-white border border-[var(--border-subtle)] rounded-full px-4 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.03)] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--aether)] animate-pulse" />
        <span className="font-mono text-[var(--aether)] font-bold text-xs tracking-wide">{apy}% APY</span>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={successBurst}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card rounded-3xl border border-[var(--aether)] p-10 text-center flex flex-col items-center gap-6 shadow-[0_8px_30px_rgba(37,99,235,0.04)] relative overflow-hidden bg-white"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--aether)] to-transparent" />
            <div className="bg-[var(--aether-dim)] p-4 rounded-full border border-[var(--border-aether)]">
              <CheckCircle2 size={48} className="text-[var(--aether)]" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl font-[800] text-[var(--text-primary)] uppercase">Pool Updated!</h2>
              <p className="font-body text-[var(--text-secondary)]">Liquidity successfully modified on Stellar Soroban.</p>
            </div>
            <a href={`https://stellar.expert/explorer/testnet/tx/${success.txHash}`} target="_blank" className="flex items-center gap-2 text-[var(--aether)] font-bold hover:gap-3 transition-all cursor-pointer text-sm">
              View on Explorer <ExternalLink size={14} />
            </a>
            <button onClick={() => setSuccess(null)} className="mt-4 font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-b border-transparent hover:border-[var(--text-primary)] pb-1 cursor-pointer">
              Back to Pool
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            ref={tiltRef}
            style={tiltStyle}
            {...tiltHandlers}
            variants={floatUp}
            initial="initial"
            animate="animate"
            className="glass-card rounded-3xl border border-[var(--border-subtle)] p-8 shadow-md flex flex-col gap-6 relative z-10 bg-white"
          >
            <div className="flex bg-slate-50 p-1 rounded-full border border-[var(--border-subtle)] relative">
              {(['add', 'remove'] as const).map((t) => {
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-3 text-sm font-display font-[700] uppercase tracking-wide transition-colors relative z-10 rounded-full cursor-pointer ${
                      isActive ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t === 'add' ? 'Add Assets' : 'Remove Assets'}
                    {isActive && (
                      <motion.div
                        layoutId="poolTab"
                        className="absolute inset-0 bg-[var(--aether)] rounded-full -z-10 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                {tab === 'add' ? (
                  <>
                    {/* AETH Input */}
                    <div className="bg-[rgba(0,0,0,0.015)] rounded-2xl border border-[var(--border-subtle)] p-5 focus-within:border-[var(--aether)] transition-all flex flex-col gap-3 relative overflow-hidden group">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">AETH Deposit</span>
                        <button 
                          onClick={() => handleAetherChange(aetherBalance)}
                          className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--aether)] transition-colors cursor-pointer"
                        >
                          Bal: {parseFloat(aetherBalance).toFixed(2)}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="w-8 h-8 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                          <Zap size={14} className="text-[var(--aether)]" />
                        </div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={aetherAmt}
                          onChange={(e) => handleAetherChange(e.target.value)}
                          className="font-mono text-[28px] text-[var(--text-primary)] bg-transparent border-none outline-none w-full placeholder:text-slate-200"
                        />
                      </div>
                    </div>

                    {/* Equal Sign */}
                    <div className="flex justify-center -my-3 z-10 relative">
                      <div className="w-8 h-8 bg-white border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                        <span className="font-mono text-sm font-bold">=</span>
                      </div>
                    </div>

                    {/* XLM Input */}
                    <div className="bg-[rgba(0,0,0,0.015)] rounded-2xl border border-[var(--border-subtle)] p-5 focus-within:border-[var(--aether)] transition-all flex flex-col gap-3 relative overflow-hidden group">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">XLM Deposit</span>
                        <button 
                          onClick={() => handleXlmChange(xlmBalance)}
                          className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--aether)] transition-colors cursor-pointer"
                        >
                          Bal: {parseFloat(xlmBalance).toFixed(2)}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="w-8 h-8 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                          <span className="font-display font-[800] text-sm text-[var(--text-primary)]">X</span>
                        </div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={xlmAmt}
                          onChange={(e) => handleXlmChange(e.target.value)}
                          className="font-mono text-[28px] text-[var(--text-primary)] bg-transparent border-none outline-none w-full placeholder:text-slate-200"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-[rgba(0,0,0,0.015)] rounded-2xl border border-[var(--border-subtle)] p-5 focus-within:border-[var(--aether)] transition-all flex flex-col gap-3">
                    <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">LP Tokens to Withdraw</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={lpAmt}
                      onChange={(e) => setLpAmt(e.target.value)}
                      className="font-mono text-[28px] text-[var(--text-primary)] bg-transparent border-none outline-none w-full mt-2 placeholder:text-slate-200"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="bg-slate-50 rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Your Share After</span>
                <span className="font-mono font-bold text-[var(--aether)]">
                  <AnimatedNumber value={tab === 'add' ? 1.25 : 0.85} suffix="%" decimals={2} />
                </span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-full relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '25%' }}
                  className="absolute top-0 bottom-0 left-0 bg-[var(--aether)]"
                />
              </div>
            </div>

            <button
              onClick={submit}
              disabled={isSubmitting || (tab === 'add' && !aetherAmt) || (tab === 'remove' && !lpAmt)}
              className="w-full mt-2 btn-aether h-[52px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="font-display font-[700] text-base">Processing...</span>
                </>
              ) : isConnected ? (
                <span className="font-display font-[700] text-base">{tab === 'add' ? 'Add Liquidity →' : 'Remove Liquidity →'}</span>
              ) : (
                <>
                  <Wallet size={18} />
                  <span className="font-display font-[700] text-base">Connect Wallet</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

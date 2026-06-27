'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Wallet, CheckCircle2, RefreshCw, Zap, ExternalLink, ChevronDown } from 'lucide-react';
import { useFreighter } from '@/core/hooks/useFreighter';
import { useAetherBalance } from '@/core/hooks/useAetherBalance';
import { useAetherPrice } from '@/core/hooks/useAetherPrice';
import { floatUp, successBurst } from '@/core/lib/animations';
import { useTilt } from '@/core/hooks/useTilt';
import useSWR from 'swr';
import { ammVaultContract, signAndSubmit, nativeToScVal, aetherContract, XLM_CONTRACT, Address } from '@/core/lib/soroban';
import { calcAmountOut, isInsufficientBalance } from '@/core/lib/swapMath';

type Dir = 'AETH_TO_XLM' | 'XLM_TO_AETH';

export function SwapCard() {
  const { isConnected, connect, publicKey } = useFreighter();
  const { aetherBalance, xlmBalance } = useAetherBalance(publicKey);
  const { price, isLoading: priceLoading } = useAetherPrice();
  const { isValidating } = useSWR('/api/price');

  const [dir, setDir] = useState<Dir>('AETH_TO_XLM');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [success, setSuccess] = useState<{ txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { ref: tiltRef, style: tiltStyle, ...tiltHandlers } = useTilt(8);

  const fromToken = dir === 'AETH_TO_XLM' ? 'AETH' : 'XLM';
  const toToken   = dir === 'AETH_TO_XLM' ? 'XLM' : 'AETH';
  const fromBal   = dir === 'AETH_TO_XLM' ? aetherBalance : xlmBalance;
  const priceVal  = parseFloat(price) || 0.05;
  const amountOut = calcAmountOut(amountIn, priceVal, dir);

  const flip = () => {
    setDir((d) => (d === 'AETH_TO_XLM' ? 'XLM_TO_AETH' : 'AETH_TO_XLM'));
    setAmountIn('');
  };

  const doSwap = async () => {
    setError(null);
    if (!isConnected) return connect();
    if (!amountIn || parseFloat(amountIn) <= 0) return;

    // Pre-flight insufficient-balance check — distinct, user-facing, before any broadcast.
    if (isInsufficientBalance(amountIn, fromBal)) {
      setError(`Insufficient ${fromToken} balance — you have ${parseFloat(fromBal || '0').toFixed(4)} ${fromToken}.`);
      return;
    }

    setIsSwapping(true);
    try {
      // 1. Fetch partially signed transaction from backend
      const res = await fetch('/api/execute_swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          dir,
          amountIn,
          amountOut,
          slippage: parseFloat(slippage) / 100
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to prepare execute_swap');

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
      
      setSuccess({ txHash: submitRes.hash });
      setAmountIn('');
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Swap failed';
      // Map common Horizon/Soroban failures to clearer, distinct messages.
      if (/insufficient|underfunded|txINSUFFICIENT/i.test(msg)) {
        setError(`Insufficient balance or fees to complete this swap.`);
      } else if (/reject|denied|declined/i.test(msg)) {
        setError('Signature rejected — the transaction was not signed.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={successBurst}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card rounded-3xl border border-[var(--border-aether)] p-10 text-center flex flex-col items-center gap-6 shadow-[0_8px_30px_rgba(37,99,235,0.04)] relative overflow-hidden bg-white"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--aether)] to-transparent" />
            <div className="bg-[var(--aether-dim)] p-4 rounded-full border border-[var(--border-aether)]">
              <CheckCircle2 size={48} className="text-[var(--aether)]" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl font-[800] text-[var(--text-primary)] uppercase">Swap Confirmed</h2>
              <p className="font-body text-[var(--text-secondary)] text-sm">Successfully executed trade on Stellar Soroban.</p>
            </div>
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${success.txHash}`} 
              target="_blank" 
              className="flex items-center gap-2 text-[var(--aether)] font-bold text-sm hover:gap-3 transition-all cursor-pointer"
            >
              View Transaction <ExternalLink size={14} />
            </a>
            <button 
              onClick={() => setSuccess(null)}
              className="mt-4 font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-b border-transparent hover:border-[var(--text-primary)] pb-1 cursor-pointer"
            >
              Back to Swap
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
            className="glass-card rounded-3xl p-6 shadow-md flex flex-col gap-1 relative z-10 overflow-hidden border border-[var(--border-subtle)] bg-white"
          >
            {/* Top Border Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--aether)] to-transparent opacity-30" />
            
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="font-display text-xl font-[700] text-[var(--text-primary)] tracking-wide">Swap</h2>
              <RefreshCw 
                size={16} 
                className={`text-slate-300 transition-colors cursor-pointer ${isValidating ? 'animate-spin text-[var(--aether)]' : ''}`}
              />
            </div>

            {/* Sell Box */}
            <div className="bg-[rgba(0,0,0,0.015)] rounded-2xl border border-[var(--border-subtle)] p-5 focus-within:border-[var(--aether)] transition-all flex flex-col gap-3 group">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Sell</span>
                <button 
                  onClick={() => setAmountIn(fromBal)}
                  className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--aether)] transition-colors cursor-pointer"
                >
                  Balance: {parseFloat(fromBal).toFixed(4)} {fromToken}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="font-mono text-[28px] text-[var(--text-primary)] bg-transparent border-none outline-none w-full placeholder:text-slate-200"
                />
                <div className="glass-card bg-white rounded-full border border-[var(--border-subtle)] px-4 py-1.5 flex items-center gap-2 hover:border-[var(--aether)] hover:shadow-sm transition-all cursor-pointer">
                  <div className={`w-1.5 h-1.5 rounded-full ${fromToken === 'AETH' ? 'bg-[var(--aether)] animate-pulse' : 'bg-slate-300'}`} />
                  <span className="font-display font-[600] text-sm text-[var(--text-primary)]">{fromToken}</span>
                  <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                </div>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-4 z-20 relative">
              <button
                onClick={flip}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--aether)] hover:text-[var(--aether)] hover:shadow-sm transition-all duration-300 hover:rotate-180 cursor-pointer"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            {/* Buy Box */}
            <div className="bg-[rgba(0,0,0,0.015)] rounded-2xl border border-[var(--border-subtle)] p-5 transition-all flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Buy (Estimated)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-mono text-[28px] w-full ${amountOut ? 'text-[var(--text-primary)]' : 'text-slate-200'}`}>
                  {amountOut || '0.00'}
                </div>
                <div className="glass-card bg-white rounded-full border border-[var(--border-subtle)] px-4 py-1.5 flex items-center gap-2 hover:border-[var(--aether)] hover:shadow-sm transition-all cursor-pointer">
                  <div className={`w-1.5 h-1.5 rounded-full ${toToken === 'AETH' ? 'bg-[var(--aether)] animate-pulse' : 'bg-slate-300'}`} />
                  <span className="font-display font-[600] text-sm text-[var(--text-primary)]">{toToken}</span>
                  <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                </div>
              </div>
            </div>

            {/* Exchange Rate Bar */}
            <div className="mt-4 glass-card rounded-xl p-4 flex justify-between items-center border border-[var(--border-subtle)] bg-slate-50/50">
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">1 {fromToken} = {priceVal.toFixed(6)} {toToken}</span>
              <div className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[var(--aether)] font-mono text-[10px] tracking-wide font-bold">
                {'<'} 1% Fee
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="mt-4 flex flex-col gap-2 px-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Slippage Tolerance</span>
                <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{slippage}%</span>
              </div>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      slippage === val
                        ? 'bg-[var(--aether)] text-white border-[var(--aether)]'
                        : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--aether)]'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
                <div className="flex-1 flex items-center bg-[rgba(0,0,0,0.015)] border border-[var(--border-subtle)] rounded-lg px-2 focus-within:border-[var(--aether)] transition-all">
                  <input
                    type="number"
                    value={['0.1', '0.5', '1.0'].includes(slippage) ? '' : slippage}
                    onChange={(e) => setSlippage(e.target.value || '0.5')}
                    placeholder="Custom"
                    className="w-full bg-transparent border-none outline-none font-mono text-xs text-right pr-1 placeholder:text-slate-300 text-[var(--text-primary)]"
                  />
                  <span className="font-mono text-xs text-[var(--text-secondary)]">%</span>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={doSwap}
              disabled={isSwapping || !amountIn}
              className="w-full mt-6 btn-aether h-[52px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSwapping ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="font-display font-[700] text-base">Swapping...</span>
                </>
              ) : isConnected ? (
                <span className="font-display font-[700] text-base">Swap Now &rarr;</span>
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

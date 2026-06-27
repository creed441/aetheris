'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [copied, setCopied] = useState(false);
  const poolAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || "CA2AUUHXYMHXELDP5WGSKQP3BY65IR4UG3WQEUYMSGPJGFZVPN3OSPDY";
  const shortAddress = `${poolAddress.slice(0, 4)}...${poolAddress.slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(poolAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="mt-auto bg-white border-t border-[var(--border-subtle)] py-6 pb-24 md:pb-6 shadow-[0_-1px_3px_rgba(0,0,0,0.005)]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-[var(--aether)] flex items-center justify-center text-white font-display font-black text-xs">Æ</div>
          <span className="font-display font-[800] uppercase tracking-[0.08em] text-[var(--text-primary)] text-sm">Aetheris</span>
        </Link>

        {/* Center */}
        <div className="flex items-center gap-6 text-[var(--font-mono)] text-sm">
          <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center">Home</Link>
          <Link href="/swap" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center">Swap</Link>
          <Link href="/pool" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center">Pool</Link>
          <Link href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center">Dashboard</Link>
        </div>

        {/* Right */}
        <div className="flex flex-col items-center md:items-end gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--aether)] transition-colors min-h-[44px] cursor-pointer"
            title={poolAddress}
          >
            <span className="font-mono">Vault: {shortAddress}</span>
            {copied ? (
              <span className="text-[var(--aether)] font-bold">✓ Copied!</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
          </button>
          <div className="text-[10px] text-[var(--text-secondary)]">
            Built on Stellar Soroban · MIT License
          </div>
        </div>
      </div>
    </footer>
  );
}

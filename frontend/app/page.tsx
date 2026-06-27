'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Copy, Check, RefreshCw, Droplets, LayoutDashboard, Globe } from 'lucide-react';
import { BottomNav } from '@/core/components/BottomNav';
import { ScrollReveal } from '@/core/components/ScrollReveal';

const CONTRACTS = [
  { name: 'AMM Vault', address: 'CCQZXG3QGFPLRS6LJJ4XALJGUGVNLISYN6BJSVOH57ED6FYJH7KGKXAR' },
  { name: 'Aether Token', address: 'CCHLK4RHSS27U4K6VRIP6QW2N5IGBJJES4GA4CI3RRUGP54G4FH5HL7P' },
  { name: 'Operations Router', address: 'CBMGE6BSHIGBXAUMW32D542POCBMI3DHP7ZZGI6RTGPRECJQA3S5ZFDI' },
  { name: 'Protocol Manager', address: 'GBALPCSLWTTOVYUJ35KSDBOQETFDFAGKMQOYN76OWLY7QCIHLQUHINBS' },
];

const FEATURES = [
  { title: 'Asset Exchange', desc: 'Execute trades between XLM and AETH on-chain with low fees and minimal slippage, powered by Soroban.', href: '/swap', icon: RefreshCw },
  { title: 'AMM Vaults', desc: 'Fund liquidity pools with capital to earn passive yield on volume fees dynamically.', href: '/pool', icon: Droplets },
  { title: 'Analytics Dashboard', desc: 'Track reserves, analyze historical exchange rates, and monitor real-time wallet balances.', href: '/dashboard', icon: LayoutDashboard },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      onClick={handleCopy} 
      className="p-2 rounded-lg bg-[rgba(0,0,0,0.02)] hover:bg-[rgba(0,0,0,0.05)] transition-all text-[var(--text-secondary)] hover:text-[var(--aether)] flex items-center gap-2 border border-[var(--border-subtle)] min-h-[40px] cursor-pointer"
    >
      {copied ? (
        <>
          <Check size={14} className="text-[var(--aether)]" />
          <span className="text-xs font-mono text-[var(--aether)] hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          <span className="text-xs font-mono hidden sm:inline">Copy</span>
        </>
      )}
    </button>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-transparent flex flex-col pt-[72px]">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100svh-72px)] flex items-center overflow-hidden w-full">
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(37,99,235,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.02) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        
        <div className="max-w-7xl mx-auto px-6 w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="flex flex-col items-start justify-center py-20 lg:py-0">
            <ScrollReveal
              animation="fade-up"
              delay={0}
              className="glass-card px-4 py-1.5 rounded-full border border-[var(--border-aether)] mb-8 flex items-center gap-2"
            >
              <Globe size={14} className="text-[var(--aether)]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Stellar Soroban Testnet Sandbox</span>
            </ScrollReveal>
            
            <ScrollReveal
              animation="fade-up"
              delay={100}
              className="flex flex-col gap-2 mb-6"
            >
              <span className="font-display font-[800] text-[40px] md:text-[68px] leading-[1.05] tracking-tight text-[var(--text-primary)]">
                Next-Gen DeFi
              </span>
              <span className="font-display font-[400] text-[32px] md:text-[52px] leading-[1.05] tracking-tight text-[var(--text-secondary)]">
                Liquidity on Stellar.
              </span>
            </ScrollReveal>
            
            <ScrollReveal
              animation="fade-up"
              delay={200}
              className="font-body text-[16px] text-[var(--text-secondary)] max-w-[500px] leading-relaxed mb-10"
            >
              Instant asset exchanges, compound yield vaults, and real-time ledger diagnostics — structured inside a minimal, high-fidelity Fintech framework.
            </ScrollReveal>
            
            <ScrollReveal
              animation="fade-up"
              delay={300}
              className="flex flex-wrap items-center gap-4 mb-12"
            >
              <Link href="/swap" className="btn-aether flex items-center justify-center gap-2 px-8 py-4 text-base min-h-[44px]">
                Launch Terminal <ArrowRight size={18} />
              </Link>
              <a href="#contracts" className="btn-ghost flex items-center justify-center gap-2 px-8 py-4 text-base min-h-[44px]">
                System Contracts <ArrowUpRight size={18} />
              </a>
            </ScrollReveal>
            
            <ScrollReveal
              animation="fade-up"
              delay={400}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="glass-card px-4 py-2 rounded-lg font-mono text-[11px] font-semibold text-[var(--text-secondary)] border border-[var(--border-subtle)] min-h-[40px] flex items-center">
                3 Contracts Active
              </div>
              <div className="glass-card px-4 py-2 rounded-lg font-mono text-[11px] font-semibold text-[var(--text-secondary)] border border-[var(--border-subtle)] min-h-[40px] flex items-center">
                AMM Vault Pool
              </div>
              <div className="glass-card px-4 py-2 rounded-lg font-mono text-[11px] font-semibold text-[var(--aether)] border border-[var(--border-aether)] bg-[var(--aether-dim)] min-h-[40px] flex items-center">
                Testnet Sandbox
              </div>
            </ScrollReveal>
          </div>
          
          {/* Abstract Visual (Desktop Only) */}
          <div className="hidden lg:flex items-center justify-center relative w-full h-[500px]">
            <div className="absolute w-[360px] h-[360px] rounded-full border border-[var(--border-subtle)] bg-[rgba(37,99,235,0.01)] shadow-[0_4px_30px_rgba(0,0,0,0.01)] animate-float" style={{ animationDuration: '8s' }}>
              <div className="absolute inset-8 rounded-full border border-[var(--border-subtle)] border-dashed animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-[60px] rounded-full border border-[var(--border-aether)] flex flex-col items-center justify-center backdrop-blur-[1px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <span className="font-display font-black text-6xl text-[var(--text-primary)]">Æ</span>
                <span className="font-mono text-[10px] font-bold text-[var(--aether)] tracking-widest uppercase mt-2">Aetheris</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="font-display font-[800] text-[36px] tracking-tight text-[var(--text-primary)] mb-4">
              Protocol Services
            </h2>
            <div className="w-[32px] h-[2.5px] bg-[var(--aether)] rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal
                  key={feature.title}
                  animation="fade-up"
                  delay={i * 100}
                  className="glass-card p-8 rounded-2xl border border-[var(--border-subtle)] flex flex-col items-start transition-all duration-350 hover:-translate-y-1 hover:border-[var(--aether)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.04)] group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--aether-dim)] border border-[var(--border-aether)] flex items-center justify-center mb-6 group-hover:bg-[var(--aether)] group-hover:text-white text-[var(--aether)] transition-all duration-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display font-[700] text-xl text-[var(--text-primary)] mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-body text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8 flex-grow">
                    {feature.desc}
                  </p>
                  <Link href={feature.href} className="flex items-center gap-2 text-[var(--aether)] font-bold text-sm hover:gap-3 transition-all min-h-[44px]">
                    Access Module <ArrowRight size={14} />
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contracts Section */}
      <section id="contracts" className="py-24 px-6 relative z-10 bg-white border-t border-[var(--border-subtle)] shadow-[0_-1px_3px_rgba(0,0,0,0.01)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-12 text-center">
            <h2 className="font-display font-[800] text-[32px] tracking-tight text-[var(--text-primary)] mb-3">
              Deployments
            </h2>
            <p className="font-body text-sm text-[var(--text-secondary)]">
              Verifiable cryptographic addresses active on the Soroban Testnet sandbox.
            </p>
          </div>
          
          <ScrollReveal
            animation="fade-up"
            delay={0}
            className="glass-card rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-sm bg-white"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-slate-50/50">
                    <th className="py-4 px-6 font-display text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Module ID</th>
                    <th className="py-4 px-6 font-display text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">On-Chain Identity</th>
                    <th className="py-4 px-6 font-display text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {CONTRACTS.map((contract) => (
                    <tr key={contract.name} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-display font-semibold text-[14px] text-[var(--text-primary)]">{contract.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-[13px] text-[var(--text-secondary)] truncate max-w-[150px] sm:max-w-none group cursor-default relative">
                          <span className="sm:hidden">{contract.address.slice(0, 6)}...{contract.address.slice(-6)}</span>
                          <span className="hidden sm:inline">{contract.address}</span>
                          <div className="sm:hidden absolute left-0 -top-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl text-[var(--text-primary)] font-mono text-[10px]">
                            {contract.address}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end">
                          <CopyButton text={contract.address} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="pb-20 md:pb-0">
        <BottomNav />
      </div>
    </main>
  );
}

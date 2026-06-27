'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet, Activity, RefreshCw } from 'lucide-react';
import { useFreighter } from '@/core/hooks/useFreighter';
import { useContractEvents } from '@/core/hooks/useContractEvents';
import { drawerUp } from '@/core/lib/animations';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/swap', label: 'Swap' },
  { href: '/pool', label: 'Pool' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, connect, disconnect, publicKey, isLoading } = useFreighter();
  const { events } = useContractEvents();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    initial: { y: -10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`fixed top-0 left-0 w-full z-50 h-[72px] transition-all duration-300 ${
        scrolled 
          ? 'bg-[rgba(255,255,255,0.85)] backdrop-blur-[12px] border-b border-[var(--border-subtle)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--aether)] flex items-center justify-center text-white font-display font-black text-sm">Æ</div>
          <span className="font-display font-[800] uppercase tracking-[0.08em] text-[var(--text-primary)] text-base md:text-lg">Aetheris</span>
        </Link>

        {/* Center: Desktop Nav */}
        <motion.div 
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="hidden md:flex items-center gap-2"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <motion.div key={href} variants={itemVariants} className="flex items-center">
                <Link
                  href={href}
                  className={`nav-link px-4 py-2 text-sm font-semibold transition-all ${
                    active 
                      ? 'active' 
                      : ''
                  }`}
                >
                  {label}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Activity Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-[rgba(0,0,0,0.02)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-full">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-[var(--aether)]"
            />
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
              <Activity size={10} className="text-[var(--text-secondary)]" />
              {events.length} Events
            </span>
          </div>

          {/* Freighter Button */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isLoading}
            title={isConnected ? 'Click to disconnect' : 'Connect Freighter wallet'}
            className="group hidden md:flex items-center gap-2 btn-aether px-4 py-2.5 disabled:opacity-50 min-h-[40px] cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : isConnected ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse group-hover:hidden" />
                <span className="text-sm font-mono font-bold">
                  {typeof publicKey === 'string' && publicKey.length > 5
                    ? `${publicKey.slice(0, 5)}...${publicKey.slice(-4)}`
                    : 'Connected'}
                </span>
                <span className="hidden group-hover:inline text-sm font-bold">· Disconnect</span>
              </>
            ) : (
              <>
                <Wallet size={14} />
                <span className="text-sm">Connect Wallet</span>
              </>
            )}
          </button>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.02)] rounded-lg transition-colors cursor-pointer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={drawerUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-[72px] left-0 w-full bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] z-40 md:hidden shadow-lg"
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`nav-link flex items-center min-h-[44px] text-[15px] font-display font-semibold py-2.5 px-4 rounded-xl transition-all ${
                      active 
                        ? 'active bg-[var(--aether-dim)] border border-[var(--border-aether)]' 
                        : 'border border-transparent hover:bg-[rgba(0,0,0,0.015)]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={() => { isConnected ? disconnect() : connect(); setMobileOpen(false); }}
                className="mt-2 w-full btn-aether py-3.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : isConnected ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="font-mono font-bold">
                      {typeof publicKey === 'string' && publicKey.length > 5
                        ? `${publicKey.slice(0, 5)}...${publicKey.slice(-4)} · Disconnect`
                        : 'Disconnect'}
                    </span>
                  </>
                ) : (
                  <>
                    <Wallet size={16} />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

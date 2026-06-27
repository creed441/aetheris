'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ArrowUpDown, Droplets, BarChart3 } from 'lucide-react';
import { tabIndicator } from '@/core/lib/animations';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/swap', label: 'Swap', icon: ArrowUpDown },
  { href: '/pool', label: 'Pool', icon: Droplets },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-white border-t border-[var(--border-subtle)] rounded-none rounded-t-2xl shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center justify-center gap-1 w-full h-full group cursor-pointer">
              <Icon 
                size={18} 
                className={`transition-all duration-300 ${active ? 'text-[var(--aether)] scale-110' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:scale-105'}`} 
              />
              <span className={`text-[9px] font-display font-bold uppercase tracking-wider transition-colors duration-300 ${active ? 'text-[var(--aether)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {label}
              </span>
              
              {active && (
                <div className="absolute -bottom-1 flex flex-col items-center">
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    variants={tabIndicator}
                    initial="initial"
                    animate="animate"
                    className="w-8 h-[2.5px] bg-[var(--aether)] rounded-t-full shadow-[0_1px_4px_rgba(37,99,235,0.4)]"
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

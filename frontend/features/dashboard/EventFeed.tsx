'use client';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { useContractEvents, ContractEvent } from '@/core/hooks/useContractEvents';
import { listContainer, listItem, accentPulse } from '@/core/lib/animations';
import useSWR from 'swr';

const EVENT_COLORS: Record<ContractEvent['type'], string> = {
  mint:      'bg-emerald-400',
  burn:      'bg-rose-400',
  execute_swap:      'bg-blue-400',
  liquidity: 'bg-violet-400',
  trustline: 'bg-sky-400',
  fee:       'bg-amber-400',
};

const EventRow = memo(function EventRow({ event }: { event: ContractEvent }) {
  return (
    <motion.div
      variants={listItem}
      className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${EVENT_COLORS[event.type]} shadow-sm`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800 capitalize">{event.type}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
            #{event.ledger}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono font-bold text-slate-500">
            {parseFloat(event.amount || '0').toLocaleString(undefined, { maximumFractionDigits: 4 })} AETH
          </span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className="text-[10px] text-slate-400 font-medium">
            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <a
        href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-300 hover:text-[var(--aether)] transition-colors p-2 cursor-pointer"
      >
        <ExternalLink size={14} />
      </a>
    </motion.div>
  );
});

export const EventFeed = memo(function EventFeed() {
  const { events, isLoading, isError } = useContractEvents();
  const { isValidating } = useSWR('/api/events');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-slate-400" />
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Live Events</h2>
          <motion.div {...accentPulse} className="w-1.5 h-1.5 rounded-full bg-[var(--aether)]" />
        </div>
        
        <div className="flex items-center gap-3">
          <RefreshCw
            size={14}
            className={`text-slate-300 transition-colors cursor-pointer ${isValidating ? 'animate-spin text-[var(--aether)]' : ''}`}
          />
          <select className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wide px-2 py-1 outline-none focus:border-[var(--aether)] transition-colors">
            <option>All Events</option>
            <option>Swaps</option>
            <option>Liquidity</option>
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto max-h-[350px] min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <RefreshCw size={28} className="animate-spin text-[var(--aether)]" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching events...</span>
          </div>
        ) : isError ? (
          <div className="py-20 text-center">
            <span className="text-sm font-bold text-rose-400">Failed to load live feed</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <RefreshCw size={28} className="animate-spin text-slate-200" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waiting for events...</span>
          </div>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            {events.slice(0, 15).map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Footer / Fade */}
      <div className="h-8 bg-gradient-to-t from-white to-transparent pointer-events-none absolute bottom-0 left-0 w-full" />
    </div>
  );
});

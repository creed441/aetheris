'use client';
import { SWRConfig } from 'swr';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => {
          if (!url.startsWith('/') && !url.startsWith('http')) {
            throw new Error('LOCAL_STATE'); // Throwing prevents SWR from overwriting local state cache
          }
          return fetch(url).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
            return res.json();
          });
        },
        refreshInterval: 5000,
        revalidateOnFocus: true,
        onError: (error: Error, key: string) => {
          if (error.message === 'LOCAL_STATE') return;
          console.error(`[SWR] ${key}:`, error.message);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};

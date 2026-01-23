'use client';

import dynamic from 'next/dynamic';

// Dynamically import GlobalBackground with SSR disabled
// Three.js requires a browser environment
const GlobalBackground = dynamic(
  () => import('./GlobalBackground').then((mod) => mod.GlobalBackground),
  {
    ssr: false,
    loading: () => (
      // Static fallback while loading
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, hsl(217 91% 50% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, hsl(258 90% 55% / 0.08) 0%, transparent 50%),
            hsl(233 10% 4%)
          `,
        }}
      />
    ),
  }
);

export function GlobalBackgroundDynamic() {
  return <GlobalBackground />;
}

export default GlobalBackgroundDynamic;

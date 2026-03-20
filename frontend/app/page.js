'use client';

import dynamic from 'next/dynamic';

// Disable Server-Side Rendering (SSR) for Web3 components
// This prevents "window is not defined" crashes because Freighter API requires the browser 'window' object.
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-slate">
      <Navbar />
      <Dashboard />
    </div>
  );
}

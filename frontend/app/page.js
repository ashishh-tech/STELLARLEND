'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isConnected, getAddress } from '@stellar/freighter-api';

// Disable Server-Side Rendering (SSR) for Web3 components
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const Landing = dynamic(() => import('@/components/Landing'), { ssr: false });

export default function Home() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connResult = await isConnected();
        const connected = connResult?.isConnected ?? connResult;
        if (connected) {
          const addrResult = await getAddress();
          const addr = addrResult?.address ?? addrResult;
          if (addr && typeof addr === 'string') {
            setAddress(addr);
          }
        }
      } catch (e) {
        // ignore errors
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-brand-emerald animate-pulse">Loading...</div>;
  }

  return (
    <div className="min-h-screen relative">
      <Navbar 
        address={address} 
        onConnect={(addr) => setAddress(addr)} 
        onDisconnect={() => setAddress(null)} 
      />
      {address ? (
        <Dashboard />
      ) : (
        <Landing onConnect={(addr) => setAddress(addr)} />
      )}
    </div>
  );
}

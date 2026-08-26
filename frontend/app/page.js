'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isConnected, getAddress } from '@stellar/freighter-api';
import { connectWallet } from '@/lib/freighter';

// Disable Server-Side Rendering (SSR) for Web3 components
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const Landing = dynamic(() => import('@/components/Landing'), { ssr: false });
const OnboardingModal = dynamic(() => import('@/components/OnboardingModal'), { ssr: false });
const GrowthReferralModal = dynamic(() => import('@/components/GrowthReferralModal'), { ssr: false });
const FeedbackWidget = dynamic(() => import('@/components/FeedbackWidget'), { ssr: false });

export default function Home() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('app'); // 'app' (Dashboard Terminal) or 'landing' (Hero Showcase)

  // Modal controls
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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

  const handleWalletConnect = async () => {
    const userAddress = await connectWallet();
    if (userAddress) {
      setAddress(userAddress);
      setViewMode('app');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-brand-emerald font-mono animate-pulse">
        Loading StellarLend...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navbar 
        address={address} 
        viewMode={viewMode}
        onToggleView={(mode) => setViewMode(mode)}
        onConnect={(addr) => {
          setAddress(addr);
          setViewMode('app');
        }} 
        onDisconnect={() => setAddress(null)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {viewMode === 'app' ? (
        <Dashboard 
          userAddress={address}
          onConnectWallet={handleWalletConnect}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenReferral={() => setIsReferralOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      ) : (
        <Landing 
          onConnect={(addr) => {
            setAddress(addr);
            setViewMode('app');
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenReferral={() => setIsReferralOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      )}

      {/* Interactive Onboarding Walkthrough */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onConnectWallet={handleWalletConnect}
        isConnected={!!address}
      />

      {/* Referral & Growth Engine */}
      <GrowthReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        address={address}
      />

      {/* Continuous Product Feedback Collector */}
      <FeedbackWidget
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}

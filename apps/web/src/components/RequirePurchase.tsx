import type { ReactNode } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { clerkEnabled } from '../lib/auth';
import { useGameStore } from '../store/useGameStore';
import { Paywall } from './Paywall';
import { LOGO_WORDMARK_DATA_URI } from '../brand';

/**
 * Gate a tool behind purchase.
 * - Local/dev (no Clerk): no gate.
 * - Signed out: prompt sign-in.
 * - Signed in, not purchased: paywall.
 * - Signed in, purchased: render the tool.
 */
export function RequirePurchase({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <>
      <SignedOut>
        <SignInWall />
      </SignedOut>
      <SignedIn>
        <EntitlementGate>{children}</EntitlementGate>
      </SignedIn>
    </>
  );
}

function EntitlementGate({ children }: { children: ReactNode }) {
  const plan = useGameStore((s) => s.plan);
  const planLoaded = useGameStore((s) => s.planLoaded);

  if (!planLoaded) {
    return (
      <Centered>
        <span className="num text-ink-500 text-sm animate-pulse">Checking access…</span>
      </Centered>
    );
  }
  if (plan === 'free') {
    return (
      <Paywall
        reason="Every tool is part of lifetime access. Unlock once, keep it forever."
        onClose={() => window.history.back()}
      />
    );
  }
  return <>{children}</>;
}

function SignInWall() {
  return (
    <Centered>
      <img src={LOGO_WORDMARK_DATA_URI} alt="Poker Logic Lab" className="h-12 mb-7" />
      <h2 className="font-display text-2xl font-semibold mb-2">Members only</h2>
      <p className="text-ink-300 text-sm mb-7 max-w-sm text-center">
        Sign in, then unlock lifetime access to train with every tool in the lab.
      </p>
      <SignInButton mode="modal">
        <button className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
          Sign in to continue
        </button>
      </SignInButton>
      <Link to="/" className="mt-4 text-sm text-ink-500 hover:text-ink-300">
        Back to home
      </Link>
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="min-h-[72vh] flex flex-col items-center justify-center px-4">{children}</div>;
}

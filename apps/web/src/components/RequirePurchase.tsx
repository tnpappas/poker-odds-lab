import type { ReactNode } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { clerkEnabled } from '../lib/auth';
import { useGameStore } from '../store/useGameStore';
import { Paywall } from './Paywall';
import { LOGO_WORDMARK_DATA_URI } from '../brand';

/**
 * Tools that free users can try before buying.
 * The tool's own usage limits (FREE_REPLAY_LIMIT, FREE_BLITZ_LIMIT)
 * handle the paywall after N uses.
 */
const FREE_TOOLS = ['/replay', '/blitz', '/visualizer'];

/**
 * Gate a tool behind purchase.
 * - Local/dev (no Clerk): no gate.
 * - Signed out: let them try free tools; gate the rest.
 * - Signed in, not purchased: let them try free tools (with limits); gate the rest.
 * - Signed in, purchased: render the tool.
 */
export function RequirePurchase({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  const path = window.location.pathname;
  const isFreeTool = FREE_TOOLS.includes(path);

  // Free tools: let anyone in. The tool's own usage limits show the paywall.
  if (isFreeTool) return <>{children}</>;

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
        <span className="num text-ink-500 text-sm animate-pulse">Checking access\u2026</span>
      </Centered>
    );
  }
  if (plan === 'free') {
    return (
      <Paywall
        reason="This tool is part of unlimited access. Go unlimited for $7.99/mo."
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
      <h2 className="font-display text-2xl font-semibold mb-2">This tool is part of unlimited access</h2>
      <p className="text-ink-300 text-sm mb-7 max-w-sm text-center">
        Unlimited access starts at $7.99/mo. It unlocks every tool in the lab, the complete book,
        and new Lab Notes every week.
      </p>
      <Link
        to="/pricing"
        className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition"
      >
        See pricing
      </Link>
      <p className="mt-5 text-sm text-ink-500">
        Already a member?{' '}
        <SignInButton mode="modal" signUpForceRedirectUrl="/pricing">
          <button className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
        </SignInButton>
      </p>
      <Link to="/" className="mt-4 text-sm text-ink-500 hover:text-ink-300">
        Back to home
      </Link>
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="min-h-[72vh] flex flex-col items-center justify-center px-4">{children}</div>;
}

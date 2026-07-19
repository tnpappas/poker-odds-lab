import { useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react';
import { useGameStore } from './store/useGameStore';
import { clerkEnabled } from './lib/auth';
import { api } from './lib/api';
import { BrandMark } from './components/ui';
import { HowToUse } from './components/HowToUse';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { Seo } from './components/Seo';
import { Analytics } from '@vercel/analytics/react';
import { Spade, Heart, Diamond, Club } from './components/icons';

/** Verifies entitlement against the server whenever Clerk auth state changes. */
function PlanSync() {
  const setPlan = useGameStore((s) => s.setPlan);
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setPlan('free');
      return;
    }
    let active = true;
    api.getMe().then((me) => {
      if (active) setPlan(me?.plan ?? 'free');
    });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, setPlan]);
  return null;
}

const NAV = [
  { to: '/visualizer', label: 'Visualizer' },
  { to: '/replay', label: 'Replay' },
  { to: '/blitz', label: 'Blitz' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/icm', label: 'Tournament' },
  { to: '/adversary-lab', label: 'Adversary' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function App() {
  const skillPoints = useGameStore((s) => s.skillPoints);
  const plan = useGameStore((s) => s.plan);

  return (
    <div className="min-h-full flex flex-col">
      {clerkEnabled && <PlanSync />}
      <Seo />
      <Analytics />
      <CheckoutSuccess />
      <header className="sticky top-0 z-30 rail border-b backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" aria-label="Poker Logic Lab home">
            <BrandMark />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition ${
                    isActive
                      ? 'text-brand-400 bg-white/[0.06]'
                      : 'text-ink-300 hover:text-ink-100 hover:bg-white/[0.04]'
                  }`}>
                {n.label}
              </NavLink>
            ))}
            <NavLink to="/guide"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'text-brand-400 bg-white/[0.06]'
                    : 'text-ink-300 hover:text-ink-100 hover:bg-white/[0.04]'
                }`}>
              How it works
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <HowToUse />
            <span className="hidden xs:flex items-center gap-1.5 text-xs text-ink-500">
              <span className="eyebrow !tracking-[0.15em] !text-[0.6rem]">SP</span>
              <span className={`num font-semibold text-sm ${skillPoints >= 0 ? 'text-chip-green' : 'text-chip-red'}`}>
                {skillPoints >= 0 ? '+' : ''}{Math.round(skillPoints)}
              </span>
            </span>
            {plan !== 'free' && (
              <span className="eyebrow !text-[0.6rem] px-2 py-0.5 rounded-full bg-brass-500/15 text-brass-300 border border-brass-400/40">
                Pro
              </span>
            )}
            {clerkEnabled && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-xs px-3.5 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  {plan === 'free' && (
                    <Link to="/replay"
                      className="text-xs px-3.5 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
                      Unlock
                    </Link>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-4">
        <Outlet />
      </main>

      {/* Footer — legal + support links (all screen sizes) */}
      <footer className="mt-16 border-t border-felt-800/60 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <span className="num order-2 sm:order-1">© {new Date().getFullYear()} Poker Logic Lab</span>
          <div className="order-1 sm:order-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/guide" className="hover:text-ink-100 transition">How it works</Link>
            <Link to="/terms" className="hover:text-ink-100 transition">Terms</Link>
            <Link to="/privacy" className="hover:text-ink-100 transition">Privacy</Link>
            <Link to="/refunds" className="hover:text-ink-100 transition">Refunds</Link>
            <a href="mailto:support@pokerlogiclab.com" className="hover:text-ink-100 transition">Support</a>
          </div>
          <span className="order-3 hidden md:flex items-center gap-2 opacity-70">
            <Spade size={12} /><Heart size={12} className="text-oxblood-400" /><Diamond size={12} className="text-brass-400" /><Club size={12} className="text-chip-green" />
          </span>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden sticky bottom-0 z-30 rail border-t backdrop-blur-md grid grid-cols-5 text-[10px]">
        {NAV.slice(0, 5).map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => `py-3 text-center font-medium ${isActive ? 'text-brand-400' : 'text-ink-300'}`}>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

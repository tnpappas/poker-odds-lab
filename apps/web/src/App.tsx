import { NavLink, Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useGameStore } from './store/useGameStore';
import { clerkEnabled } from './lib/auth';
import { BrandMark } from './components/ui';
import { Spade, Heart, Diamond, Club } from './components/icons';

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
      <header className="sticky top-0 z-30 rail border-b backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" aria-label="Poker Logic Lab — home">
            <BrandMark />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition ${
                    isActive
                      ? 'text-brass-300 bg-black/25'
                      : 'text-ink-300 hover:text-ink-100 hover:bg-black/20'
                  }`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
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
                    <button className="text-xs px-3.5 py-1.5 rounded-lg bg-brass-400 text-rail-950 font-semibold hover:bg-brass-300 transition">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
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

      {/* Desktop footer — table inlay + suit rule */}
      <footer className="hidden lg:block mt-16 border-t border-felt-800/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-ink-500">
          <span className="num">© {new Date().getFullYear()} Poker Logic Lab</span>
          <span className="flex items-center gap-2 opacity-70">
            <Spade size={12} /><Heart size={12} className="text-oxblood-400" /><Diamond size={12} className="text-brass-400" /><Club size={12} className="text-chip-green" />
          </span>
          <span className="eyebrow !text-[0.6rem]">Scored on EV, not luck</span>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden sticky bottom-0 z-30 rail border-t backdrop-blur-md grid grid-cols-5 text-[10px]">
        {NAV.slice(0, 5).map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => `py-3 text-center font-medium ${isActive ? 'text-brass-300' : 'text-ink-300'}`}>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

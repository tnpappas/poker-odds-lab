import { NavLink, Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useGameStore } from './store/useGameStore';
import { clerkEnabled } from './lib/auth';

const NAV = [
  { to: '/visualizer', label: 'Visualizer' },
  { to: '/replay', label: 'Replay' },
  { to: '/blitz', label: 'Blitz' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/icm', label: 'Tournament' },
  { to: '/adversary-lab', label: 'Adversary Lab' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function App() {
  const skillPoints = useGameStore((s) => s.skillPoints);
  const plan = useGameStore((s) => s.plan);

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-felt-950/80 border-b border-felt-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold">
            <span className="text-gold-400">♠</span>
            <span>Poker Logic Lab</span>
          </Link>
          <nav className="hidden sm:flex gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-felt-700 text-gold-400' : 'text-ink-300 hover:text-ink-100 hover:bg-felt-800'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-300 hidden xs:inline">SP <span className={`font-bold ${skillPoints >= 0 ? 'text-chip-green' : 'text-chip-red'}`}>{Math.round(skillPoints)}</span></span>
            {plan === 'pro' && <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/40">PRO</span>}
            {clerkEnabled && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-gold-500 text-felt-950 font-semibold hover:bg-gold-400 transition">
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

      {/* Mobile bottom nav */}
      <nav className="sm:hidden sticky bottom-0 z-20 backdrop-blur bg-felt-950/90 border-t border-felt-800 grid grid-cols-4 text-[11px]">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => `py-3 text-center text-xs font-medium ${isActive ? 'text-gold-400' : 'text-ink-300'}`}>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

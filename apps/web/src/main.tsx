// Error tracking first so anything that fails during startup is reported.
import { Sentry } from './lib/sentry';
import { StrictMode, Suspense, lazy, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// Self-hosted variable fonts (no external CDN): display / UI / numeric-mono.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import { LOGO_DATA_URI } from './brand';
import { AuthProvider } from './lib/auth';

// Use the real brand mark as the browser favicon.
{
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = LOGO_DATA_URI;
  document.head.appendChild(link);
}

import { App } from './App';
import { Home } from './pages/Home';
import { RequirePurchase } from './components/RequirePurchase';

// Everything except the landing page is loaded on demand to keep first paint fast.
const Guide = lazy(() => import('./pages/Guide').then((m) => ({ default: m.Guide })));
const Pricing = lazy(() => import('./pages/Pricing').then((m) => ({ default: m.Pricing })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const Legal = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Legal })));
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Blog = lazy(() => import('./pages/Blog').then((m) => ({ default: m.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then((m) => ({ default: m.BlogPost })));
const Visualizer = lazy(() => import('./features/visualizer/Visualizer').then((m) => ({ default: m.Visualizer })));
const Replay = lazy(() => import('./features/replay/Replay').then((m) => ({ default: m.Replay })));
const Blitz = lazy(() => import('./features/blitz/Blitz').then((m) => ({ default: m.Blitz })));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const Calculator = lazy(() => import('./features/calculator/Calculator').then((m) => ({ default: m.Calculator })));
const IcmTrainer = lazy(() => import('./features/icm/IcmTrainer').then((m) => ({ default: m.IcmTrainer })));
const AdversaryLab = lazy(() => import('./features/adversary-lab/AdversaryLab').then((m) => ({ default: m.AdversaryLab })));

function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <span className="num text-ink-500 text-sm animate-pulse">Loading…</span>
    </div>
  );
}

const lazyEl = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;
// Tools are gated behind purchase; their code only loads for entitled users.
const gate = (el: ReactNode) => <RequirePurchase>{lazyEl(el)}</RequirePurchase>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'guide', element: lazyEl(<Guide />) },
      // Public purchase page: the only place a logged-out visitor is asked to buy.
      { path: 'pricing', element: lazyEl(<Pricing />) },
      { path: 'blog', element: lazyEl(<Blog />) },
      { path: 'blog/:slug', element: lazyEl(<BlogPost />) },
      { path: 'terms', element: lazyEl(<Legal doc="terms" />) },
      { path: 'privacy', element: lazyEl(<Legal doc="privacy" />) },
      { path: 'refunds', element: lazyEl(<Legal doc="refunds" />) },
      // Owner-only account tools; intentionally not linked in the nav.
      { path: 'admin', element: lazyEl(<Admin />) },
      // Membership management: plan, cancel, PayPal payment details, delete account.
      { path: 'account', element: lazyEl(<Account />) },
      { path: 'visualizer', element: gate(<Visualizer />) },
      { path: 'replay', element: gate(<Replay />) },
      { path: 'blitz', element: gate(<Blitz />) },
      { path: 'adversary-lab', element: gate(<AdversaryLab />) },
      { path: 'calculator', element: gate(<Calculator />) },
      { path: 'icm', element: gate(<IcmTrainer />) },
      { path: 'dashboard', element: gate(<Dashboard />) },
      // Catch-all: a styled 404 instead of react-router's developer error screen.
      { path: '*', element: lazyEl(<NotFound />) },
    ],
  },
]);

function CrashFallback() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-center px-6">
      <p className="text-lg">Something went wrong on this page.</p>
      <p className="text-ink-500 text-sm">The error has been reported. Reload to try again.</p>
      <button type="button" className="underline text-sm" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

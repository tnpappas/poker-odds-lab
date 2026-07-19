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
const Legal = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Legal })));
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
      { path: 'blog', element: lazyEl(<Blog />) },
      { path: 'blog/:slug', element: lazyEl(<BlogPost />) },
      { path: 'terms', element: lazyEl(<Legal doc="terms" />) },
      { path: 'privacy', element: lazyEl(<Legal doc="privacy" />) },
      { path: 'refunds', element: lazyEl(<Legal doc="refunds" />) },
      { path: 'visualizer', element: gate(<Visualizer />) },
      { path: 'replay', element: gate(<Replay />) },
      { path: 'blitz', element: gate(<Blitz />) },
      { path: 'adversary-lab', element: gate(<AdversaryLab />) },
      { path: 'calculator', element: gate(<Calculator />) },
      { path: 'icm', element: gate(<IcmTrainer />) },
      { path: 'dashboard', element: gate(<Dashboard />) },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);

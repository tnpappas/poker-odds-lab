import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { matchRoutes, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { Home } from './pages/Home';
import { RequirePurchase } from './components/RequirePurchase';

function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <span className="num text-ink-500 text-sm animate-pulse">Loading…</span>
    </div>
  );
}

const lazyEl = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

/**
 * A public page that is loaded on demand but can also be loaded ahead of the
 * first render. Public pages are prerendered to static HTML at build time
 * (scripts/prerender.mjs) so search engines get real content. Preloading the
 * page for the current URL lets the browser swap that HTML for the live app in
 * one step, with no "Loading…" flash in between.
 */
function page<P extends object>(load: () => Promise<ComponentType<P>>) {
  let Ready: ComponentType<P> | null = null;
  const Lazy = lazy(() => load().then((c) => ({ default: c })));
  const preload = () => load().then((c) => { Ready = c; });
  const Page = (props: P) => (Ready ? <Ready {...props} /> : lazyEl(<Lazy {...props} />));
  return { Page, preload };
}

// Everything except the landing page is loaded on demand to keep first paint fast.
const guide = page(() => import('./pages/Guide').then((m) => m.Guide));
const pricing = page(() => import('./pages/Pricing').then((m) => m.Pricing));
const legal = page(() => import('./pages/Legal').then((m) => m.Legal));
const blog = page(() => import('./pages/Blog').then((m) => m.Blog));
const blogPost = page(() => import('./pages/BlogPost').then((m) => m.BlogPost));
const challenge = page(() => import('./pages/Challenge').then((m) => m.Challenge));
const challengeRules = page(() => import('./pages/ChallengeRules').then((m) => m.ChallengeRules));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Visualizer = lazy(() => import('./features/visualizer/Visualizer').then((m) => ({ default: m.Visualizer })));
const Replay = lazy(() => import('./features/replay/Replay').then((m) => ({ default: m.Replay })));
const Blitz = lazy(() => import('./features/blitz/Blitz').then((m) => ({ default: m.Blitz })));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const Calculator = lazy(() => import('./features/calculator/Calculator').then((m) => ({ default: m.Calculator })));
const IcmTrainer = lazy(() => import('./features/icm/IcmTrainer').then((m) => ({ default: m.IcmTrainer })));
const AdversaryLab = lazy(() => import('./features/adversary-lab/AdversaryLab').then((m) => ({ default: m.AdversaryLab })));

// Tools are gated behind purchase; their code only loads for entitled users.
const gate = (el: ReactNode) => <RequirePurchase>{lazyEl(el)}</RequirePurchase>;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'guide', element: <guide.Page />, handle: guide },
      // Public purchase page: the only place a logged-out visitor is asked to buy.
      { path: 'pricing', element: <pricing.Page />, handle: pricing },
      { path: 'blog', element: <blog.Page />, handle: blog },
      { path: 'blog/:slug', element: <blogPost.Page />, handle: blogPost },
      { path: 'challenge', element: <challenge.Page />, handle: challenge },
      { path: 'challenge/rules', element: <challengeRules.Page />, handle: challengeRules },
      { path: 'terms', element: <legal.Page doc="terms" />, handle: legal },
      { path: 'privacy', element: <legal.Page doc="privacy" />, handle: legal },
      { path: 'refunds', element: <legal.Page doc="refunds" />, handle: legal },
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
];

/** Load the code for the page at this URL before rendering it. */
export async function preloadRoute(pathname: string): Promise<void> {
  const matches = matchRoutes(routes, pathname) ?? [];
  await Promise.all(
    matches.map((m) => (m.route.handle as { preload?: () => Promise<void> } | undefined)?.preload?.()),
  );
}

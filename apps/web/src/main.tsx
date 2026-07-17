import { StrictMode } from 'react';
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
import { Guide } from './pages/Guide';
import { Legal } from './pages/Legal';
import { Visualizer } from './features/visualizer/Visualizer';
import { Replay } from './features/replay/Replay';
import { Blitz } from './features/blitz/Blitz';
import { Dashboard } from './features/dashboard/Dashboard';
import { Calculator } from './features/calculator/Calculator';
import { IcmTrainer } from './features/icm/IcmTrainer';
import { AdversaryLab } from './features/adversary-lab/AdversaryLab';
import { RequirePurchase } from './components/RequirePurchase';
import type { ReactNode } from 'react';

// Every tool is gated behind purchase; the landing page stays public.
const gate = (el: ReactNode) => <RequirePurchase>{el}</RequirePurchase>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'guide', element: <Guide /> },
      { path: 'terms', element: <Legal doc="terms" /> },
      { path: 'privacy', element: <Legal doc="privacy" /> },
      { path: 'refunds', element: <Legal doc="refunds" /> },
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

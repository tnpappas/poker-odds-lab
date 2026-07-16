import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// Self-hosted variable fonts (no external CDN): display / UI / numeric-mono.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import { AuthProvider } from './lib/auth';
import { App } from './App';
import { Home } from './pages/Home';
import { Visualizer } from './features/visualizer/Visualizer';
import { Replay } from './features/replay/Replay';
import { Blitz } from './features/blitz/Blitz';
import { Dashboard } from './features/dashboard/Dashboard';
import { Calculator } from './features/calculator/Calculator';
import { IcmTrainer } from './features/icm/IcmTrainer';
import { AdversaryLab } from './features/adversary-lab/AdversaryLab';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'visualizer', element: <Visualizer /> },
      { path: 'replay', element: <Replay /> },
      { path: 'blitz', element: <Blitz /> },
      { path: 'adversary-lab', element: <AdversaryLab /> },
      { path: 'calculator', element: <Calculator /> },
      { path: 'icm', element: <IcmTrainer /> },
      { path: 'dashboard', element: <Dashboard /> },
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

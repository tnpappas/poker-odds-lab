// Error tracking first so anything that fails during startup is reported.
import { Sentry } from './lib/sentry';
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
import { initPixelIfConsented } from './lib/fbpixel';

// Ad measurement loads only if this browser already accepted tracking.
initPixelIfConsented();

// Use the real brand mark as the browser favicon.
{
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = LOGO_DATA_URI;
  document.head.appendChild(link);
}

import { routes, preloadRoute } from './routes';

const router = createBrowserRouter(routes);

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

// Public pages arrive as prerendered HTML. Load the current page's code first so
// the live app replaces that HTML in one step. A failed preload falls back to
// the normal on-demand load.
const mount = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Sentry.ErrorBoundary fallback={<CrashFallback />}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </Sentry.ErrorBoundary>
    </StrictMode>,
  );

preloadRoute(window.location.pathname).then(mount, mount);

// Build-time only. Renders a public page to static HTML so search engines and
// link previews get real content without running JavaScript. Used by
// scripts/prerender.mjs; never loaded in the browser.
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { routes, preloadRoute } from './routes';
import { SITE, metaFor, META_PATHS } from './components/Seo';
import { POSTS } from './content/posts';

/** Pages rendered with their full content. */
export const CONTENT_PATHS = [
  '/', '/guide', '/pricing', '/blog', '/challenge', '/challenge/rules', '/terms', '/privacy', '/refunds',
  ...POSTS.map((p) => `/blog/${p.slug}`),
];

/** Sign-in gated tools: no content to index, but each still gets its own title. */
export const TITLE_ONLY_PATHS = META_PATHS.filter((p) => !CONTENT_PATHS.includes(p));

export { SITE, metaFor };

export async function render(path: string): Promise<string> {
  await preloadRoute(path);
  const { query, dataRoutes } = createStaticHandler(routes);
  const context = await query(new Request(SITE + path));
  if (context instanceof Response) throw new Error(`Unexpected redirect while prerendering ${path}`);
  const router = createStaticRouter(dataRoutes, context);
  return renderToString(
    <AuthProvider>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </AuthProvider>,
  );
}

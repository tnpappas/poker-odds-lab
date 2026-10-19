// Runs after `vite build`. Writes one static HTML file per public page so that
// search engines, link previews and visitors without JavaScript get the real
// content and a page-specific title. The live app still takes over in the
// browser exactly as before.
//
//   dist/index.html            home, prerendered
//   dist/<path>/index.html     every other public page, prerendered
//   dist/app.html              the empty app shell (vercel.json sends the
//                              app-only routes /account and /admin here)
//   dist/404.html              the shell, noindex; Vercel serves it with a
//                              404 status for every unknown URL
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(webRoot, 'dist');
const ssrDir = join(webRoot, 'dist-ssr');

const { render, metaFor, SITE, CONTENT_PATHS, TITLE_ONLY_PATHS } = await import(
  pathToFileURL(join(ssrDir, 'entry-prerender.js')).href
);

const shell = await readFile(join(dist, 'index.html'), 'utf8');
const ROOT = '<div id="root"></div>';
if (!shell.includes(ROOT)) throw new Error('prerender: index.html has no empty #root to fill');

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Swap one tag's value in the <head>; fail loudly if the tag is missing. */
function swap(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`prerender: could not find ${what} in index.html`);
  return html.replace(pattern, replacement);
}

function withHead(html, path) {
  const { title, desc } = metaFor(path);
  const url = SITE + path;
  const meta = (key, name, value) =>
    swap(html, new RegExp(`(<meta\\s+${key}="${name}"\\s+content=")[^"]*(")`), (_m, a, b) => a + attr(value) + b, name);
  html = swap(html, /<title>[^<]*<\/title>/, () => `<title>${attr(title)}</title>`, 'title');
  html = swap(html, /(<link rel="canonical" href=")[^"]*(")/, (_m, a, b) => a + url + b, 'canonical');
  html = meta('name', 'description', desc);
  html = meta('property', 'og:title', title);
  html = meta('property', 'og:description', desc);
  html = meta('property', 'og:url', url);
  html = meta('name', 'twitter:title', title);
  html = meta('name', 'twitter:description', desc);
  return html;
}

async function writePage(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, ...path.split('/').filter(Boolean), 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

// The untouched shell is the fallback for every URL that is not prerendered.
await writeFile(join(dist, 'app.html'), shell);

// dist/404.html: Vercel serves this with a real 404 status for any URL that is
// not a static file or one of the app-only routes rewritten in vercel.json
// (TRO-31). It boots the same app, which renders the NotFound page. It is
// marked noindex and has no canonical so search engines drop unknown URLs.
const notFound = shell
  .replace(/<title>[^<]*<\/title>/, '<title>Page not found · Poker Logic Lab</title>')
  .replace(/\s*<link rel="canonical"[^>]*>/, '')
  .replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
if (notFound.includes('rel="canonical"') || !notFound.includes('noindex')) {
  throw new Error('prerender: could not build 404.html from the shell');
}
await writeFile(join(dist, '404.html'), notFound);

const titles = new Map();
for (const path of CONTENT_PATHS) {
  const body = await render(path);
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // A page that renders nothing is the bug this script exists to prevent.
  if (!/<h1[\s>]/.test(body) || text.length < 400) {
    throw new Error(`prerender: ${path} rendered no real content (${text.length} characters of text)`);
  }
  await writePage(path, withHead(shell, path).replace(ROOT, `<div id="root">${body}</div>`));
  titles.set(path, metaFor(path).title);
  console.log(`prerendered ${path} (${text.length} chars)`);
}
for (const path of TITLE_ONLY_PATHS) {
  await writePage(path, withHead(shell, path));
  titles.set(path, metaFor(path).title);
  console.log(`titled      ${path}`);
}

const seen = new Map();
for (const [path, title] of titles) {
  if (seen.has(title)) throw new Error(`prerender: ${path} and ${seen.get(title)} share the title "${title}"`);
  seen.set(title, path);
}

await rm(ssrDir, { recursive: true, force: true });
console.log(`prerender: ${titles.size} pages written`);

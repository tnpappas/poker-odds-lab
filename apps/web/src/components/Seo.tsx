import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPost } from '../content/posts';

const SITE = 'https://pokerlogiclab.com';

const DEFAULT = {
  title: 'Poker Logic Lab · Train your poker decisions',
  desc: 'Stop losing to better math. A poker decision-training app that teaches you to read opponents and make profitable calls, folds, and raises. Scored on EV, not luck.',
};

const META: Record<string, { title: string; desc: string }> = {
  '/': DEFAULT,
  '/guide': {
    title: 'How it works | Poker Logic Lab',
    desc: 'New to poker? A plain-English guide to equity, pot odds, EV, ranges, and reading opponents, plus what every tool in the lab does.',
  },
  '/blog': {
    title: 'Lab Notes: Poker Strategy in Plain English | Poker Logic Lab',
    desc: 'Short, practical breakdowns of the poker math and reads that actually move your win rate. Pot odds, equity, EV, ranges, and more, in plain English.',
  },
  '/visualizer': {
    title: 'Equity Visualizer | Poker Logic Lab',
    desc: 'See every starting hand colored by equity and watch your win odds change as you set an opponent’s range.',
  },
  '/replay': {
    title: 'Hand Replay | Poker Logic Lab',
    desc: 'Replay real hands, read the range, and make the call. Scored on EV, not luck.',
  },
  '/blitz': {
    title: 'Mental Math Blitz | Poker Logic Lab',
    desc: '30-second pot odds and EV sprints to build fast, table-ready instincts.',
  },
  '/calculator': {
    title: 'Equity Calculator | Poker Logic Lab',
    desc: 'Your hand vs any range on any board, plus the answer on whether the price is right.',
  },
  '/icm': {
    title: 'Tournament Lab (ICM) | Poker Logic Lab',
    desc: 'Push/fold and ICM training for the spots that decide tournaments.',
  },
  '/adversary-lab': {
    title: 'Adversary Lab | Poker Logic Lab',
    desc: 'Model a real opponent from six behavioral reads and train against exactly how they play.',
  },
  '/dashboard': {
    title: 'EV Dashboard | Poker Logic Lab',
    desc: 'Track your decision quality over time and get your poker leaks diagnosed automatically.',
  },
  '/terms': { title: 'Terms of Service | Poker Logic Lab', desc: 'The terms for using Poker Logic Lab.' },
  '/privacy': { title: 'Privacy Policy | Poker Logic Lab', desc: 'What Poker Logic Lab collects, why, and your choices.' },
  '/refunds': { title: 'Refund Policy | Poker Logic Lab', desc: 'Our simple 14-day money-back guarantee.' },
};

function upsertMeta(selector: string, create: () => HTMLElement, content: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Updates the document title and meta tags on every route change (client-side SEO). */
export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    let m = META[pathname] ?? DEFAULT;
    // Individual blog posts: pull title/description from the post itself.
    if (pathname.startsWith('/blog/')) {
      const post = getPost(pathname.slice('/blog/'.length));
      if (post) m = { title: post.title, desc: post.description };
    }
    const url = SITE + pathname;

    document.title = m.title;
    upsertMeta('meta[name="description"]', () => met('name', 'description'), m.desc);
    upsertMeta('meta[property="og:title"]', () => met('property', 'og:title'), m.title);
    upsertMeta('meta[property="og:description"]', () => met('property', 'og:description'), m.desc);
    upsertMeta('meta[property="og:url"]', () => met('property', 'og:url'), url);
    upsertMeta('meta[name="twitter:title"]', () => met('name', 'twitter:title'), m.title);
    upsertMeta('meta[name="twitter:description"]', () => met('name', 'twitter:description'), m.desc);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [pathname]);

  return null;
}

function met(attr: 'name' | 'property', value: string): HTMLMetaElement {
  const el = document.createElement('meta');
  el.setAttribute(attr, value);
  return el;
}

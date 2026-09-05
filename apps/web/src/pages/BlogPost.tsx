import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SignInButton } from '@clerk/clerk-react';
import { Spade } from '../components/icons';
import { getPost, splitBody } from '../content/posts';
import { clerkEnabled } from '../lib/auth';
import { useGameStore } from '../store/useGameStore';

/**
 * Whether the current visitor can read gated Lab Notes.
 * - Local/dev (no Clerk): everything is readable.
 * - Otherwise: entitlement comes from the store, which PlanSync (App.tsx)
 *   re-verifies against the server on every auth change. Signed-out visitors
 *   are set to 'free' there.
 * Returns null while the check is still in flight so we do not flash the wall.
 */
function useCanReadGated(): boolean | null {
  const plan = useGameStore((s) => s.plan);
  const planLoaded = useGameStore((s) => s.planLoaded);
  if (!clerkEnabled) return true;
  if (!planLoaded) return null;
  return plan !== 'free';
}

export function BlogPost() {
  const reduce = useReducedMotion();
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;
  const canRead = useCanReadGated();

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-16 pb-24 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Post not found</h1>
        <p className="text-ink-300 mt-3">That article does not exist, or the link is out of date.</p>
        <Link to="/blog" className="inline-block mt-6 text-brand-400 font-medium hover:text-brand-300">
          ← Back to all posts
        </Link>
      </div>
    );
  }

  const { teaser, gated } = splitBody(post);
  const showWall = gated !== null && canRead === false;
  const showGated = gated !== null && canRead === true;

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 pt-10">
      <Link to="/blog" className="text-sm text-ink-500 hover:text-ink-300 transition">← All posts</Link>

      <div className="flex items-center gap-3 text-xs text-ink-500 mt-6 mb-3">
        {post.access === 'free' ? (
          <span className="px-2 py-0.5 rounded-full border border-felt-700 text-ink-300">Free</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-400">Lifetime members</span>
        )}
        <span aria-hidden>·</span>
        <span>{post.readingTime}</span>
      </div>

      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.06]">
        {post.heading}
      </motion.h1>

      <div className="inlay my-8" />

      {/* Trusted, first-party HTML authored in content/posts.ts */}
      <div className="article" dangerouslySetInnerHTML={{ __html: teaser }} />

      {showGated && (
        <div className="article" dangerouslySetInnerHTML={{ __html: gated }} />
      )}

      {gated !== null && canRead === null && (
        <p className="num text-ink-500 text-sm animate-pulse mt-8">Checking access…</p>
      )}

      {showWall && <MemberWall />}

      {/* End CTA */}
      <div className="inlay my-10" />
      <div className="felt-card rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Train this until it is automatic</h2>
        <p className="text-ink-300 mt-2 text-sm max-w-md mx-auto leading-relaxed">
          Poker Logic Lab drills pot odds, equity, and reads until the math is instant. Scored on your decisions, not your luck.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/guide"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
            <Spade size={16} /> See how it works
          </Link>
          <Link to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-felt-700 text-ink-100 hover:border-brand-400/70 transition">
            More posts
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Shown in place of the gated half of a members post. */
function MemberWall() {
  return (
    <div className="relative mt-2">
      {/* Fade hinting there is more below */}
      <div aria-hidden className="pointer-events-none absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-felt-950" />
      <div className="rounded-2xl bg-gradient-to-b from-felt-800 to-felt-950 border border-gold-500/40 p-8 text-center">
        <div className="text-gold-400 text-xs uppercase tracking-widest mb-2">Lifetime members only</div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">The rest of this Lab Note is dealt to members</h2>
        <p className="text-ink-300 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          One payment unlocks every Lab Note, every tool in the lab, and the complete book,
          Playing Online Texas Hold&rsquo;em. New Lab Notes are dealt regularly.
        </p>
        <Link to="/pricing"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
          <Spade size={16} /> Continue reading with lifetime access
        </Link>
        <p className="mt-5 text-sm text-ink-500">
          Already a member?{' '}
          <SignInButton mode="modal" signUpForceRedirectUrl="/pricing">
            <button className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
          </SignInButton>
        </p>
      </div>
    </div>
  );
}

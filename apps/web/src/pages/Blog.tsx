import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Eyebrow } from '../components/ui';
import { postsByDate } from '../content/posts';

export function Blog() {
  const reduce = useReducedMotion();
  const posts = postsByDate();
  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 pb-24 pt-10">
      <Eyebrow>Lab Notes</Eyebrow>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.03]">
        Poker strategy, in plain English
      </motion.h1>
      <p className="text-ink-300 mt-5 max-w-2xl leading-relaxed">
        Short, practical breakdowns of the math and reads that actually move your win rate. No jargon, no fluff.
      </p>
      <p className="text-gold-400 mt-3 text-sm font-medium">
        New Lab Notes are dealt regularly to members.{' '}
        <Link to="/pricing" className="underline underline-offset-2 hover:text-ink-100">
          See what is included
        </Link>
      </p>

      <div className="inlay my-10" />

      <div className="space-y-4">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`}
            className="block felt-card rounded-2xl p-6 transition hover:border-brand-400/60">
            <div className="flex items-center gap-3 text-xs text-ink-500 mb-2">
              {p.access === 'free' ? (
                <span className="px-2 py-0.5 rounded-full border border-felt-700 text-ink-300">Free</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-400">Members</span>
              )}
              <span aria-hidden>·</span>
              <span>{p.readingTime}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{p.heading}</h2>
            <p className="text-ink-300 mt-2 text-sm leading-relaxed">{p.description}</p>
            <span className="inline-block mt-3 text-sm text-brand-400 font-medium">Read the breakdown →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

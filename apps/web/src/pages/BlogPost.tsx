import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Spade } from '../components/icons';
import { getPost } from '../content/posts';

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPost() {
  const reduce = useReducedMotion();
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

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

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 pt-10">
      <Link to="/blog" className="text-sm text-ink-500 hover:text-ink-300 transition">← All posts</Link>

      <div className="flex items-center gap-3 text-xs text-ink-500 mt-6 mb-3">
        <span className="num">{formatDate(post.date)}</span>
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
      <div className="article" dangerouslySetInnerHTML={{ __html: post.body }} />

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

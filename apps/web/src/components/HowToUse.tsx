import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOL_HELP_BY_PATH } from './toolHelp';

/**
 * A small "How to use" button that appears only on tool routes and opens a
 * short, beginner-friendly explainer for that specific tool.
 */
export function HowToUse() {
  const { pathname } = useLocation();
  const help = TOOL_HELP_BY_PATH[pathname];
  const [open, setOpen] = useState(false);

  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-felt-700 text-ink-300 hover:text-ink-100 hover:border-brand-400/60 transition">
        <span aria-hidden className="grid place-items-center h-4 w-4 rounded-full border border-current text-[10px] leading-none">?</span>
        How to use
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="felt-card rounded-2xl max-w-lg w-full p-6 my-8">
              <div className="flex items-center gap-3 mb-1">
                <help.Pip size={22} className={help.pipClass} />
                <h2 className="font-display text-2xl font-semibold tracking-tight">{help.title}</h2>
              </div>
              <p className="text-ink-100/90 text-[15px] leading-relaxed mt-2">{help.what}</p>

              <span className="eyebrow block mt-5">How to use it</span>
              <ol className="mt-2 space-y-2">
                {help.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-300 leading-relaxed">
                    <span className="num text-brand-400 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-sm text-ink-500">
                <span className="text-ink-300 font-medium">What you learn: </span>
                {help.learn}
              </p>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-felt-700">
                <Link to="/guide" onClick={() => setOpen(false)} className="text-sm text-brand-400 hover:text-brand-300">
                  New to poker? Read the full guide
                </Link>
                <button onClick={() => setOpen(false)} className="text-sm text-ink-500 hover:text-ink-300">
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

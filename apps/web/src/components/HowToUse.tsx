import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOL_HELP_BY_PATH, type HelpItem } from './toolHelp';

type Tab = 'screen' | 'steps' | 'numbers';

const TABS: { id: Tab; label: string }[] = [
  { id: 'screen', label: 'On screen' },
  { id: 'steps', label: 'How to use' },
  { id: 'numbers', label: 'The numbers' },
];

/**
 * A "How to use" button placed on each tool page. Opens a three-tab panel
 * explaining what is on the screen, how to use the tool, and what each number
 * means. Content lives in toolHelp.ts. Pass `path` to pick the tool explicitly;
 * otherwise the current route is used.
 */
export function HowToUse({ path, className = '' }: { path?: string; className?: string }) {
  const { pathname } = useLocation();
  const help = TOOL_HELP_BY_PATH[path ?? pathname];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('screen');

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!help) return null;

  const openPanel = () => {
    setTab('screen');
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gold-500/60 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 hover:border-gold-500 transition ${className}`}>
        <span aria-hidden className="grid place-items-center h-5 w-5 rounded-full border border-current text-[11px] leading-none">?</span>
        How to Use
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`How to use ${help.title}`}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="felt-card text-left rounded-2xl max-w-2xl w-full my-6 flex flex-col max-h-[calc(100vh-3rem)]">
              {/* Header */}
              <div className="p-5 sm:p-6 pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <help.Pip size={22} className={`${help.pipClass} shrink-0`} />
                    <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">How to use {help.title}</h2>
                  </div>
                  <button onClick={() => setOpen(false)} aria-label="Close"
                    className="shrink-0 text-ink-500 hover:text-ink-100 text-xl leading-none px-1">✕</button>
                </div>
                <p className="text-ink-100/90 text-[15px] leading-relaxed mt-3">{help.what}</p>

                <div className="flex gap-1 mt-5 border-b border-felt-700">
                  {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex-1 sm:flex-none whitespace-nowrap px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition ${
                        tab === t.id ? 'border-gold-500 text-gold-400' : 'border-transparent text-ink-500 hover:text-ink-300'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto">
                {tab === 'screen' && <ItemList items={help.screen} />}
                {tab === 'steps' && (
                  <ol className="space-y-3">
                    {help.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-ink-300 leading-relaxed">
                        <span className="num text-gold-400 font-semibold shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {tab === 'numbers' && <ItemList items={help.numbers} />}

                <p className="mt-5 rounded-xl bg-felt-950/60 p-3 text-sm text-ink-300 leading-relaxed">
                  <span className="text-gold-400 font-semibold">What you learn: </span>
                  {help.learn}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-felt-700">
                <Link to="/guide" onClick={() => setOpen(false)} className="text-sm text-brand-400 hover:text-brand-300">
                  New to poker? Read the full guide
                </Link>
                <button onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gold-500 text-felt-950 text-sm font-bold hover:bg-gold-400 transition">
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

function ItemList({ items }: { items: HelpItem[] }) {
  return (
    <dl className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl bg-felt-950/60 p-3">
          <dt className="text-sm font-semibold text-ink-100">{it.label}</dt>
          <dd className="text-sm text-ink-300 leading-relaxed mt-0.5">{it.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

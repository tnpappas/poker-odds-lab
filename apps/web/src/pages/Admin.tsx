import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Plan } from '../lib/api';

/**
 * Owner-only account tools, reachable at /admin (not linked in the nav).
 *
 * Unlocks an account by email so a customer whose payment failed to grant
 * access can be fixed in one click instead of a hand-written SQL update.
 * The server checks ownership too, so this page being reachable proves nothing.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Admin() {
  const [access, setAccess] = useState<'checking' | 'owner' | 'denied'>('checking');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Poll rather than assume: Clerk may not have loaded on first paint.
  useEffect(() => {
    let active = true;
    (async () => {
      for (const delay of [0, 800, 1600, 3000]) {
        if (delay) await wait(delay);
        if (!active) return;
        const me = await api.getMe();
        if (!active) return;
        if (me) {
          setAccess(me.owner ? 'owner' : 'denied');
          return;
        }
      }
      setAccess('denied');
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit(plan: Plan) {
    const target = email.trim();
    if (!target || busy) return;
    setBusy(true);
    setResult(null);
    const res = await api.grantAccess(target, plan);
    setBusy(false);
    setResult(
      res.ok
        ? {
            ok: true,
            text:
              plan === 'free'
                ? `Access removed for ${res.email}.`
                : `${res.email} now has ${res.plan} access. They just need to refresh the page.`,
          }
        : { ok: false, text: res.error },
    );
  }

  if (access === 'checking') {
    return (
      <Shell>
        <p className="num text-ink-500 text-sm animate-pulse">Checking access…</p>
      </Shell>
    );
  }

  if (access === 'denied') {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold mb-2">Not authorized</h1>
        <p className="text-ink-300 text-sm">
          This page is for the account owner.{' '}
          <Link to="/" className="text-brass-200 hover:text-brass-100">Back to home</Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-1">Account tools</h1>
      <p className="text-ink-300 text-sm mb-6">
        Unlock an account by the email address they sign in with. They must have signed in at least
        once for an account to exist.
      </p>

      <label className="block text-left text-xs uppercase tracking-widest text-ink-500 mb-2" htmlFor="grant-email">
        Customer email
      </label>
      <input
        id="grant-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@example.com"
        autoComplete="off"
        className="w-full rounded-xl bg-felt-900 border border-felt-700 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-400"
      />

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={() => submit('lifetime')}
          disabled={busy || !email.trim()}
          className="flex-1 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-50">
          {busy ? 'Working…' : 'Grant lifetime access'}
        </button>
        <button
          onClick={() => submit('free')}
          disabled={busy || !email.trim()}
          className="px-6 py-3 rounded-xl border border-felt-700 text-ink-300 font-semibold hover:border-felt-600 hover:text-ink-100 transition disabled:opacity-50">
          Remove access
        </button>
      </div>

      {result && (
        <p className={`text-sm mt-4 ${result.ok ? 'text-brass-200' : 'text-red-400'}`}>{result.text}</p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="felt-card rounded-2xl p-8">{children}</div>
    </div>
  );
}

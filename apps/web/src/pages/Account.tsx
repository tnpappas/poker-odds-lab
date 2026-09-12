import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, useClerk } from '@clerk/clerk-react';
import { clerkEnabled } from '../lib/auth';
import { api, type Me } from '../lib/api';
import { useGameStore } from '../store/useGameStore';
import { Eyebrow } from '../components/ui';

/**
 * /account: the one place a member manages their membership without emailing
 * support. Shows the plan, cancels the subscription, links to PayPal for
 * payment details, and deletes the account (GDPR / CCPA).
 */
export function Account() {
  if (!clerkEnabled) {
    return (
      <Shell>
        <p className="text-ink-300 text-sm">Accounts are not enabled in this build.</p>
      </Shell>
    );
  }
  return (
    <Shell>
      <SignedOut>
        <p className="text-ink-300 text-sm mb-5">Sign in to manage your membership.</p>
        <SignInButton mode="modal">
          <button className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition text-sm">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <AccountPanel />
      </SignedIn>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-xl mx-auto px-5 sm:px-6 pt-6 pb-28">
      <Eyebrow>Account</Eyebrow>
      <h1 className="font-display text-3xl font-semibold tracking-tight mt-3 mb-6">Your membership</h1>
      {children}
    </div>
  );
}

type Busy = 'idle' | 'cancel' | 'delete';

function AccountPanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<Busy>('idle');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portal, setPortal] = useState<string | null>(null);
  const setPlan = useGameStore((s) => s.setPlan);
  const clerk = useClerk();

  async function refresh() {
    const m = await api.getMe();
    setMe(m);
    setLoaded(true);
    if (m) setPlan(m.plan);
  }

  useEffect(() => {
    void refresh();
    void api.billingPortalUrl().then(setPortal);
  }, []);

  async function cancel() {
    if (busy !== 'idle') return;
    if (!window.confirm('Cancel your subscription? You keep access until the end of the current billing period.')) return;
    setBusy('cancel');
    setMessage(null);
    const res = await api.cancelSubscription();
    setBusy('idle');
    if (res.ok) {
      setMessage({ ok: true, text: 'Your subscription is cancelled. You will not be charged again. You keep access until the end of the period you have paid for.' });
      await refresh();
    } else {
      setMessage({ ok: false, text: res.error });
    }
  }

  async function deleteAccount() {
    if (busy !== 'idle') return;
    setBusy('delete');
    setMessage(null);
    const res = await api.deleteAccount();
    if (!res.ok) {
      setBusy('idle');
      setMessage({ ok: false, text: res.error });
      return;
    }
    try {
      localStorage.removeItem('pol-game-state');
    } catch {
      // ignore
    }
    await clerk.signOut({ redirectUrl: '/' });
  }

  if (!loaded) {
    return <p className="num text-ink-500 text-sm animate-pulse">Loading your account…</p>;
  }
  if (!me) {
    return <p className="text-ink-300 text-sm">We could not reach the account service. Please refresh in a moment.</p>;
  }

  const isPaid = me.entitled && !me.owner;
  const proUntil = me.proUntil ? new Date(me.proUntil) : null;
  const proUntilText = proUntil
    ? proUntil.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const cancelled = isPaid && !me.hasSubscription && !!proUntil;

  return (
    <div className="flex flex-col gap-5">
      <section className="felt-card rounded-2xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="eyebrow">Signed in as</div>
            <div className="text-ink-100 mt-1">{me.email}</div>
          </div>
          <div className="text-right">
            <div className="eyebrow">Plan</div>
            <div className="num font-semibold text-lg mt-1">
              {me.owner ? 'Owner' : me.entitled ? 'Unlimited' : 'Free'}
            </div>
            {isPaid && proUntilText && (
              <div className="text-ink-500 text-xs mt-1">
                {cancelled ? `Cancelled. Access ends ${proUntilText}` : `Renews ${proUntilText}`}
              </div>
            )}
          </div>
        </div>
        {!me.entitled && (
          <p className="text-ink-300 text-sm mt-4">
            You are on the free plan (3 replays and 2 blitz rounds a day).{' '}
            <Link to="/pricing" className="text-brand-400 hover:text-brand-300 font-medium">See plans</Link>
          </p>
        )}
      </section>

      {isPaid && (
        <section className="felt-card rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold">Subscription</h2>
          <p className="text-ink-300 text-sm mt-2">
            Billed through PayPal. Cancel here at any time; you keep access until the end of the period you have paid for.
            Refunds within 14 days of your first payment: email{' '}
            <a href="mailto:support@pokerlogiclab.com" className="text-brand-400 hover:text-brand-300">support@pokerlogiclab.com</a>.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {me.hasSubscription ? (
              <button
                type="button"
                onClick={cancel}
                disabled={busy !== 'idle'}
                className="px-4 py-2 rounded-xl border border-white/20 bg-black/30 text-ink-100 hover:border-oxblood-400 transition text-sm font-medium disabled:opacity-50"
              >
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            ) : (
              <p className="text-ink-500 text-sm">
                {cancelled
                  ? `Your subscription is cancelled and will not renew. You keep full access until ${proUntilText}.`
                  : 'No PayPal subscription is on file for this account. If you believe you are being billed, manage it on PayPal or contact support.'}
              </p>
            )}
            {portal && (
              <a
                href={portal}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl border border-white/20 bg-black/30 text-ink-100 hover:border-brand-400/70 transition text-sm font-medium"
              >
                Payment details on PayPal
              </a>
            )}
          </div>
        </section>
      )}

      {message && (
        <p className={`text-sm rounded-xl px-4 py-3 ${message.ok ? 'bg-chip-green/10 text-chip-green' : 'bg-oxblood-400/10 text-oxblood-400'}`}>
          {message.text}
        </p>
      )}

      <section className="felt-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold">Delete account</h2>
        <p className="text-ink-300 text-sm mt-2">
          Permanently deletes your account, your training history and your saved opponents. Any active subscription is cancelled first. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 text-sm text-ink-500 hover:text-oxblood-400 transition underline"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={deleteAccount}
              disabled={busy !== 'idle'}
              className="px-4 py-2 rounded-xl bg-oxblood-400 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {busy === 'delete' ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-ink-300 hover:text-ink-100">
              Keep my account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

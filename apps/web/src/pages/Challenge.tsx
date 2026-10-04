import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Card } from '@pol/poker-engine';
import { Eyebrow } from '../components/ui';
import { PlayingCard } from '../components/PlayingCard';
import { api, type ChallengeAction, type ChallengeDay, type ChallengeState } from '../lib/api';

/**
 * The 7-Day Live Read Challenge. Public page, no account needed: entrants
 * answer with an email and a leaderboard name. Spots and answers come from the
 * API, which only sends a spot once its day opens and its answer once it closes.
 */

const ENTRANT_KEY = 'pol-challenge-entrant';
const ANSWERS_KEY = 'pol-challenge-answers';

type Entrant = { email: string; handle: string };
type MyAnswers = Record<string, { action: ChallengeAction; equityGuess: number }>;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode: the answer is still saved on the server.
  }
}

const etFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const et = (iso: string) => `${etFormat.format(new Date(iso))} ET`;

export function Challenge() {
  const [state, setState] = useState<ChallengeState | null | 'loading'>('loading');
  const [entrant, setEntrant] = useState<Entrant | null>(() => load<Entrant | null>(ENTRANT_KEY, null));
  const [mine, setMine] = useState<MyAnswers>(() => load<MyAnswers>(ANSWERS_KEY, {}));

  const refresh = () => api.getChallenge().then(setState);
  useEffect(() => {
    refresh();
  }, []);

  const recordAnswer = (day: number, e: Entrant, a: { action: ChallengeAction; equityGuess: number }) => {
    setEntrant(e);
    save(ENTRANT_KEY, e);
    const next = { ...mine, [day]: a };
    setMine(next);
    save(ANSWERS_KEY, next);
    refresh();
  };

  if (state === 'loading') {
    return <Shell><p className="num text-ink-500 text-sm animate-pulse">Dealing the cards…</p></Shell>;
  }
  if (!state) {
    return (
      <Shell>
        <Hero />
        <p className="text-ink-300 mt-8">The challenge could not load. Refresh the page in a moment.</p>
      </Shell>
    );
  }

  const open = state.days.find((d) => d.status === 'open');
  const revealed = state.days.filter((d) => d.status === 'revealed').reverse();
  const notStarted = state.days.every((d) => d.status === 'upcoming');

  return (
    <Shell>
      <Hero />
      <StatusLine state={state} notStarted={notStarted} />

      {notStarted && <SaveSeat startsAt={state.startsAt} />}

      {open && (
        <OpenDay
          key={open.day}
          day={open}
          entrant={entrant}
          mine={mine[open.day]}
          onAnswered={(e, a) => recordAnswer(open.day, e, a)}
        />
      )}

      {!notStarted && !open && !state.finished && (
        <p className="text-ink-300 mt-8">The next hand drops at 7pm ET.</p>
      )}

      {state.leaderboard.length > 0 && <Leaderboard rows={state.leaderboard} finished={state.finished} />}

      {revealed.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Answers</h2>
          <div className="space-y-4">
            {revealed.map((d) => <RevealedDay key={d.day} day={d} mine={mine[d.day]} />)}
          </div>
        </section>
      )}

      <Prizes />

      <div className="felt-card rounded-2xl p-6 mt-12 text-center">
        <p className="font-display text-xl font-semibold">Train this between hands</p>
        <p className="text-ink-300 text-sm mt-2">
          Hand Replay gives you spots like these every day, scored on the decision, not the result. 3 hands a day are free, no sign-up.
        </p>
        <Link to="/replay" className="inline-block mt-4 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
          Play 3 free hands
        </Link>
      </div>

      <p className="text-xs text-ink-500 mt-10 leading-relaxed">
        No purchase necessary. Free to enter. 18+ and US residents only. A skill contest, not gambling: no money is wagered.
        This promotion is not sponsored, endorsed or administered by, or associated with, Instagram or Facebook.{' '}
        <Link to="/challenge/rules" className="underline underline-offset-2 hover:text-ink-300">Official rules</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 pt-10">{children}</div>;
}

function Hero() {
  return (
    <>
      <Eyebrow>The Live Read Challenge</Eyebrow>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.03]">
        7 days. 7 river decisions. 1 leaderboard.
      </h1>
      <p className="text-ink-300 mt-5 max-w-2xl leading-relaxed">
        One real spot every night at 7pm ET, frozen at the river decision. Read the player, make the call or the fold, and
        guess your equity. Every answer is checked by our poker engine against the range we model for that player, and the
        math is posted the next night.
      </p>
    </>
  );
}

function StatusLine({ state, notStarted }: { state: ChallengeState; notStarted: boolean }) {
  const text = notStarted
    ? `Day 1 drops ${et(state.startsAt)}.`
    : state.finished
      ? 'The challenge is over. Final standings below.'
      : `${state.entrants} ${state.entrants === 1 ? 'player' : 'players'} in so far.`;
  return <p className="text-gold-400 mt-4 text-sm font-medium">{text}</p>;
}

function SaveSeat({ startsAt }: { startsAt: string }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await api.challengeSignup(email.trim());
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: `You're in. We'll email you when Day 1 drops on ${et(startsAt)}.` } : { ok: false, text: res.error });
  }

  return (
    <form onSubmit={submit} className="felt-card rounded-2xl p-6 mt-8">
      <p className="font-display text-xl font-semibold">Save your seat</p>
      <p className="text-ink-300 text-sm mt-1">Get each hand by email the moment it drops.</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="flex-1 rounded-xl bg-felt-900 border border-felt-700 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-400" />
        <button disabled={busy} className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-50">
          {busy ? 'Saving…' : 'Save my seat'}
        </button>
      </div>
      <p className="text-xs text-ink-500 mt-3">By signing up you agree to get challenge and Poker Logic Lab emails. Unsubscribe anytime.</p>
      {msg && <p className={`text-sm mt-3 ${msg.ok ? 'text-brass-200' : 'text-red-400'}`}>{msg.text}</p>}
    </form>
  );
}

function SpotView({ day, header = true }: { day: ChallengeDay; header?: boolean }) {
  const s = day.spot!;
  return (
    <>
      {header && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink-500 mb-2">
            <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-400">Day {day.day} of 7</span>
            <span>{s.points === 2 ? 'Double points' : '1 point'}</span>
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
        </>
      )}
      <p className="text-ink-100 mt-2">{s.hook}</p>
      <p className="text-ink-300 text-sm mt-4"><span className="text-ink-100 font-medium">The player: </span>{s.profile}</p>
      <p className="text-ink-300 text-sm mt-2"><span className="text-ink-100 font-medium">The hand: </span>{s.action}</p>
      <div className="flex flex-wrap items-end gap-6 mt-5">
        <div>
          <p className="eyebrow !text-[0.6rem] mb-1.5">Your hand</p>
          <div className="flex gap-1.5">{s.hero.map((c) => <PlayingCard key={c} card={c as Card} />)}</div>
        </div>
        <div>
          <p className="eyebrow !text-[0.6rem] mb-1.5">Board</p>
          <div className="flex gap-1.5">{s.board.map((c, i) => <PlayingCard key={c} card={c as Card} delay={i * 0.06} />)}</div>
        </div>
      </div>
      <p className="num text-sm text-ink-100 mt-4">Pot ${s.pot}. He bets ${s.bet}.</p>
    </>
  );
}

function OpenDay({ day, entrant, mine, onAnswered }: {
  day: ChallengeDay;
  entrant: Entrant | null;
  mine?: { action: ChallengeAction; equityGuess: number };
  onAnswered: (e: Entrant, a: { action: ChallengeAction; equityGuess: number }) => void;
}) {
  const [email, setEmail] = useState(entrant?.email ?? '');
  const [handle, setHandle] = useState(entrant?.handle ?? '');
  const [action, setAction] = useState<ChallengeAction | null>(null);
  const [guess, setGuess] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!action || busy) return;
    setBusy(true);
    setError(null);
    const who = { email: email.trim(), handle: handle.trim() };
    const res = await api.challengeAnswer({ ...who, day: day.day, action, equityGuess: guess });
    setBusy(false);
    if (res.ok) onAnswered(who, { action, equityGuess: guess });
    else setError(res.error);
  }

  return (
    <section className="felt-card rounded-2xl p-6 mt-8">
      <SpotView day={day} />
      {mine ? (
        <div className="mt-6 rounded-xl border border-brass-400/40 p-4">
          <p className="text-brass-200 font-semibold">Locked in: {mine.action.toUpperCase()}, {mine.equityGuess}% equity.</p>
          <p className="text-ink-300 text-sm mt-1">The answer and the math drop {et(day.closesAt)}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-ink-100 font-medium mb-2">Your move</p>
            <div className="grid grid-cols-2 gap-2">
              {(['call', 'fold'] as const).map((a) => (
                <button type="button" key={a} onClick={() => setAction(a)}
                  className={`py-3 rounded-xl font-semibold border transition ${action === a ? 'bg-brand-500 border-brand-400 text-white' : 'border-felt-700 text-ink-300 hover:text-ink-100'}`}>
                  {a === 'call' ? 'Call' : 'Fold'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="eq" className="text-sm text-ink-100 font-medium">
              Your equity against his range: <span className="num text-brass-200">{guess}%</span>
            </label>
            <input id="eq" type="range" min={0} max={100} value={guess} onChange={(e) => setGuess(Number(e.target.value))} className="w-full mt-2" />
            <p className="text-xs text-ink-500">The closest guesses break ties on the leaderboard.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (private)"
              className="rounded-xl bg-felt-900 border border-felt-700 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-400" />
            <input required minLength={2} maxLength={30} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Leaderboard name, e.g. @yourhandle"
              className="rounded-xl bg-felt-900 border border-felt-700 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-400" />
          </div>
          <button disabled={!action || busy} className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition disabled:opacity-50">
            {busy ? 'Locking in…' : action ? `Lock in ${action === 'call' ? 'Call' : 'Fold'}` : 'Pick call or fold'}
          </button>
          <p className="text-xs text-ink-500">
            One answer per day, and it is final. Closes {et(day.closesAt)}. By entering you agree to the{' '}
            <Link to="/challenge/rules" className="underline underline-offset-2">rules</Link> and to get challenge and Poker Logic Lab emails. Unsubscribe anytime.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      )}
    </section>
  );
}

function RevealedDay({ day, mine }: { day: ChallengeDay; mine?: { action: ChallengeAction; equityGuess: number } }) {
  const r = day.reveal!;
  const right = mine && mine.action === r.correct;
  return (
    <details className="felt-card rounded-2xl p-6 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
        <span>
          <span className="text-xs text-ink-500">Day {day.day}</span>
          <span className="block font-display text-xl font-semibold">{day.spot!.title}</span>
        </span>
        <span className="text-right">
          <span className={`block font-semibold ${r.correct === 'call' ? 'text-chip-green' : 'text-oxblood-400'}`}>{r.correct.toUpperCase()}</span>
          {mine && <span className={`text-xs ${right ? 'text-chip-green' : 'text-ink-500'}`}>{right ? 'You got it' : 'You missed this one'}</span>}
        </span>
      </summary>
      <div className="mt-5">
        <SpotView day={day} header={false} />
        <div className="grid grid-cols-2 gap-3 mt-5 num">
          <div className="rounded-xl border border-felt-700 p-3">
            <p className="text-xs text-ink-500">Your equity vs his range</p>
            <p className="text-xl text-ink-100">{r.equityPct}%</p>
          </div>
          <div className="rounded-xl border border-felt-700 p-3">
            <p className="text-xs text-ink-500">Equity needed to call</p>
            <p className="text-xl text-ink-100">{r.requiredPct}%</p>
          </div>
        </div>
        <p className="text-ink-100 mt-4">{r.lesson}</p>
        <p className="text-ink-300 text-sm mt-3"><span className="text-ink-100 font-medium">The range we modeled: </span>{r.rangeText}</p>
        <p className="text-xs text-ink-500 mt-3">
          {r.entries} {r.entries === 1 ? 'player' : 'players'} answered
          {r.correctPct != null && `. ${r.correctPct}% got it right`}
          {mine && `. Your guess: ${mine.action}, ${mine.equityGuess}%`}.
        </p>
      </div>
    </details>
  );
}

function Leaderboard({ rows, finished }: { rows: ChallengeState['leaderboard']; finished: boolean }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-1">{finished ? 'Final standings' : 'Leaderboard'}</h2>
      <p className="text-xs text-ink-500 mb-4">Scored on revealed days. Ties go to the lowest total equity error.</p>
      <div className="felt-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-ink-500 text-left">
            <tr><th className="p-3">#</th><th className="p-3">Player</th><th className="p-3 text-right">Points</th><th className="p-3 text-right hidden sm:table-cell">Equity error</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.handle + i} className="border-t border-felt-800/60">
                <td className="p-3 num text-ink-500">{i + 1}</td>
                <td className="p-3 text-ink-100">{r.handle}</td>
                <td className="p-3 num text-right text-brass-200">{r.points}</td>
                <td className="p-3 num text-right text-ink-300 hidden sm:table-cell">{r.totalError}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Prizes() {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Prizes</h2>
      <ul className="space-y-2 text-ink-300">
        <li><span className="text-ink-100 font-medium">1st place:</span> a year of Poker Logic Lab unlimited access ($49 value).</li>
        <li><span className="text-ink-100 font-medium">2nd to 5th:</span> a month of unlimited access ($7.99 value).</li>
        <li><span className="text-ink-100 font-medium">Answer all 7 days:</span> two free chapters of Playing Online Texas Hold'em.</li>
      </ul>
    </section>
  );
}

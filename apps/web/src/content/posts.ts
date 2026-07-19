/**
 * Blog posts. Each post's `body` is trusted HTML authored by us (rendered with
 * dangerouslySetInnerHTML in BlogPost). To add a post, append an entry here.
 */
export interface BlogPost {
  slug: string;
  /** SEO <title> (includes brand). */
  title: string;
  /** On-page H1. */
  heading: string;
  /** Meta description + card excerpt. */
  description: string;
  /** ISO date. */
  date: string;
  readingTime: string;
  body: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: 'how-to-calculate-pot-odds-fast',
    title: 'How to Calculate Pot Odds Fast (No Calculator) | Poker Logic Lab',
    heading: 'How to Calculate Pot Odds Fast (Without a Calculator)',
    description:
      'Learn to calculate pot odds in seconds at the table. A simple two-step method, the bet-size shortcuts worth memorizing, and the 2 and 4 rule, with worked examples.',
    date: '2026-07-19',
    readingTime: '5 min read',
    body: `
<p>Someone bets into you. You have a draw. The pot is sitting there and everyone is waiting on you. This is the moment that quietly decides whether you win money at poker or slowly bleed it, and most players handle it by guessing.</p>
<p>You do not have to guess. Pot odds tell you, in a few seconds of mental math, whether calling is a good deal or a leak. Here is the fast way to do it at the table, with no app and no calculator.</p>

<h2>What pot odds actually are</h2>
<p>Pot odds are just a price. When you call a bet, you are paying a certain amount to win what is already in the pot. Pot odds compare the size of that price to the size of the reward.</p>
<p>Once you know the price, you compare it to one other number: your chance of actually winning the hand. If your chance of winning is bigger than the price you are paying, calling makes money over time. If it is smaller, calling loses money. That is the entire idea.</p>
<p>So there are two numbers to find: the equity you need (the price), and the equity you have (your real chance to win). Let us get both fast.</p>

<h2>The fast way to find the price</h2>
<p>Here is the two-step version you can do in your head every time.</p>
<p><strong>Step 1.</strong> Add your call to the pot to get the total pot after you call.</p>
<p><strong>Step 2.</strong> Divide your call by that total. The result is the share of the pot you are paying for, which is the minimum chance of winning you need to break even.</p>
<p>An example. There is $100 in the middle. Your opponent bets $50, so the pot is now $150. To keep playing you have to call $50.</p>
<ul>
  <li>Total pot after you call: 150 + 50 = $200.</li>
  <li>Your call divided by that total: 50 / 200 = 25%.</li>
</ul>
<p>You need to win this hand at least 25% of the time for the call to be worth it. That is your number.</p>

<h2>The shortcut worth memorizing</h2>
<p>You will not want to do that division on every street forever. The good news is that the price only depends on the bet size relative to the pot, so you can memorize a handful of anchors and recognize them instantly:</p>
<ul>
  <li>Opponent bets a quarter of the pot: you need about 20%.</li>
  <li>Opponent bets half the pot: you need about 25%.</li>
  <li>Opponent bets two-thirds of the pot: you need about 29%.</li>
  <li>Opponent bets three-quarters of the pot: you need about 30%.</li>
  <li>Opponent bets the full pot: you need about 33%.</li>
</ul>
<p>Notice the pattern. Bigger bets ask for a bigger share of wins. A tiny bet is cheap to call, a huge bet is expensive. Learn these five numbers and you have the price for almost every spot without doing any math at all.</p>

<h2>Now find your real chance of winning</h2>
<p>The price only matters next to your actual equity, so you need a fast way to estimate that too. Use the 2 and 4 rule.</p>
<p>Count your outs, meaning the cards left in the deck that turn your hand into a winner. Then:</p>
<ul>
  <li>On the flop, with two cards still to come, multiply your outs by 4.</li>
  <li>On the turn, with one card to come, multiply your outs by 2.</li>
</ul>
<p>That gives you a rough win percentage that is close enough to make a decision.</p>
<p>An example. You have a flush draw on the flop. Nine cards complete your flush, so you have 9 outs. Two cards are still to come, so multiply by 4: 9 x 4 = 36%. Your real chance of hitting is roughly 36%.</p>

<h2>Put the two numbers side by side</h2>
<p>Now the decision is easy, because you have both halves.</p>
<p>Back to our hand. Your opponent bet half the pot, so the price says you need 25% to break even. You have a flush draw, so the 2 and 4 rule says you have about 36%. Your chance of winning (36%) is comfortably bigger than the price you are paying (25%), so calling makes money. Every time you face that spot, on average, you come out ahead. Call.</p>
<p>Flip the numbers and the answer flips too. If you only had 4 outs (about 16% on the flop) facing that same half-pot bet, you would need 25% and only have 16%. That is a fold, even though it feels close in the moment. The math is not close.</p>

<h2>Three mistakes that quietly cost you</h2>
<p><strong>Forgetting to add your own call to the pot.</strong> The reward includes the money you are about to put in. Leave it out and your price will be wrong every time.</p>
<p><strong>Counting outs that do not really win.</strong> A card that completes your straight but also puts a third suit on the board might make your opponent a flush. Those are dirty outs. Be honest about which cards actually win you the hand, not just the ones that improve it.</p>
<p><strong>Ignoring that the price is only half the picture.</strong> Pot odds tell you the break-even point for calling right now. Sometimes you can call a little worse than the price because of the extra money you expect to win on later streets when you hit. That is called implied odds, and it is a topic on its own. For now, get the two core numbers right and you are ahead of most players at the table.</p>

<h2>The math is simple. Doing it fast is the skill.</h2>
<p>None of this is hard arithmetic. The gap between a losing player and a winning one is not knowing the formula, it is running it automatically while the clock is ticking and there is money on the line. That only comes from reps.</p>
<p>That is exactly what we built <a href="/">Poker Logic Lab</a> to train. The Blitz mode throws rapid pot-odds and equity questions at you in 30-second rounds until the math becomes instant, and the free <a href="/guide">How It Works guide</a> teaches the six core ideas from zero. You are scored on making the correct decision, not on whether the card fell your way.</p>
<p>Learn the five bet-size anchors, learn the 2 and 4 rule, and practice until you do not have to think about it. That is how you stop guessing and start knowing.</p>
`.trim(),
  },
];

export const getPost = (slug: string): BlogPost | undefined =>
  POSTS.find((p) => p.slug === slug);

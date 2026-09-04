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
  {
    slug: 'implied-odds-explained',
    title: 'Implied Odds Explained: When to Call Without the Right Price | Poker Logic Lab',
    heading: 'Implied Odds Explained: When You Can Call Without the Right Price',
    description:
      'Pot odds say fold, but the call still makes money. Implied odds explain why. A simple way to size the future money you need, two worked examples, and the four things that shrink it.',
    date: '2026-09-04',
    readingTime: '6 min read',
    body: `
<p>You have a draw. You run the pot odds the way you should, and the price is not there. Your chance of hitting is smaller than the share of the pot you are being asked to pay for. By the book, that is a fold.</p>
<p>And yet good players call in that spot all the time, and they are right to. The reason is implied odds. This post explains what they are, how to estimate them in a few seconds, and the situations where they quietly disappear and turn a "fine" call into a leak.</p>
<p>If pot odds are new to you, read <a href="/blog/how-to-calculate-pot-odds-fast">How to Calculate Pot Odds Fast</a> first. This post builds directly on it.</p>

<h2>The gap pot odds leave open</h2>
<p>Pot odds only look at the money that is in the pot right now. They answer one narrow question: if this were the last bet of the hand, would calling be profitable?</p>
<p>But it is usually not the last bet. When you call with a draw and then hit it, your opponent often keeps putting money in. That future money is not in the pot yet, so pot odds ignore it. Implied odds put it back into the picture.</p>
<p>Implied odds are simply your pot odds plus a realistic estimate of what you will win on later streets when you hit. Same idea as pot odds, bigger reward.</p>

<h2>The one calculation worth learning</h2>
<p>You do not need a formula with four variables. You need one question: how much extra do I have to win when I hit for this call to break even?</p>
<p><strong>Step 1.</strong> Take the amount you have to call and divide it by your chance of hitting. That gives you the total pot you need to be playing for.</p>
<p><strong>Step 2.</strong> Subtract what the pot will be after your call. What is left is the future money you need to win, on average, every time you hit.</p>
<p><strong>Step 3.</strong> Ask honestly whether that money is really there. Does your opponent have it behind, and will they actually pay it?</p>
<p>An example. There is $100 in the pot on the turn. Your opponent bets $75, so the pot is $175 and you have to call $75. You have a gutshot straight draw with one card to come: 4 outs, so about 9% using the 2 and 4 rule.</p>
<ul>
  <li>Price to call: 75 out of a $250 total pot, which is 30%. You have 9%. Pot odds say fold, and it is not close.</li>
  <li>Total pot you need: 75 divided by 0.09 is about $830.</li>
  <li>Future money needed: 830 minus the $250 already there is roughly $580.</li>
</ul>
<p>So this call only works if you expect to win about $580 more on the river, on average, every time your straight comes in. On a $100 pot, that is a huge ask. Your opponent would need a big stack and a willingness to pay off a completed straight nearly every time. Most of the time that money is not there, and the fold was correct after all.</p>
<p>That is the real lesson of implied odds. They are a reason to call sometimes, not a permission slip to call always. Running the number keeps you honest.</p>

<h2>An example where the money is there</h2>
<p>Now a spot where implied odds flip the answer. You are playing $1/$2 with $300 in front of you, and you hold a small pair, say pocket 4s. A player who covers you raises to $10 before the flop. You are the only one left to act.</p>
<ul>
  <li>The pot is the $3 in blinds plus the $10 raise, so $13. You call $10. Price: 10 out of 23, about 43%.</li>
  <li>You will flop a set about 12% of the time. Pot odds say this is a clear fold.</li>
  <li>Total pot you need: 10 divided by 0.12 is about $83. Subtract the $23 that will be in the pot and you need about $60 in future money when you hit.</li>
</ul>
<p>Here the money is realistic. You both have close to $300 behind. When you flop a set against a player who raised before the flop and likes his hand, winning another $60 is the floor, not the ceiling. Often you win a great deal more. So the call that pot odds rejected is actually a strong, profitable call, and it is one of the most reliable money makers in low stakes poker. The call is cheap, the hand is hidden, and the payoff when you hit is large.</p>
<p>Notice what made the difference between the two examples. It was not the draw. It was the size of the call relative to the stacks, and how likely the opponent was to pay off.</p>

<h2>Four things that shrink your implied odds</h2>
<p><strong>Short stacks.</strong> You cannot win money that is not on the table. If your opponent has $40 behind, your maximum future win is $40, no matter how pretty the draw is. Always check the smaller of the two stacks before you count on implied odds.</p>
<p><strong>Obvious draws.</strong> When the third heart lands, everyone at the table can see the flush got there, and a decent opponent slows down. A straight that completes on a plain board is much better hidden, so it gets paid more often. Hidden draws have better implied odds than obvious ones, even with the same number of outs.</p>
<p><strong>Opponents who fold.</strong> Implied odds are a bet on the other player's behavior. A cautious player who shuts down the moment the board changes does not pay you off, so the future money you were counting on never arrives. A stubborn player who hates folding top pair is where implied odds are best.</p>
<p><strong>Cards that improve you and still lose.</strong> This is the trap, sometimes called reverse implied odds. If you hit your low flush and your opponent holds a higher flush, you do not just fail to win the future money, you lose a lot of your own. The weaker your draw is relative to what beats it, the more skeptical you should be of implied odds.</p>

<h2>A quick check you can do at the table</h2>
<p>Before you call without the right price, run this in your head:</p>
<ul>
  <li>What do I have to call, and what is my rough chance of hitting?</li>
  <li>Call divided by chance: what total pot am I really playing for?</li>
  <li>Is that much money behind in the smaller stack?</li>
  <li>Will this specific opponent pay it when my hand comes in?</li>
</ul>
<p>If the answer to the last two is yes, calling without direct pot odds is fine. If either is no, the "fold" that pot odds gave you stands. That is the whole method.</p>

<h2>Where to practice this</h2>
<p>The math here is not complicated. The hard part is doing it under pressure and being honest about the opponent instead of talking yourself into a call. Both of those come from reps.</p>
<p>The <a href="/calculator">Equity Calculator</a> in Poker Logic Lab shows your exact chance of hitting against a real range so you stop guessing at the equity half of the calculation. The <a href="/replay">Hand Replay</a> trainer puts you in these spots with the pot, the stacks, and the price in front of you, then scores whether your decision was right, not whether the card fell your way. And the free <a href="/guide">How It Works guide</a> covers pot odds, equity, and expected value from zero if you want the foundations first.</p>
<p>Learn the price, then learn what the price leaves out. That is the difference between a player who knows pot odds and one who actually wins with them.</p>
`.trim(),
  },
];

export const getPost = (slug: string): BlogPost | undefined =>
  POSTS.find((p) => p.slug === slug);

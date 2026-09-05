/**
 * Blog posts ("Lab Notes"). Each post's `body` is trusted HTML authored by us
 * (rendered with dangerouslySetInnerHTML in BlogPost). To add a post, append an
 * entry here.
 *
 * Access model:
 * - `access: 'free'`    -> the whole article is public.
 * - `access: 'members'` -> everything before TEASER_MARKER is public (and
 *   indexable by search engines); everything after it requires lifetime access.
 *   Members posts MUST contain the marker, otherwise nothing is gated.
 *
 * `date` is used for ordering only and is not displayed on the site.
 */
export interface BlogPost {
  slug: string;
  /** SEO <title> (includes brand). */
  title: string;
  /** On-page H1. */
  heading: string;
  /** Meta description + card excerpt. */
  description: string;
  /** ISO date. Ordering only. */
  date: string;
  readingTime: string;
  access: 'free' | 'members';
  body: string;
}

/** Everything after this marker in a members post is gated. */
export const TEASER_MARKER = '<!--more-->';

export const POSTS: BlogPost[] = [
  {
    slug: 'how-to-calculate-pot-odds-fast',
    title: 'How to Calculate Pot Odds Fast (No Calculator) | Poker Logic Lab',
    heading: 'How to Calculate Pot Odds Fast (Without a Calculator)',
    description:
      'Learn to calculate pot odds in seconds at the table. A simple two-step method, the bet-size shortcuts worth memorizing, and the 2 and 4 rule, with worked examples.',
    date: '2026-07-19',
    readingTime: '5 min read',
    access: 'free',
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
    access: 'members',
    body: `
<p>You have a draw. You run the pot odds the way you should, and the price is not there. Your chance of hitting is smaller than the share of the pot you are being asked to pay for. By the book, that is a fold.</p>
<p>And yet good players call in that spot all the time, and they are right to. The reason is implied odds. This post explains what they are, how to estimate them in a few seconds, and the situations where they quietly disappear and turn a "fine" call into a leak.</p>
<p>If pot odds are new to you, read <a href="/blog/how-to-calculate-pot-odds-fast">How to Calculate Pot Odds Fast</a> first. This post builds directly on it.</p>
<!--more-->

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
  {
    slug: 'how-to-put-an-opponent-on-a-range',
    title: 'How to Put an Opponent on a Range (A Beginner Method) | Poker Logic Lab',
    heading: 'How to Put an Opponent on a Range, Step by Step',
    description:
      'Stop trying to guess the exact hand. Learn the three-question method for building an opponent range from position, board, and bet size, with a full hand walked through from preflop to turn.',
    date: '2026-09-05',
    readingTime: '7 min read',
    access: 'members',
    body: `
<p>You have probably heard a commentator say "he puts him on ace king" and thought that is the skill: figure out the exact two cards. It is not. Nobody can do that reliably, not even the best players in the world, and trying to is why most players either freeze or talk themselves into a bad call.</p>
<p>The real skill is narrower and much more learnable. You do not ask "what does he have?" You ask "what hands would he play this way?" The answer is a group of hands, called a range, and once you have it the math takes over. Your equity against that group, compared to the price you are being offered, tells you what to do.</p>
<p>This post gives you a simple method for building that range in real time. Three questions, asked in order, and a full hand walked through so you can see it work.</p>
<!--more-->

<h2>A range is a list, not a guess</h2>
<p>Every player starts a hand with one of 169 possible starting hands. Before anyone acts, your opponent could have any of them. Then they act, and every action crosses hands off the list. A raise from early position crosses off most of the junk. A call on a scary board crosses off the hands that would have folded. By the river the list is short, and that short list is your read.</p>
<p>Two rules keep this honest. First, the list only ever gets shorter. Once an action tells you a hand is unlikely, it does not come back later because you want it to. Second, you are estimating, not solving. A range that is roughly right beats one that is precisely wrong, and roughly right is well within reach.</p>

<h2>Question 1: What did they do before the flop, and from where?</h2>
<p>Preflop gives you the biggest cut, because most hands never get played at all. Two things matter: the action (fold, call, raise, reraise) and the position it came from.</p>
<p>Position is a stand-in for how many players are still to act. A raise from the first seat has to get through the whole table, so it needs a real hand. A raise from the button only has the blinds left to beat, so it can be almost anything. As a starting point for a typical player:</p>
<ul>
  <li>Raise from early position: roughly the top 10 to 12% of hands. Pairs from 7s up, ace queen and better, ace jack suited, king queen suited.</li>
  <li>Raise from middle position: roughly 15 to 18%. Add the smaller pairs, more suited aces, and hands like king jack and queen jack suited.</li>
  <li>Raise from the button or cutoff: 25 to 40%. Almost any pair, any suited ace, most suited connectors, and plenty of offsuit broadway hands.</li>
  <li>A flat call instead of a raise: usually a medium hand. Small pairs, suited connectors, weaker aces. The very strong hands tend to raise, so a call caps the top of the range.</li>
</ul>
<p>Adjust for the player. A tight regular who has folded for an hour raises with fewer hands than the percentages above. A loose player who is in every pot raises with more. If you do not know the player yet, use the typical numbers and update as you watch.</p>

<h2>Question 2: What did the board do for that range?</h2>
<p>The flop does not change what your opponent was dealt, but it changes which of those hands they will keep playing. Look at the range from question 1 and sort it into three piles: hands that connected hard, hands that connected a little, and hands that missed.</p>
<p>Then watch what they do. A bet usually comes from the first pile plus some of the third pile as a bluff. A check usually comes from the second and third piles. A call after you bet comes from the first and second piles. Each action tells you which piles are still alive.</p>
<p>The board texture matters too. A flop like king, seven, two with three different suits helps only a narrow slice of hands, so a bet there means something. A flop like ten, nine, eight with two of a suit helps a huge slice of any range, so a bet there tells you much less.</p>

<h2>Question 3: What does the bet size say?</h2>
<p>Most players at low and mid stakes bet bigger with strong hands and smaller with weak or medium ones, and they are not subtle about it. A small bet on the turn from a player who usually bets big is a sign that the top of their range is thin. A sudden big bet on a blank card often means the strong pile.</p>
<p>Do not overuse this one. Sizing tells are player specific and good players deliberately mix them up. Use size to tilt your estimate, not to rebuild it from scratch.</p>

<h2>A full hand, start to finish</h2>
<p>You are playing a $1/$2 game. A regular in middle position raises to $8. You are on the button with ace jack suited and call. The blinds fold. Pot is $19.</p>
<p><strong>Preflop range.</strong> Middle position raise from a normal regular: about 15%. Call it pairs from 5s up, ace ten suited and up, ace jack offsuit and up, king ten suited and up, king queen offsuit, queen ten suited, jack ten suited.</p>
<p><strong>Flop: king, seven, two, three different suits.</strong> He bets $12. Sort his range against this board.</p>
<ul>
  <li>Connected hard: ace king, king queen, king jack suited, king ten suited, plus the sets: kings, sevens. Aces as an overpair.</li>
  <li>Connected a little: the pairs below kings, from queens down to 5s. They are ahead of your ace high but nervous.</li>
  <li>Missed: ace queen, ace jack, ace ten suited, queen ten suited, jack ten suited.</li>
</ul>
<p>Regulars bet this dry flop with nearly their whole range after raising preflop, so the bet removes almost nothing. His range is still wide. You have two overcards to everything but a king and a backdoor flush draw. The price is 12 into 43, about 28%, and ace jack against that whole range is doing better than that. Call. Pot is $43.</p>
<p><strong>Turn: five, no flush draw.</strong> He bets $32, three quarters of the pot. This is where the list gets short. Most regulars do not fire a second big barrel on a dry board with a missed ace queen or a scared pair of 8s. The second bet crosses those off. What is left is mostly the strong pile: ace king, king queen, the sets, aces, and a small number of stubborn bluffs like ace queen with a backdoor that got there.</p>
<p>Now look at your hand against that shortened list. Ace jack has three jacks and three aces as outs, and even the aces are not clean against ace king. Call it 5 outs, about 10% with one card to come. The price is 32 into 107, about 30%. You need 30 and you have 10. Fold, and it is not close.</p>
<p>Notice what happened. You never knew his exact hand, and you did not need to. You knew the list got short and strong on the turn, and the math against that list gave you a clear answer.</p>

<h2>The three mistakes that break the method</h2>
<p><strong>Widening the range later because you want to call.</strong> If the turn bet crossed off the weak hands, they stay crossed off on the river. Talking yourself into "maybe he is bluffing" after the facts said otherwise is the most expensive habit in poker.</p>
<p><strong>Putting them on one hand.</strong> The moment you decide "he has ace king," you stop weighing the rest of the list, and your equity estimate goes wrong. Keep the whole list in view, even the parts you do not like.</p>
<p><strong>Using the same range for every player.</strong> The percentages above are a starting point for an unknown player. The regular who has folded for an hour and the guy who has raised six hands in a row are not holding the same 15%. Update for the person in the seat.</p>

<h2>Where to practice this</h2>
<p>Reading ranges is a skill you build by doing it a few hundred times with feedback, not by reading about it once. That is the whole reason <a href="/replay">Hand Replay</a> exists. A hand plays out, pauses at each decision, and asks you to paint your opponent's range on the 169-hand grid. It shows your equity against your read next to the equity you need, then reveals the real hand and scores how close your read was. You are graded on the read and the decision, not on whether the river was kind.</p>
<p>When you have a specific opponent in mind, the <a href="/adversary-lab">Adversary Lab</a> turns six questions about how they play into a realistic range, so you can train against that person before you sit down with them. And the <a href="/visualizer">Equity Visualizer</a> shows how your hand's value changes as the opponent's range gets wider or tighter, which is the fastest way to build intuition for question 1.</p>
<p>Ask the three questions, in order, on every hand you watch, even the ones you fold. Within a few sessions the list starts building itself, and "what does he have" stops being a mystery and starts being a number.</p>
`.trim(),
  },
];

export const getPost = (slug: string): BlogPost | undefined =>
  POSTS.find((p) => p.slug === slug);

/** Posts newest first, for the index page. */
export const postsByDate = (): BlogPost[] =>
  [...POSTS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/**
 * Splits a post body into the public teaser and the gated remainder.
 * Free posts (or members posts missing the marker) return everything as teaser.
 */
export function splitBody(post: BlogPost): { teaser: string; gated: string | null } {
  if (post.access === 'free') return { teaser: post.body, gated: null };
  const i = post.body.indexOf(TEASER_MARKER);
  if (i === -1) return { teaser: post.body, gated: null };
  return {
    teaser: post.body.slice(0, i).trim(),
    gated: post.body.slice(i + TEASER_MARKER.length).trim(),
  };
}

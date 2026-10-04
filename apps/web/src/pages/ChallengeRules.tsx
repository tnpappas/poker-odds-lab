import { Link } from 'react-router-dom';
import { Eyebrow } from '../components/ui';

/** Official rules for the 7-Day Live Read Challenge (live-read-1). Dates must match apps/api/src/challenge/spots.ts. */
export function ChallengeRules() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 pt-10">
      <Eyebrow>The Live Read Challenge</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Official rules</h1>
      <p className="text-ink-300 mt-3 text-sm">NO PURCHASE NECESSARY TO ENTER OR WIN. A purchase does not improve your chances of winning.</p>

      <div className="space-y-6 mt-8 text-ink-300 leading-relaxed text-[0.95rem]">
        <Section title="1. Sponsor">
          The 7-Day Live Read Challenge (the "Challenge") is sponsored by TNP Digital Ventures LLC, a Virginia limited
          liability company that operates Poker Logic Lab ("Sponsor"). Contact: support@pokerlogiclab.com.
        </Section>

        <Section title="2. Eligibility">
          Open to legal residents of the 50 United States and the District of Columbia who are 18 or older at the time of
          entry. Employees of Sponsor and their immediate families are not eligible. Void where prohibited.
        </Section>

        <Section title="3. Challenge period">
          The Challenge runs from Monday, October 19, 2026 at 7:00pm ET until Monday, October 26, 2026 at 7:00pm ET. A new
          hand is posted each day at 7:00pm ET at pokerlogiclab.com/challenge, and answers for that hand are accepted for
          24 hours, until the next hand is posted. Sponsor's server clock is the official clock.
        </Section>

        <Section title="4. How to enter">
          Go to pokerlogiclab.com/challenge, choose call or fold for the day's hand, enter your guess of your equity against
          the opponent's range, and submit with your email address and a leaderboard name. Entry is free. You do not need an
          account, a subscription, or to follow any social media account. One entry per person: one email address per
          person, one answer per day, and answers are final once submitted. Entries made with multiple email addresses,
          scripts or other automated means will be disqualified. Leaderboard names must not be offensive or impersonate
          anyone; Sponsor may remove or change a name that breaks this rule.
        </Section>

        <Section title="5. Scoring">
          Each correct decision earns 1 point. Day 7 earns 2 points. The correct decision for each hand is the one with the
          higher expected value against the range Sponsor models for that opponent, as calculated by the Poker Logic Lab
          equity engine. The modeled range, the equity, and the price are published when each day closes. Sponsor's
          determination of the correct answers is final.
        </Section>

        <Section title="6. Tie-breakers">
          Ties are broken by the lowest total equity error: the sum, across all seven days, of the difference between your
          equity guess and the true equity, in percentage points. A day you did not answer counts as an error of 100. Any
          remaining tie goes to the entrant who submitted their first answer earliest.
        </Section>

        <Section title="7. Prizes">
          First place: 12 months of Poker Logic Lab unlimited access (approximate retail value $49). Second through fifth
          place: 1 month of Poker Logic Lab unlimited access (approximate retail value $7.99 each). Every eligible entrant
          who answers all seven days: two free chapters of Playing Online Texas Hold'em, delivered by email. Total
          approximate retail value of the ranked prizes: $80.96. Access prizes are applied to the winner's Poker Logic Lab
          account for the email address used to enter, start when applied, are not transferable, and have no cash value.
          Odds of winning depend on the number of entrants and their scores. This is a game of skill; no element of chance
          decides the winners except as stated in rule 6.
        </Section>

        <Section title="8. Winners">
          Final standings are posted at pokerlogiclab.com/challenge when the Challenge ends. Winners are notified by email
          within 3 days and must reply within 7 days to claim their prize, or the prize goes to the next eligible entrant.
          By accepting a prize, a winner agrees that Sponsor may post their leaderboard name and result.
        </Section>

        <Section title="9. Your information">
          Your email address is used to run the Challenge, notify winners, and send you Poker Logic Lab emails, which you can
          unsubscribe from at any time. It is never shown publicly. See our <Link to="/privacy" className="underline underline-offset-2 hover:text-ink-100">privacy policy</Link>.
        </Section>

        <Section title="10. General">
          Poker Logic Lab is an educational training product. No money is wagered in the Challenge and no gambling takes
          place. Sponsor may cancel, change or suspend the Challenge if it cannot run as planned because of fraud, technical
          failure or any cause beyond its control, and may disqualify anyone who tampers with the entry process. This
          promotion is not sponsored, endorsed or administered by, or associated with, Instagram, Facebook or Meta.
        </Section>
      </div>

      <Link to="/challenge" className="inline-block mt-10 text-brand-400 font-medium">← Back to the challenge</Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-ink-100 mb-1">{title}</h2>
      <p>{children}</p>
    </section>
  );
}

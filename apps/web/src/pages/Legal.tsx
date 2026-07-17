import { Link } from 'react-router-dom';
import { Eyebrow } from '../components/ui';

const SUPPORT = 'support@pokerlogiclab.com';
const UPDATED = 'July 17, 2026';

type Section = { h: string; body: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const DOCS: Record<'terms' | 'privacy' | 'refunds', Doc> = {
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern your use of Poker Logic Lab. By creating an account or using the app, you agree to them. If you do not agree, please do not use the service.',
    sections: [
      { h: 'About the service', body: [
        'Poker Logic Lab is an educational poker decision-training app. It teaches poker mathematics and decision-making through practice tools.',
        'It is not a gambling product. It does not offer real-money wagering, betting, or games of chance, and it does not pay out money or prizes.',
      ] },
      { h: 'Eligibility', body: [
        'You must be at least 18 years old, or the age of majority where you live, to use the service.',
      ] },
      { h: 'Your account', body: [
        'Sign-in and accounts are handled by our identity provider, Clerk. You are responsible for activity under your account and for keeping your login secure. Tell us at ' + SUPPORT + ' if you suspect unauthorized use.',
      ] },
      { h: 'Lifetime access and billing', body: [
        'Poker Logic Lab is offered as a one-time Lifetime purchase of $24.99 (USD). It is a single charge, not a subscription, and it unlocks the tools available in the app.',
        'Payments are processed by our payment provider, Polar. We do not receive or store your full card details.',
        'Lifetime access covers the app as it exists and evolves. We may add, change, or retire individual features over time.',
      ] },
      { h: 'Refunds', body: [
        'We offer a 14-day money-back guarantee. See our Refund Policy for details.',
      ] },
      { h: 'Acceptable use', body: [
        'The service is for your personal use. You agree not to resell access, share your paid account, scrape or copy the app, attempt to bypass the paywall, or interfere with the service or other users.',
      ] },
      { h: 'Intellectual property', body: [
        'The app, its content, branding, and software are owned by Poker Logic Lab. Your purchase grants you a personal, non-transferable license to use it, not ownership of it.',
      ] },
      { h: 'Educational disclaimer', body: [
        'Poker Logic Lab teaches concepts and math. It does not guarantee any outcome, result, or winnings. Poker involves risk and variance, and any decisions you make are your own.',
      ] },
      { h: 'Service provided "as is"', body: [
        'The service is provided on an "as is" and "as available" basis without warranties of any kind. To the fullest extent permitted by law, Poker Logic Lab is not liable for indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid us.',
      ] },
      { h: 'Changes', body: [
        'We may update these terms. If we make material changes, we will update the date above. Continued use after changes means you accept them.',
      ] },
      { h: 'Contact', body: [ 'Questions about these terms? Email ' + SUPPORT + '.' ] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what Poker Logic Lab collects, why, and your choices. We keep data collection to what the app needs to work.',
    sections: [
      { h: 'What we collect', body: [
        'Account info: your email address (and name, if you provide it), managed through our identity provider, Clerk.',
        'Training data: the practice decisions you make, scores, and usage counts, so the app can track your progress and detect your leaks.',
        'Payment info: handled by our payment provider, Polar. We receive confirmation of your purchase and a customer reference, but not your full card details.',
      ] },
      { h: 'How we use it', body: [
        'To run the app, save your progress, detect your recurring mistakes, personalize drills, and unlock your purchase. We do not sell your personal data.',
      ] },
      { h: 'Service providers we use', body: [
        'Clerk (authentication), Polar (payments), Neon (database hosting), Vercel and Railway (app hosting), and Sentry (error monitoring). Each processes data only to provide its part of the service.',
      ] },
      { h: 'Cookies', body: [
        'We use the cookies required for you to stay signed in (set by Clerk). We do not use advertising cookies.',
      ] },
      { h: 'Data retention and deletion', body: [
        'We keep your data while your account is active. You can delete your account at any time, which removes your training data from our database. To request deletion, use the account controls or email ' + SUPPORT + '.',
      ] },
      { h: 'Your rights', body: [
        'You can request access to, correction of, or deletion of your personal data by emailing ' + SUPPORT + '.',
      ] },
      { h: 'Contact', body: [ 'Privacy questions? Email ' + SUPPORT + '.' ] },
    ],
  },
  refunds: {
    title: 'Refund Policy',
    intro: 'We want you to be happy with Poker Logic Lab. If it is not for you, we make refunds simple.',
    sections: [
      { h: '14-day money-back guarantee', body: [
        'Your one-time Lifetime purchase is backed by a 14-day money-back guarantee. If you are not satisfied within 14 days of your purchase, we will refund you in full.',
      ] },
      { h: 'How to request a refund', body: [
        'Email ' + SUPPORT + ' from the address on your account within 14 days of purchase and ask for a refund. No lengthy forms.',
      ] },
      { h: 'Processing', body: [
        'Approved refunds are issued to your original payment method through Polar. It can take a few business days for the refund to appear, depending on your bank.',
      ] },
      { h: 'After a refund', body: [
        'When a refund is issued, your paid access ends and your account returns to the free state.',
      ] },
      { h: 'Contact', body: [ 'Need help? Email ' + SUPPORT + '.' ] },
    ],
  },
};

export function Legal({ doc }: { doc: 'terms' | 'privacy' | 'refunds' }) {
  const d = DOCS[doc];
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 pt-10">
      <Eyebrow>Legal</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight">{d.title}</h1>
      <p className="text-ink-500 text-xs mt-2 num">Last updated: {UPDATED}</p>
      <p className="text-ink-300 mt-5 leading-relaxed">{d.intro}</p>

      <div className="mt-8 space-y-7">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl font-semibold tracking-tight mb-2">{s.h}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-ink-300 text-[15px] leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
      </div>

      <div className="inlay my-9" />
      <div className="flex flex-wrap gap-4 text-sm text-ink-500">
        <Link to="/terms" className="hover:text-ink-100">Terms</Link>
        <Link to="/privacy" className="hover:text-ink-100">Privacy</Link>
        <Link to="/refunds" className="hover:text-ink-100">Refunds</Link>
        <Link to="/" className="hover:text-ink-100">Home</Link>
      </div>
    </div>
  );
}

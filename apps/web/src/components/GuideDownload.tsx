/**
 * In-app access to the full book that comes with lifetime access.
 * Buyers also receive this link by email (the "Customer - Book Delivery"
 * flow); this is the copy they can grab any time from inside the app.
 * Only rendered on purchase-gated surfaces (Dashboard, post-checkout modal).
 */
export const BOOK_URL =
  'https://assets.cdn.filesafe.space/uZ27QI1WPmHwzgqdmss8/media/6a6600afcf9f8312dcd55a0e.pdf';

/** A small book glyph in the app's 24x24 / 1.6-stroke house style. */
function BookGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 4.5h11.5A1.5 1.5 0 0 1 18 6v13.5H7A2 2 0 0 1 5 17.5V4.5Z" />
      <path d="M5 17.5A2 2 0 0 1 7 15.5h11" />
      <path d="M8.5 8.5h6M8.5 11.5h4" />
    </svg>
  );
}

/**
 * Full-width card that opens the complete guide. Lives on purchase-gated
 * pages, so anyone who can see it already owns the book.
 */
export function GuideDownloadCard() {
  return (
    <a
      href={BOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl bg-felt-900 border border-brass-400/40 p-5 mb-6 hover:border-brass-400/70 transition"
    >
      <span className="grid place-items-center h-12 w-12 rounded-xl bg-brass-500/15 text-brass-300 shrink-0">
        <BookGlyph size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="eyebrow mb-0.5">Your book</div>
        <div className="font-semibold leading-tight">Playing Online Texas Hold&rsquo;em</div>
        <p className="text-xs text-ink-300 mt-0.5">The complete guide. All 19 chapters, yours to keep.</p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brass-500 text-felt-950 text-sm font-bold group-hover:bg-brass-400 transition">
        Download <span aria-hidden>&darr;</span>
      </span>
    </a>
  );
}

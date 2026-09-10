/**
 * Chapter mark — an intentional placeholder, not a copy of the official crest.
 *
 * The Sigma Phi Epsilon crest is trademarked and has not been supplied, so
 * this is a purpose-built shield in the chapter's own vocabulary: a deep
 * SigEp-purple field, a gold star, an orange base bar for Indiana Tech. When
 * the official lockup arrives, drop it at `public/crest.svg` and render it as
 * an <img>. Sized by `className` (height); the gold star tint follows
 * `currentColor` so the masthead can set it.
 */
export function Crest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} role="img" aria-label="Chapter mark">
      <path
        d="M3 3.5h34v20.8C37 35 29.2 41 20 44 10.8 41 3 35 3 24.3V3.5Z"
        fill="#3B1F4A"
        stroke="#C6A24A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M3 33.5c5 5 11.6 7.7 17 9.4 5.4-1.7 12-4.4 17-9.4V40c-5 5-11.6 7.7-17 9.4C14.6 47.7 8 45 3 40v-6.5Z" fill="#E4571C" />
      <path
        d="m20 11 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L6.6 17.8l6.5-.9L20 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

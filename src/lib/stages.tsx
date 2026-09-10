import type { PnmStatus } from '../types/models';

/**
 * One fixed identity per pipeline stage: the tape hue, an ordering for the
 * board's columns, and a drawn glyph that carries the stage without relying on
 * color (so it survives grayscale, glare, and colorblindness). The board and
 * the status tag read from this one place.
 */
interface StageMeta {
  /** Board column order. `dropped` sits out of the pipeline, last. */
  order: number;
  /** `.tape-*` / `.tape-tag` colour class stem. */
  key: 'identified' | 'contacted' | 'building' | 'bid' | 'pledged' | 'dropped';
  tapeColor: string;
  Glyph: (props: { className?: string }) => JSX.Element;
}

const ring = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="none">
    <circle cx="6" cy="6" r="3.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const dot = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden>
    <circle cx="6" cy="6" r="3.4" fill="currentColor" />
  </svg>
);

const bars = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="currentColor">
    <rect x="1.5" y="7" width="2.4" height="4" />
    <rect x="4.8" y="4.5" width="2.4" height="6.5" />
    <rect x="8.1" y="2" width="2.4" height="9" />
  </svg>
);

const rise = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="none">
    <path d="M6 1.5 11 10H1L6 1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const star = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="currentColor">
    <path d="m6 1 1.55 3.15L11 4.62 8.5 7.05 9.09 10.5 6 8.87 2.91 10.5 3.5 7.05 1 4.62l3.45-.47L6 1Z" />
  </svg>
);

const cross = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="none">
    <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const STAGE_META: Record<PnmStatus, StageMeta> = {
  identified: { order: 0, key: 'identified', tapeColor: '#8A8079', Glyph: ring },
  contacted: { order: 1, key: 'contacted', tapeColor: '#2563A8', Glyph: dot },
  'building relationship': { order: 2, key: 'building', tapeColor: '#4B3E9E', Glyph: bars },
  'bid extended': { order: 3, key: 'bid', tapeColor: '#B0741A', Glyph: rise },
  pledged: { order: 4, key: 'pledged', tapeColor: '#2F7D4F', Glyph: star },
  dropped: { order: 5, key: 'dropped', tapeColor: '#9A3324', Glyph: cross },
};

/** Short board-column label for a stage. */
export const STAGE_LABEL: Record<PnmStatus, string> = {
  identified: 'Identified',
  contacted: 'Contacted',
  'building relationship': 'Building',
  'bid extended': 'Bid extended',
  pledged: 'Pledged',
  dropped: 'Dropped',
};

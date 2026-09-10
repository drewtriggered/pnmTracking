import type { PnmStatus } from '../types/models';
import { STAGE_LABEL, STAGE_META } from '../lib/stages';

/**
 * The pipeline stage on a scrap of colored tape, glyph included so it reads
 * without relying on the hue. Used on the detail header and anywhere the
 * plate's edge strip doesn't fit.
 */
export function StatusBadge({ status }: { status: PnmStatus }) {
  const meta = STAGE_META[status];
  return (
    <span
      className="tape-tag shrink-0"
      style={{ backgroundColor: meta.tapeColor }}
    >
      <meta.Glyph className="h-3 w-3" />
      {STAGE_LABEL[status]}
    </span>
  );
}

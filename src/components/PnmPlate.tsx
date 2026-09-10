import { Link } from 'react-router-dom';
import { brotherName } from '../data/brothers';
import { daysSince } from '../lib/format';
import { useReminderSettings } from '../settings/SettingsProvider';
import { STAGE_META } from '../lib/stages';
import { ContactAge } from './ContactAge';
import type { Brother, Pnm } from '../types/models';

/**
 * One PNM as a name plate on the board.
 *
 * The plate stock yellows and its corner curls on a continuous scale with days
 * since the last contact — capped at the exec-escalation threshold, so a plate
 * that has fully aged is one exec would already be hearing about. Stage lives
 * on the tape strip down the left edge (colour) and its glyph; the reading
 * surface itself stays monochrome ink on bone.
 */
export function PnmPlate({ pnm, brothers }: { pnm: Pnm; brothers: Brother[] }) {
  const { escalateAfterDays } = useReminderSettings();
  const meta = STAGE_META[pnm.status];
  const days = daysSince(pnm.lastContactedDate);
  const age =
    days === null ? 1 : Math.max(0, Math.min(1, days / Math.max(escalateAfterDays, 1)));

  const lead = brotherName(brothers, pnm.assignedLead);
  const subline = [pnm.major, lead].filter(Boolean).join('  ·  ');

  return (
    <Link
      to={`/pnms/${pnm.id}`}
      className="plate group"
      style={{ '--age': age } as React.CSSProperties}
    >
      <span className="tape" style={{ backgroundColor: meta.tapeColor }} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold uppercase leading-tight tracking-[0.02em] text-ink">
            {pnm.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {subline || 'No lead assigned'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <meta.Glyph
            className={`h-4 w-4 ${pnm.status === 'pledged' ? 'text-sigep-gold' : 'text-ink'}`}
          />
          <ContactAge value={pnm.lastContactedDate} variant="stamp" />
        </div>
      </div>
    </Link>
  );
}

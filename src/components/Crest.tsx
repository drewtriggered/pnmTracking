/**
 * The official Sigma Phi Epsilon crest shield, lifted from the Fraternity's
 * brand kit (Heritage Marks / SigEp Crest) per its usage rules: full color
 * with a white outline for placement on a dark background. The crown,
 * sunburst, and ribbon are cropped away — the shield is the freestanding
 * element usable at badge size; the full crest only reads at a much larger
 * scale. This is a member-facing surface, so the crest may stand alone here
 * without an accompanying master-brand logotype.
 */
export function Crest({ className }: { className?: string }) {
  return <img src="/crest.png" alt="Sigma Phi Epsilon crest" className={className} />;
}

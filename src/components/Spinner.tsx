export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 font-display text-sm uppercase tracking-[0.15em] text-chalk-dim">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-board-rail border-t-orange"
        aria-hidden
      />
      {label}
    </div>
  );
}

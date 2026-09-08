export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-ink"
        aria-hidden
      />
      {label}
    </div>
  );
}

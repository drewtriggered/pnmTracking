import type { PnmStatus } from '../types/models';

const STYLES: Record<PnmStatus, string> = {
  identified: 'bg-gray-100 text-gray-700 ring-gray-200',
  contacted: 'bg-blue-50 text-blue-700 ring-blue-200',
  'building relationship': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'bid extended': 'bg-amber-50 text-amber-800 ring-amber-200',
  pledged: 'bg-green-50 text-green-700 ring-green-200',
  dropped: 'bg-red-50 text-red-700 ring-red-200',
};

export function StatusBadge({ status }: { status: PnmStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}

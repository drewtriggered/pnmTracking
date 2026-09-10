import type { Timestamp } from 'firebase/firestore';

export function toDate(value: Timestamp | null | undefined): Date | null {
  return value ? value.toDate() : null;
}

export function formatDate(value: Timestamp | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value: Timestamp | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Whole days since `value`, or null if it never happened. */
export function daysSince(value: Timestamp | null | undefined): number | null {
  const date = toDate(value);
  if (!date) return null;
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / 86_400_000);
}

/** "3 days ago" / "Today" / "Never contacted" for the detail view prose. */
export function contactAge(value: Timestamp | null | undefined): string {
  const days = daysSince(value);
  if (days === null) return 'Never contacted';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** Compact grease-pencil stamp for a plate: "TODAY" / "3D" / "NEVER". */
export function stampAge(value: Timestamp | null | undefined): string {
  const days = daysSince(value);
  if (days === null) return 'NEVER';
  if (days <= 0) return 'TODAY';
  return `${days}D`;
}

/** Digits-only phone, used for duplicate detection and tel: links. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** Splits "lacrosse, climbing" into ["lacrosse", "climbing"]. */
export function parseList(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

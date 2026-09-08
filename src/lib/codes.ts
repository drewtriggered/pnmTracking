/**
 * Invite codes are read off a phone screen and typed by hand, so the alphabet
 * drops the characters people confuse: 0/O, 1/I/L, U/V. 10 characters from a
 * 26-symbol alphabet is ~47 bits, which is far past guessable for a chapter's
 * worth of codes.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';
const CODE_LENGTH = 10;

export function generateInviteCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

/** Accepts what a brother pastes or types: trims, upper-cases, drops dashes. */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function inviteLink(code: string): string {
  return `${window.location.origin}/join?code=${code}`;
}

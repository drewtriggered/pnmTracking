import type { Timestamp } from 'firebase/firestore';

export const PNM_STATUSES = [
  'identified',
  'contacted',
  'building relationship',
  'bid extended',
  'pledged',
  'dropped',
] as const;

export type PnmStatus = (typeof PNM_STATUSES)[number];

export const CONTACT_METHODS = [
  'in person',
  'text',
  'call',
  'dm',
  'event',
  'other',
] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number];

export type BrotherRole = 'exec' | 'general';

export interface Socials {
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  linkedin?: string;
}

/**
 * Only `date` and `brotherId` are required. Everything else is detail a
 * brother may add if they feel like it — the whole point of one-tap logging
 * is that an entry with nothing but a date still counts, and an empty field
 * is stored as absent rather than as a guess.
 */
export interface ContactLogEntry {
  /** Client-generated id so entries can be keyed and de-duplicated. */
  id: string;
  date: Timestamp;
  brotherId: string;
  method?: ContactMethod;
  notes?: string;
  /** Rush event this contact happened at, if it happened at one. */
  event?: string;
}

/** The optional half of a log entry, filled in now or added afterwards. */
export type ContactDetails = Pick<ContactLogEntry, 'method' | 'notes' | 'event'>;

export interface Pnm {
  id: string;
  name: string;
  /** Lowercased name, stored so search can prefix-match without a full-text index. */
  nameLower: string;
  phone: string;
  email: string;
  socials: Socials;
  major: string;
  sports: string[];
  hobbies: string[];
  interests: string[];
  /**
   * The rush event where the chapter first met this PNM. Carried in the model
   * for later event tie-in work (and as the landing spot for sign-in sheet
   * imports); no event-specific screens are built yet.
   */
  sourceEvent: string;
  /** Brother document id, or null when nobody owns this PNM yet. */
  assignedLead: string | null;
  status: PnmStatus;
  contactLog: ContactLogEntry[];
  /**
   * Derived from contactLog: the date of the most recent entry. Denormalised
   * onto the document so the reminder job (Phase 3) and the "going cold"
   * views can query it directly instead of reading every log.
   */
  lastContactedDate: Timestamp | null;
  createdAt: Timestamp | null;
  createdBy: string;
  updatedAt: Timestamp | null;
}

export type PnmDraft = Omit<
  Pnm,
  'id' | 'nameLower' | 'contactLog' | 'lastContactedDate' | 'createdAt' | 'createdBy' | 'updatedAt'
>;

export interface Brother {
  id: string;
  name: string;
  phone: string;
  role: BrotherRole;
  /**
   * Tunes reminder thresholds and runs notification experiments. Deliberately
   * separate from the exec role: a whole exec board retuning thresholds
   * mid-experiment would make the results meaningless.
   */
  reminderAdmin?: boolean;
  /** Web push registration tokens, one per device the brother enabled. */
  fcmTokens?: string[];
  assignedPnmIds: string[];
  /** Auth uid once the brother has claimed their invite; null until then. */
  uid: string | null;
  inviteCode?: string;
  claimedAt?: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface Invite {
  /** The document id is the code itself. */
  code: string;
  brotherId: string;
  brotherName: string;
  /** Copied from the brother record so the claim never has to read it. */
  role: BrotherRole;
  createdBy: string;
  createdAt: Timestamp | null;
  claimedByUid: string | null;
  claimedAt: Timestamp | null;
}

export interface UserLink {
  uid: string;
  brotherId: string;
  role: BrotherRole;
  inviteCode: string;
}

/** One reminder notification, written by the daily job. Read-only to clients. */
export interface ReminderSend {
  id: string;
  brotherId: string;
  kind: 'lead' | 'escalation';
  pnmIds: string[];
  variantId: string;
  experimentId: string;
  title: string;
  body: string;
  day: string;
  devicesReached: number;
  sentAt: Timestamp | null;
  /** Set by a later run if the brother logged a contact for one of the PNMs. */
  actedAt: Timestamp | null;
}

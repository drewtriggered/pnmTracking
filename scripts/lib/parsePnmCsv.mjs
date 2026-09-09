/**
 * Parses the chapter's "Potential New Member List" export.
 *
 * The sheet is a human spreadsheet, not a data file: a title block on top, the
 * real header several rows down, trailing empty rows, and cells that hold two
 * or three names. Everything here is about turning that into records without
 * silently dropping what the sheet was tracking.
 */

/** Minimal RFC4180-ish reader — handles quoted fields containing commas. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

/**
 * The sheet's stage numbers, mapped onto the app's statuses.
 *
 * "(5) To Receive Bid" becomes `bid extended` because it is the last stage
 * before pledging, but note the sheet's own "Date of Extension" column is
 * empty for every row — so nobody has actually been handed a bid yet. Change
 * these in the app if that reads wrong.
 */
const STATUS_BY_STAGE = {
  0: 'dropped',
  1: 'identified',
  2: 'contacted',
  3: 'building relationship',
  4: 'building relationship',
  5: 'bid extended',
};

const YEARS = {
  fresh: 'Freshman',
  freshman: 'Freshman',
  soph: 'Sophomore',
  sophomore: 'Sophomore',
  junior: 'Junior',
  jr: 'Junior',
  senior: 'Senior',
  sr: 'Senior',
};

/** "Lutz, Koen" / "David & Fish" / "Alex, David, Khit" -> ["Lutz","Koen"]. */
export function splitLeads(cell) {
  return String(cell || '')
    .split(/[,&/]| and /i)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * The GPA column is headed "GPA Above 2.75" but holds a mix of real GPAs,
 * "Yes", and "Unknown". Keep what carries information, drop what doesn't.
 */
function normaliseGpa(raw) {
  const value = String(raw || '').trim();
  if (!value || /^unknown$/i.test(value)) return '';
  if (/^yes$/i.test(value)) return 'Above 2.75';
  if (/^no$/i.test(value)) return 'Below 2.75';
  return value;
}

function parseDate(raw) {
  const value = String(raw || '').trim();
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match.map(Number);
  return new Date(year, month - 1, day, 12);
}

export function parsePnmCsv(text) {
  const rows = parseCsv(text);
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell.trim() === 'First Name'));
  if (headerIndex === -1) {
    throw new Error('Could not find a header row containing "First Name".');
  }

  const header = rows[headerIndex].map((cell) => cell.trim());
  const col = (name) => header.findIndex((cell) => cell === name);
  const at = (row, name) => {
    const index = col(name);
    return index === -1 ? '' : String(row[index] ?? '').trim();
  };

  const pnms = [];
  const warnings = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const first = at(row, 'First Name');
    const last = at(row, 'Last Name');
    if (!first && !last) continue; // spacer or trailing blank row

    const name = [first, last].filter(Boolean).join(' ');
    if (!last) warnings.push(`Row ${i + 1}: "${first}" has no last name.`);

    const stageCell = at(row, 'Status');
    const stage = Number((stageCell.match(/^\((\d)\)/) ?? [])[1]);
    const status = STATUS_BY_STAGE[stage];
    if (!status) {
      warnings.push(`Row ${i + 1}: unrecognised status "${stageCell}" for ${name}; using identified.`);
    }

    const yearRaw = at(row, 'Year');
    const year = YEARS[yearRaw.toLowerCase()] ?? yearRaw;

    const sport = at(row, 'Sport');

    pnms.push({
      name,
      status: status ?? 'identified',
      year,
      major: at(row, 'Major'),
      sports: sport ? [sport] : [],
      gpa: normaliseGpa(at(row, 'GPA Above 2.75')),
      notes: at(row, 'Description and Notes'),
      leadNames: splitLeads(at(row, 'Lead')),
      addedOn: parseDate(at(row, 'Date Added')),
      // Nothing in the sheet carries these; they exist so the record is
      // complete and editable in the app.
      phone: '',
      email: '',
      hobbies: [],
      interests: [],
      socials: {},
      sourceEvent: '',
    });
  }

  return { pnms, warnings };
}

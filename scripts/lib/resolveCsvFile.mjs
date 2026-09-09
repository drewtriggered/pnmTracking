/**
 * Works out which file the user meant — and says something useful when it
 * cannot — before the import script asks for credentials or touches Firestore.
 *
 * A chapter officer gets the sheet out of Google Sheets and into a terminal,
 * and the path picks up damage on the way: the export is called "Potential New
 * Member List - Master Sheet.csv", the spaces break the argument in half unless
 * they are quoted, ~ does not expand once they are, Windows "Copy as path"
 * wraps the whole thing in quotes, and the download lands in ~/Downloads rather
 * than the repo. Every one of those ends as "cannot find the file", so undo
 * what can be undone and name the rest.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';

/** Thrown for anything the user can fix by re-running with a different path. */
export class CsvInputError extends Error {}

/** The chapter's sheet, committed next to the script. */
export const BUNDLED_CSV = 'pnm-list.csv';

const REAL_FS = { readdirSync, readFileSync, statSync };

/** Where a downloaded sheet actually tends to be, in the order worth looking. */
function searchDirs(cwd, home) {
  const dirs = [cwd, join(home, 'Downloads'), join(home, 'Desktop'), join(home, 'Documents'), home];
  return [...new Set(dirs)];
}

/** Strips the quoting and escaping a path collects between the file and argv. */
export function cleanPath(raw, home = homedir()) {
  let value = String(raw ?? '').trim();
  const first = value[0];
  if (value.length > 1 && (first === '"' || first === "'") && value.endsWith(first)) {
    value = value.slice(1, -1).trim();
  }
  value = value.replace(/\\ /g, ' ');
  if (value === '~') return home;
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(home, value.slice(2));
  return value;
}

/** "PNM List.csv", "pnm-list.csv" and "pnmlist.CSV" all key the same. */
export function looseKey(name) {
  return String(name)
    .toLowerCase()
    .replace(/\.csv$/, '')
    .replace(/[^a-z0-9]/g, '');
}

function statOf(path, fs) {
  try {
    return fs.statSync(path);
  } catch {
    return null;
  }
}

function csvFilesIn(dir, fs) {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.csv'))
      .map((name) => join(dir, name));
  } catch {
    return []; // no such directory, or not ours to read
  }
}

/** Quotes a path for the copy-paste command lines in the error messages. */
function quote(path) {
  return /[\s"']/.test(path) ? `"${path}"` : path;
}

/** Suggest the short form for a file sitting in the repo, the full one for the rest. */
function display(path, cwd) {
  const short = relative(cwd, path);
  return short && !short.startsWith('..') ? short : path;
}

/**
 * The candidate strings to try, best first.
 *
 * `--file PNM List.csv` unquoted arrives as file="PNM" plus a positional
 * "List.csv", so joining them back up recovers the name the user typed. A bare
 * `npm run import:pnms -- my-sheet.csv` is worth honouring too.
 */
function candidatesFrom(file, positionals) {
  const asked = [];
  if (file !== undefined && String(file).trim() !== '') {
    asked.push(String(file));
    if (positionals.length > 0) asked.push([file, ...positionals].join(' '));
  } else if (positionals.length > 0) {
    asked.push(positionals.join(' '));
    if (positionals.length > 1) asked.push(...positionals);
  }
  return asked;
}

function suggestionsFor(asked, cwd, home, fs) {
  const keys = new Set(asked.map((name) => looseKey(basename(name))));
  const found = searchDirs(cwd, home).flatMap((dir) => csvFilesIn(dir, fs));
  const near = found.filter((path) => keys.has(looseKey(basename(path))));
  return { near, found };
}

function notFoundMessage({ asked, tried, cwd, home, fs }) {
  const { near, found } = suggestionsFor(asked, cwd, home, fs);
  // The fullest candidate is the one the user meant: with the quotes missing,
  // "PNM List.csv" reaches us as "PNM" plus the rest, and echoing back only
  // the first word reads like the script lost half the name.
  const raw = asked.reduce((longest, name) => (name.length > longest.length ? name : longest));
  const lines = [
    'Could not find that CSV.',
    '',
    `  you asked for   ${raw}`,
    ...tried.map((path, i) => `  ${i === 0 ? 'I looked at    ' : '               '} ${path}`),
    '',
  ];

  const offers = near.length > 0 ? near : found;
  if (offers.length > 0) {
    lines.push(near.length > 0 ? 'Did you mean:' : 'CSV files I can see:', '');
    for (const path of offers.slice(0, 6)) {
      lines.push(`  npm run import:pnms -- --file ${quote(display(path, cwd))}`);
    }
    lines.push('');
  }

  lines.push(
    `Paths are relative to ${cwd}. A name with spaces has to stay inside quotes,`,
    'and ~ does not expand inside them — write the full path instead.',
  );
  if (statOf(join(cwd, BUNDLED_CSV), fs)?.isFile()) {
    lines.push(
      '',
      `Your chapter sheet is already committed here as ${BUNDLED_CSV}, so`,
      '`npm run import:pnms` on its own reads that.',
    );
  }
  return lines.join('\n');
}

/**
 * Turns the parsed arguments into a readable file, or throws a CsvInputError
 * saying what to run instead. Returns the path plus any notes worth printing.
 */
export function resolveCsvFile({
  file,
  positionals = [],
  cwd = process.cwd(),
  home = homedir(),
  fs = REAL_FS,
} = {}) {
  const notes = [];
  const asked = candidatesFrom(file, positionals);

  if (asked.length === 0) {
    const bundled = join(cwd, BUNDLED_CSV);
    if (statOf(bundled, fs)?.isFile()) {
      notes.push(`No --file given, so reading ${BUNDLED_CSV} — the sheet committed to this repo.`);
      return { path: bundled, notes };
    }
    throw new CsvInputError(
      'Usage: npm run import:pnms -- --file "your-sheet.csv" [--commit] [--create-leads]\n\n' +
        `No file was given and there is no ${BUNDLED_CSV} in ${cwd} to fall back to.`,
    );
  }

  const tried = [];
  const directories = [];
  for (const candidate of asked) {
    const cleaned = cleanPath(candidate, home);
    if (!cleaned) continue;
    const path = isAbsolute(cleaned) ? cleaned : resolve(cwd, cleaned);
    if (tried.includes(path)) continue;
    tried.push(path);

    const stat = statOf(path, fs);
    if (stat?.isFile()) {
      if (candidate !== asked[0]) {
        notes.push(`Read "${candidate}" as one filename. Quote it next time: --file ${quote(cleaned)}`);
      }
      return { path, notes };
    }
    if (stat?.isDirectory()) directories.push(path);
  }

  if (directories.length > 0) {
    const dir = directories[0];
    const inside = csvFilesIn(dir, fs);
    throw new CsvInputError(
      `${dir} is a folder, not a file.\n\n` +
        (inside.length > 0
          ? `The CSVs in it:\n\n${inside
              .slice(0, 6)
              .map((path) => `  npm run import:pnms -- --file ${quote(display(path, cwd))}`)
              .join('\n')}`
          : 'There are no CSV files in it.'),
    );
  }

  throw new CsvInputError(
    notFoundMessage({
      asked: asked.map((candidate) => cleanPath(candidate, home)),
      tried,
      cwd,
      home,
      fs,
    }),
  );
}

/**
 * Reads the file as text, rejecting the two things that look like a CSV to a
 * person and not to a parser: a still-binary workbook, and an empty export.
 */
export function readCsvText(path, fs = REAL_FS) {
  const buffer = fs.readFileSync(path);
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer), 'utf8');

  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b; // PK -> xlsx, ods, numbers
  const oleWorkbook = bytes[0] === 0xd0 && bytes[1] === 0xcf; // legacy .xls
  if (zip || oleWorkbook) {
    throw new CsvInputError(
      `${path} is a spreadsheet file, not a CSV.\n\n` +
        'Google Sheets -> File -> Download -> Comma-separated values (.csv)\n' +
        'Excel -> File -> Save As -> CSV UTF-8, then pass that file.',
    );
  }

  let text = bytes.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM from an Excel export
  if (text.trim() === '') throw new CsvInputError(`${path} is empty.`);
  return text;
}

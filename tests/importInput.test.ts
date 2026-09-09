import { describe, expect, it } from 'vitest';
// @ts-expect-error - plain ESM helper shared with the import script
import {
  CsvInputError,
  cleanPath,
  looseKey,
  readCsvText,
  resolveCsvFile,
} from '../scripts/lib/resolveCsvFile.mjs';

const CWD = '/repo';
const HOME = '/home/drew';

/** A fake disk: directories are inferred from the file paths in it. */
function diskOf(files: string[]) {
  const dirs = new Set(files.map((path) => path.slice(0, path.lastIndexOf('/'))));
  return {
    statSync(path: string) {
      if (files.includes(path)) return { isFile: () => true, isDirectory: () => false };
      if (dirs.has(path)) return { isFile: () => false, isDirectory: () => true };
      throw new Error(`ENOENT: ${path}`);
    },
    readdirSync(dir: string) {
      if (!dirs.has(dir)) throw new Error(`ENOENT: ${dir}`);
      return files
        .filter((path) => path.slice(0, path.lastIndexOf('/')) === dir)
        .map((path) => path.slice(path.lastIndexOf('/') + 1));
    },
  };
}

const SHEET = '/home/drew/Downloads/Potential New Member List - Master Sheet.csv';
const disk = diskOf([`${CWD}/pnm-list.csv`, SHEET]);
const resolve = (args: Record<string, unknown>) =>
  resolveCsvFile({ cwd: CWD, home: HOME, fs: disk, ...args });

describe('cleaning up the path as typed', () => {
  it('expands ~, which the shell leaves alone inside quotes', () => {
    expect(cleanPath('~/Downloads/sheet.csv', HOME)).toBe('/home/drew/Downloads/sheet.csv');
  });

  it('drops quotes that came along with a pasted path', () => {
    expect(cleanPath('"/repo/PNM List.csv"', HOME)).toBe('/repo/PNM List.csv');
    expect(cleanPath("'sheet.csv'", HOME)).toBe('sheet.csv');
  });

  it('undoes the escaping a drag-and-drop adds', () => {
    expect(cleanPath('PNM\\ List.csv', HOME)).toBe('PNM List.csv');
  });

  it('keeps every way of writing the same name together', () => {
    expect(looseKey('PNM List.csv')).toBe(looseKey('pnm-list.csv'));
    expect(looseKey('pnm_list.CSV')).toBe(looseKey('PnmList.csv'));
    expect(looseKey('other.csv')).not.toBe(looseKey('pnm-list.csv'));
  });
});

describe('finding the file the user meant', () => {
  it('takes a name relative to the repo', () => {
    expect(resolve({ file: 'pnm-list.csv' }).path).toBe('/repo/pnm-list.csv');
  });

  it('puts a filename back together when the quotes were left off', () => {
    const found = resolve({
      file: '/home/drew/Downloads/Potential',
      positionals: ['New', 'Member', 'List', '-', 'Master', 'Sheet.csv'],
    });
    expect(found.path).toBe(SHEET);
    expect(found.notes.join(' ')).toMatch(/Quote it next time/);
  });

  it('falls back to the sheet committed to the repo, and says so', () => {
    const found = resolve({});
    expect(found.path).toBe('/repo/pnm-list.csv');
    expect(found.notes.join(' ')).toMatch(/pnm-list\.csv/);
  });

  it('accepts the file as a bare argument', () => {
    expect(resolve({ positionals: ['pnm-list.csv'] }).path).toBe('/repo/pnm-list.csv');
  });
});

describe('when it cannot find the file', () => {
  it('names the near miss in the repo instead of just failing', () => {
    expect(() => resolve({ file: 'pnmlist.csv' })).toThrow(CsvInputError);
    try {
      resolve({ file: 'pnmlist.csv' });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('/repo/pnmlist.csv'); // where it looked
      expect(message).toContain('--file pnm-list.csv'); // what to run instead
    }
  });

  it('looks in Downloads, where the export actually landed', () => {
    try {
      resolve({ file: 'Potential New Member List - Master Sheet.csv' });
      throw new Error('should not resolve');
    } catch (error) {
      expect((error as Error).message).toContain(`--file "${SHEET}"`);
    }
  });

  it('lists the CSVs inside a folder passed by mistake', () => {
    try {
      resolve({ file: '/home/drew/Downloads' });
      throw new Error('should not resolve');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('is a folder, not a file');
      expect(message).toContain(SHEET);
    }
  });
});

describe('reading the file', () => {
  const textOf = (body: Buffer) => readCsvText('sheet.csv', { readFileSync: () => body });

  it('strips the BOM an Excel export leaves on the first cell', () => {
    expect(textOf(Buffer.from(`\ufeffFirst Name,Last Name`, 'utf8'))).toBe('First Name,Last Name');
  });

  it('says an .xlsx is an .xlsx rather than parsing the zip', () => {
    expect(() => textOf(Buffer.from('PKbinary', 'binary'))).toThrow(/spreadsheet file, not a CSV/);
  });

  it('rejects an empty export', () => {
    expect(() => textOf(Buffer.from('  \n', 'utf8'))).toThrow(/empty/);
  });
});

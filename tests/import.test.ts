import { describe, expect, it } from 'vitest';
// @ts-expect-error - plain ESM helper shared with the import script
import { parsePnmCsv, parseCsv, splitLeads } from '../scripts/lib/parsePnmCsv.mjs';

/** The real sheet's shape: title block, header on row 5, trailing blanks. */
const SHEET = `Potential New Member List,,,,,,,,,,,,Today's Date,9/9/2026,,
,,,,,,,,,,,,,,,
,,,,,,,,,,,,In 3 weeks,9/30/2026,,
,,,,,,,,,,,,,,,
Need to Discuss,Status,First Name,Last Name,Lead,Year,Major,Sport,GPA Above 2.75,Bids Remaing,Date Added,Date of Extension,Extension Expires,,Description and Notes,
,,,,,,,,,,,,,,,
,(5) To Receive Bid,Seth,Aubin,Koen,Soph,Construction Management,Wrestling,2.6,2,8/24/2026,,,,Work on his GPA.,
,(0) Notice to Remove,Hank,Fields,"Lutz, Ricky",Soph,MET,,Unknown,2,8/30/2026,,,,,
,(2) Introduce to Others,Hayden,Amstein,David & Ricky,Soph,Health Science,Cross Country,Yes,2,8/30/2026,,,,,
,(1) New Name,Adam,,Drew,Fresh,Comp Sci,Bowling,Unknown,2,9/7/2026,,,,,
,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,
`;

describe('reading the chapter spreadsheet', () => {
  const { pnms, warnings } = parsePnmCsv(SHEET);

  it('finds the header below the title block and skips spacer rows', () => {
    expect(pnms).toHaveLength(4);
    expect(pnms.map((p: { name: string }) => p.name)).toEqual([
      'Seth Aubin',
      'Hank Fields',
      'Hayden Amstein',
      'Adam',
    ]);
  });

  it('maps the sheet stages onto app statuses', () => {
    expect(pnms.map((p: { status: string }) => p.status)).toEqual([
      'bid extended',
      'dropped',
      'contacted',
      'identified',
    ]);
  });

  it('keeps a GPA that says something and drops one that does not', () => {
    expect(pnms[0].gpa).toBe('2.6');
    expect(pnms[1].gpa).toBe('');           // "Unknown"
    expect(pnms[2].gpa).toBe('Above 2.75'); // "Yes", against the column's threshold
  });

  it('carries year, major, sport and notes across', () => {
    expect(pnms[0]).toMatchObject({
      year: 'Sophomore',
      major: 'Construction Management',
      sports: ['Wrestling'],
      notes: 'Work on his GPA.',
    });
    expect(pnms[1].sports).toEqual([]);
  });

  it('reads Date Added as a real date', () => {
    expect(pnms[0].addedOn?.getFullYear()).toBe(2026);
    expect(pnms[0].addedOn?.getMonth()).toBe(7); // August
    expect(pnms[0].addedOn?.getDate()).toBe(24);
  });

  it('warns about a missing last name rather than dropping the row', () => {
    expect(pnms[3].name).toBe('Adam');
    expect(warnings.join(' ')).toMatch(/Adam.*no last name/);
  });
});

describe('lead cells', () => {
  it('splits every way the sheet writes more than one name', () => {
    expect(splitLeads('Koen')).toEqual(['Koen']);
    expect(splitLeads('Lutz, Koen')).toEqual(['Lutz', 'Koen']);
    expect(splitLeads('David & Fish')).toEqual(['David', 'Fish']);
    expect(splitLeads('Alex, David, Khit')).toEqual(['Alex', 'David', 'Khit']);
    expect(splitLeads('')).toEqual([]);
  });
});

describe('csv reader', () => {
  it('keeps commas inside quoted cells', () => {
    expect(parseCsv('a,"b,c",d')[0]).toEqual(['a', 'b,c', 'd']);
  });

  it('handles escaped quotes', () => {
    expect(parseCsv('a,"say ""hi""",b')[0]).toEqual(['a', 'say "hi"', 'b']);
  });
});

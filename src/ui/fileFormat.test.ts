import { describe, expect, it } from 'vitest';
import { exampleDefaults } from '../calc/testFixtures.js';
import { buildExport, DEFAULTS_FORMAT, EXPORT_FORMAT, exportFileName, parseImport } from './fileFormat.js';
import { he } from './i18n/he.js';
import { seedScenarios } from './store.js';

const ex = () => exampleDefaults();
const hebrew = /[֐-׿]/;

describe('parseImport', () => {
  it('parses the example defaults file with a format field', () => {
    const r = parseImport(JSON.stringify({ format: DEFAULTS_FORMAT, ...ex() }));
    expect('kind' in r && r.kind).toBe('defaults');
    if ('kind' in r) expect(r.defaults.presets).toHaveLength(3);
  });

  it('parses a defaults file without a format field', () => {
    const { inputs, presets } = ex();
    const r = parseImport(JSON.stringify({ inputs, presets }));
    expect('kind' in r && r.kind).toBe('defaults');
    if ('kind' in r) expect(r.defaults.notes).toEqual({});
  });

  it('parses an export file', () => {
    const d = ex();
    const defaults = { inputs: d.inputs, presets: d.presets, notes: d.notes ?? {} };
    const file = buildExport(defaults, seedScenarios(defaults), '1.2.3');
    expect(file.format).toBe(EXPORT_FORMAT);
    const r = parseImport(JSON.stringify(file));
    expect('kind' in r && r.kind).toBe('export');
    if ('kind' in r && r.kind === 'export') expect(r.scenarios).toHaveLength(3);
  });

  it('rejects malformed input with Hebrew messages', () => {
    const d = ex();
    const bad: string[] = [
      'not json {',
      '[]',
      JSON.stringify({ presets: d.presets }),
      JSON.stringify({ inputs: { ...d.inputs, studyFunds: 5 }, presets: d.presets }),
      JSON.stringify({ inputs: d.inputs }),
      JSON.stringify({ format: 'something/else', inputs: d.inputs, presets: d.presets }),
      // 1e999 parses to Infinity
      JSON.stringify({ inputs: d.inputs, presets: d.presets }).replace(/"cashReserve":\s*\d+/, '"cashReserve":1e999'),
    ];
    for (const text of bad) {
      const r = parseImport(text);
      expect('error' in r, text.slice(0, 40)).toBe(true);
      if ('error' in r) expect(r.error).toMatch(hebrew);
    }
    const inf = parseImport(bad[6]!);
    expect('error' in inf && inf.error).toBe(he.file.badNumber);
  });

  it('names the export file by date', () => {
    expect(exportFileName(new Date(2026, 10, 5))).toBe('financing-planner-2026-11-05.json');
  });
});

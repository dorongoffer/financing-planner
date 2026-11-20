import type { Inputs, Preset } from '../calc/types.js';
import { he } from './i18n/he.js';
import type { Defaults, Scenario } from './types.js';

export const DEFAULTS_FORMAT = 'financing-planner/defaults-1';
export const EXPORT_FORMAT = 'financing-planner/export-1';

export interface DefaultsFile {
  format: typeof DEFAULTS_FORMAT;
  inputs: Inputs;
  presets: Preset[];
  notes?: Record<string, string>;
}

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  exportedAt: string;
  version: string;
  defaults: Defaults;
  scenarios: Scenario[];
}

export type ParsedImport =
  | { kind: 'defaults'; defaults: Defaults }
  | { kind: 'export'; defaults: Defaults; scenarios: Scenario[] }
  | { error: string };

const INPUT_KEYS: (keyof Inputs)[] = [
  'sale', 'rsu', 'studyFunds', 'savings', 'custom', 'purchase', 'renovation', 'cashReserve', 'mortgage',
];
const ARRAY_KEYS: (keyof Inputs)[] = ['studyFunds', 'savings', 'custom'];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function allNumbersFinite(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(allNumbersFinite);
  if (isObject(v)) return Object.values(v).every(allNumbersFinite);
  return true;
}

/** Returns an error string, or null when `v` looks like Inputs. */
function checkInputs(v: unknown): string | null {
  if (!isObject(v)) return he.file.missingInputs;
  for (const k of INPUT_KEYS) if (!(k in v)) return he.file.missingField(k);
  for (const k of ARRAY_KEYS) if (!Array.isArray(v[k])) return he.file.notArray(k);
  if (!allNumbersFinite(v)) return he.file.badNumber;
  return null;
}

function checkPresets(v: unknown): string | null {
  if (!Array.isArray(v)) return he.file.missingPresets;
  for (const p of v) {
    if (!isObject(p) || typeof p.name !== 'string' || !isObject(p.overrides)) return he.file.badPreset;
    if (!allNumbersFinite(p.overrides)) return he.file.badNumber;
  }
  return null;
}

function toDefaults(o: Record<string, unknown>): Defaults | string {
  const e = checkInputs(o.inputs) ?? checkPresets(o.presets);
  if (e) return e;
  const notes = isObject(o.notes)
    ? Object.fromEntries(Object.entries(o.notes).filter(([, x]) => typeof x === 'string')) as Record<string, string>
    : {};
  return { inputs: o.inputs as Inputs, presets: o.presets as Preset[], notes };
}

export function parseImport(text: string): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: he.file.notJson };
  }
  if (!isObject(raw)) return { error: he.file.notObject };

  if (raw.format === EXPORT_FORMAT) {
    if (!isObject(raw.defaults)) return { error: he.file.missingDefaults };
    const d = toDefaults(raw.defaults);
    if (typeof d === 'string') return { error: d };
    if (!Array.isArray(raw.scenarios)) return { error: he.file.notArray('scenarios') };
    const scenarios: Scenario[] = [];
    for (const s of raw.scenarios) {
      if (!isObject(s) || typeof s.id !== 'string' || typeof s.name !== 'string') return { error: he.file.badScenario };
      const e = checkInputs(s.inputs);
      if (e) return { error: e };
      const now = new Date().toISOString();
      scenarios.push({
        id: s.id,
        name: s.name,
        inputs: s.inputs as Inputs,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : now,
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : now,
      });
    }
    return { kind: 'export', defaults: d, scenarios };
  }

  if (raw.format !== undefined && raw.format !== DEFAULTS_FORMAT) return { error: he.file.unknownFormat };
  const d = toDefaults(raw);
  if (typeof d === 'string') return { error: d };
  return { kind: 'defaults', defaults: d };
}

export function buildExport(defaults: Defaults, scenarios: Scenario[], version: string, now = new Date()): ExportFile {
  return {
    format: EXPORT_FORMAT,
    exportedAt: now.toISOString(),
    version,
    defaults: { inputs: defaults.inputs, presets: defaults.presets, notes: defaults.notes },
    scenarios,
  };
}

export function exportFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `financing-planner-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

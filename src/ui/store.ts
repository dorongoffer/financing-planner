import { applyOverrides } from '../calc/presets.js';
import type { Inputs } from '../calc/types.js';
import example from '../../data/defaults.example.json';
import type { Defaults, Scenario } from './types.js';

export const STORAGE_KEY = 'financing-planner:v1';

export interface StoreState {
  defaults: Defaults;
  scenarios: Scenario[];
  activeScenarioId: string | null;
  savedAt: string | null;
  /** True while the bundled fake example figures are in use. */
  usingExample: boolean;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function getStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function exampleDefaults(): Defaults {
  const e = example as unknown as { inputs: Inputs; presets: Defaults['presets']; notes?: Record<string, string> };
  return structuredClone({ inputs: e.inputs, presets: e.presets, notes: e.notes ?? {} });
}

export function seedScenarios(defaults: Defaults, now = new Date().toISOString()): Scenario[] {
  return defaults.presets.map((p) => ({
    id: newId(),
    name: p.name,
    inputs: applyOverrides(defaults.inputs, p.overrides ?? {}),
    createdAt: now,
    updatedAt: now,
  }));
}

export function initialState(): StoreState {
  const defaults = exampleDefaults();
  return { defaults, scenarios: seedScenarios(defaults), activeScenarioId: null, savedAt: null, usingExample: true };
}

function isStored(v: unknown): v is StoreState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  const d = o.defaults as Record<string, unknown> | undefined;
  return (
    typeof d === 'object' && d !== null && typeof d.inputs === 'object' && d.inputs !== null &&
    Array.isArray(d.presets) && Array.isArray(o.scenarios)
  );
}

export function loadState(storage: StorageLike | null = getStorage()): StoreState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (isStored(p)) {
        const o = p as unknown as Partial<StoreState>;
        const scenarios = o.scenarios as Scenario[];
        const active = scenarios.some((s) => s.id === o.activeScenarioId) ? (o.activeScenarioId as string) : null;
        return {
          defaults: { ...o.defaults!, notes: o.defaults!.notes ?? {} },
          scenarios,
          activeScenarioId: active,
          savedAt: o.savedAt ?? null,
          usingExample: o.usingExample === true,
        };
      }
    }
  } catch {
    /* fall through to the example state */
  }
  return initialState();
}

/** Writes the state; returns the state with a fresh savedAt (unchanged if storage is unavailable). */
export function saveState(state: StoreState, storage: StorageLike | null = getStorage()): StoreState {
  if (!storage) return state;
  const next = { ...state, savedAt: new Date().toISOString() };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return state;
  }
  return next;
}

export function clearState(storage: StorageLike | null = getStorage()): StoreState {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return initialState();
}

/** Replace defaults; presets are re-seeded from the file, user-made scenarios are kept. */
export function importDefaults(state: StoreState, defaults: Defaults): StoreState {
  const presetNames = new Set(defaults.presets.map((p) => p.name));
  const kept = state.scenarios.filter((s) => !presetNames.has(s.name) && !state.defaults.presets.some((p) => p.name === s.name));
  const scenarios = [...seedScenarios(defaults), ...kept];
  return { ...state, defaults, scenarios, activeScenarioId: null, usingExample: false };
}

export function importExport(state: StoreState, defaults: Defaults, scenarios: Scenario[]): StoreState {
  return { ...state, defaults, scenarios, activeScenarioId: null, usingExample: false };
}

export function upsertScenario(state: StoreState, s: Scenario): StoreState {
  const has = state.scenarios.some((x) => x.id === s.id);
  return { ...state, scenarios: has ? state.scenarios.map((x) => (x.id === s.id ? s : x)) : [...state.scenarios, s] };
}

export function createScenario(state: StoreState, name: string, inputs: Inputs): { state: StoreState; scenario: Scenario } {
  const now = new Date().toISOString();
  const scenario: Scenario = { id: newId(), name, inputs: structuredClone(inputs), createdAt: now, updatedAt: now };
  return { state: { ...upsertScenario(state, scenario), activeScenarioId: scenario.id }, scenario };
}

export function updateScenario(state: StoreState, id: string, patch: { name?: string; inputs?: Inputs }): StoreState {
  const cur = state.scenarios.find((s) => s.id === id);
  if (!cur) return state;
  return upsertScenario(state, {
    ...cur,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.inputs !== undefined ? { inputs: structuredClone(patch.inputs) } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export function duplicateScenario(state: StoreState, id: string, suffix: string): { state: StoreState; scenario: Scenario } | null {
  const cur = state.scenarios.find((s) => s.id === id);
  return cur ? createScenario(state, `${cur.name} ${suffix}`, cur.inputs) : null;
}

export function deleteScenario(state: StoreState, id: string): StoreState {
  return {
    ...state,
    scenarios: state.scenarios.filter((s) => s.id !== id),
    activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
  };
}

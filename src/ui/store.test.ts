import { describe, expect, it } from 'vitest';
import { exampleDefaults as fixture } from '../calc/testFixtures.js';
import {
  clearState,
  createScenario,
  deleteScenario,
  importDefaults,
  importExport,
  initialState,
  loadState,
  saveState,
  STORAGE_KEY,
  updateScenario,
} from './store.js';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const throwing = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('denied'); },
  removeItem: () => { throw new Error('denied'); },
};

describe('store', () => {
  it('first run seeds the three presets from the example', () => {
    const s = loadState(fakeStorage());
    expect(s.usingExample).toBe(true);
    expect(s.scenarios.map((x) => x.name)).toEqual(fixture().presets.map((p) => p.name));
    expect(s.scenarios[0]!.inputs.sale.salePrice).not.toBe(s.defaults.inputs.sale.salePrice);
    expect(s.activeScenarioId).toBeNull();
  });

  it('save / rename / delete round-trip through storage', () => {
    const st = fakeStorage();
    let s = loadState(st);
    const made = createScenario(s, 'בדיקה', s.defaults.inputs);
    s = saveState(made.state, st);
    expect(st.m.has(STORAGE_KEY)).toBe(true);
    expect(loadState(st).scenarios.some((x) => x.name === 'בדיקה')).toBe(true);
    expect(loadState(st).activeScenarioId).toBe(made.scenario.id);

    s = saveState(updateScenario(s, made.scenario.id, { name: 'חדש' }), st);
    expect(loadState(st).scenarios.map((x) => x.name)).toContain('חדש');

    s = saveState(deleteScenario(s, made.scenario.id), st);
    const back = loadState(st);
    expect(back.scenarios.map((x) => x.name)).not.toContain('חדש');
    expect(back.activeScenarioId).toBeNull();
  });

  it('importing defaults re-seeds presets and keeps user scenarios', () => {
    let s = initialState();
    s = createScenario(s, 'שלי', s.defaults.inputs).state;
    const d = fixture();
    const next = importDefaults(s, {
      inputs: d.inputs,
      presets: [{ name: 'חדש א', overrides: { 'sale.salePrice': 1234567 } }],
      notes: {},
    });
    expect(next.usingExample).toBe(false);
    expect(next.scenarios.map((x) => x.name)).toEqual(['חדש א', 'שלי']);
    expect(next.scenarios[0]!.inputs.sale.salePrice).toBe(1234567);
  });

  it('importing an export replaces everything', () => {
    const s = initialState();
    const next = importExport(s, s.defaults, []);
    expect(next.scenarios).toEqual([]);
    expect(next.usingExample).toBe(false);
  });

  it('clear returns to the example state', () => {
    const st = fakeStorage();
    saveState(importExport(initialState(), initialState().defaults, []), st);
    const s = clearState(st);
    expect(st.m.has(STORAGE_KEY)).toBe(false);
    expect(s.usingExample).toBe(true);
    expect(s.scenarios).toHaveLength(3);
  });

  it('tolerates unavailable or corrupt storage', () => {
    expect(loadState(throwing).usingExample).toBe(true);
    expect(loadState(null).scenarios).toHaveLength(3);
    const s = initialState();
    expect(saveState(s, throwing)).toBe(s);
    expect(() => clearState(throwing)).not.toThrow();
    const st = fakeStorage();
    st.m.set(STORAGE_KEY, '{oops');
    expect(loadState(st).usingExample).toBe(true);
  });
});

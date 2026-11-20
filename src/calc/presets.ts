import type { Inputs, Preset } from './types.js';

/** Apply dot-path overrides ("sale.salePrice": 1) to a deep clone. Never mutates. */
export function applyOverrides(
  inputs: Inputs,
  overrides: Record<string, number | string | boolean | null>,
): Inputs {
  const out = structuredClone(inputs) as unknown as Record<string, unknown>;
  for (const [path, value] of Object.entries(overrides)) {
    const keys = path.split('.');
    let node: unknown = out;
    for (const k of keys.slice(0, -1)) {
      if (node === null || typeof node !== 'object') { node = undefined; break; }
      node = (node as Record<string, unknown>)[k];
    }
    const last = keys[keys.length - 1];
    if (node && typeof node === 'object' && last !== undefined) (node as Record<string, unknown>)[last] = value;
  }
  return out as unknown as Inputs;
}

export function renderPreset(inputs: Inputs, preset: Preset): Inputs {
  return applyOverrides(inputs, preset.overrides);
}

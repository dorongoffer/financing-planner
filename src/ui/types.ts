import type { Inputs, Preset } from '../calc/types.js';

export interface Scenario {
  id: string;
  name: string;
  inputs: Inputs;
  createdAt: string;
  updatedAt: string;
}

/** The household's default figures: what the editor starts from and what presets override. */
export interface Defaults {
  inputs: Inputs;
  presets: Preset[];
  notes: Record<string, string>;
}

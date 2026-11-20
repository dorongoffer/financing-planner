/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DefaultsFile, Inputs } from './types.js';

/** The fake example defaults (never the local file). Test-only helper. */
export function exampleDefaults(): DefaultsFile {
  return JSON.parse(readFileSync(join(process.cwd(), 'data/defaults.example.json'), 'utf8')) as DefaultsFile;
}

export function exampleInputs(): Inputs {
  return exampleDefaults().inputs;
}

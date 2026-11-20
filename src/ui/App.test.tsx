import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from './App.js';
import { exampleDefaults } from '../calc/testFixtures.js';
import { he } from './i18n/he.js';

describe('App', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('renders headline, chart, inputs, tornado, banner, version and disclaimer', () => {
    render(<App />);
    expect(screen.getByTestId('mortgage-value').textContent).toMatch(/₪/);
    expect(screen.getByText(he.chart.title)).toBeInTheDocument();
    expect(screen.getByText(he.sens.title)).toBeInTheDocument();
    expect(screen.getByText(he.exampleBanner)).toBeInTheDocument();
    expect(screen.getByText(he.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(he.version))).toBeInTheDocument();
  });

  it('toggling a source changes the headline mortgage', async () => {
    render(<App />);
    const before = screen.getByTestId('mortgage-value').textContent;
    fireEvent.click(screen.getByLabelText(`${he.inputs.enabled}: ${he.src.rsu}`));
    await waitFor(() => expect(screen.getByTestId('mortgage-value').textContent).not.toBe(before));
  });

  it('import via file input replaces the example banner', async () => {
    render(<App />);
    const file = new File([JSON.stringify(exampleDefaults())], 'defaults.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText(he.data.import, { selector: 'input' }), { target: { files: [file] } });
    fireEvent.click(await screen.findByText(he.data.proceed));
    await waitFor(() => expect(screen.queryByText(he.exampleBanner)).not.toBeInTheDocument());
    expect(screen.getByTestId('mortgage-value').textContent).toMatch(/₪/);
    expect(localStorage.getItem('financing-planner:v1')).toContain('"usingExample":false');
  });

  it('shows a Hebrew error for a bad file and keeps the banner', async () => {
    render(<App />);
    const file = new File(['nope'], 'x.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText(he.data.import, { selector: 'input' }), { target: { files: [file] } });
    expect(await screen.findByText(he.file.notJson)).toBeInTheDocument();
    expect(screen.getByText(he.exampleBanner)).toBeInTheDocument();
  });

  it('saves a named scenario through the inline form', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(he.scen.save));
    fireEvent.change(screen.getByLabelText(he.scen.nameLabel), { target: { value: 'בדיקה' } });
    fireEvent.click(screen.getByText(he.scen.ok));
    expect(await screen.findByRole('option', { name: 'בדיקה' })).toBeInTheDocument();
    expect(localStorage.getItem('financing-planner:v1')).toContain('בדיקה');
  });
});

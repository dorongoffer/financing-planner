import { useMemo } from 'react';
import { compute } from '../../calc/compute.js';
import { formatIls, formatPct } from '../../calc/format.js';
import type { Scenario } from '../types.js';
import { he } from '../i18n/he.js';

interface Props {
  scenarios: Scenario[];
  ids: string[];
  onChange: (ids: string[]) => void;
}

const MAX = 3;

export function ComparePanel({ scenarios, ids, onChange }: Props) {
  const cols = useMemo(
    () =>
      ids
        .map((id) => scenarios.find((s) => s.id === id))
        .filter((s): s is Scenario => Boolean(s))
        .map((s) => ({ s, r: compute(s.inputs) })),
    [scenarios, ids],
  );
  const maxMortgage = Math.max(1, ...cols.map((c) => c.r.mortgage));
  const toggle = (id: string) => {
    if (ids.includes(id)) onChange(ids.filter((x) => x !== id));
    else if (ids.length < MAX) onChange([...ids, id]);
  };
  const rows: [string, (c: (typeof cols)[number]) => string][] = [
    [he.head.mortgage, (c) => formatIls(c.r.mortgage)],
    [he.head.monthly, (c) => formatIls(c.r.monthlyPayment)],
    [he.head.ltv, (c) => formatPct(c.r.ltv)],
    [he.head.surplus, (c) => formatIls(c.r.surplus)],
    [he.chart.uses, (c) => formatIls(c.r.totalUses)],
    [he.chart.sources, (c) => formatIls(c.r.totalNetSources)],
  ];
  return (
    <section className="panel compare" aria-labelledby="cmp-title">
      <h2 id="cmp-title">{he.scen.compare}</h2>
      <p className="muted">{he.scen.pickCompare}</p>
      <div className="picks">
        {scenarios.map((s) => (
          <label key={s.id} className={ids.includes(s.id) ? 'chip on' : 'chip'}>
            <input
              type="checkbox"
              checked={ids.includes(s.id)}
              disabled={!ids.includes(s.id) && ids.length >= MAX}
              onChange={() => toggle(s.id)}
            />
            {s.name}
          </label>
        ))}
      </div>
      {cols.length > 0 && (
        <div className="cmptable" style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(0, 1fr))` }}>
          <div />
          {cols.map((c) => (
            <div key={c.s.id} className="cmphead">{c.s.name}</div>
          ))}
          {rows.map(([label, f]) => (
            <div className="cmprow" key={label}>
              <div className="cmplabel">{label}</div>
              {cols.map((c) => (
                <div key={c.s.id} className="cmpcell">{f(c)}</div>
              ))}
            </div>
          ))}
          <div className="cmplabel">{he.chart.mortgage}</div>
          {cols.map((c) => (
            <div key={c.s.id} className="cmpbar">
              <div className="cmpbarfill" style={{ width: `${(c.r.mortgage / maxMortgage) * 100}%` }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { useMemo } from 'react';
import { formatIls } from '../../calc/format.js';
import { sensitivity } from '../../calc/sensitivity.js';
import type { Inputs } from '../../calc/types.js';
import { he } from '../i18n/he.js';

const signed = (n: number) => `${n < 0 ? '−' : '+'}${formatIls(Math.abs(n))}`;

export function Tornado({ inputs }: { inputs: Inputs }) {
  const rows = useMemo(() => sensitivity(inputs), [inputs]);
  const maxAbs = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.deltaLow), Math.abs(r.deltaHigh)]));
  const bar = (delta: number) => {
    const w = (Math.abs(delta) / maxAbs) * 50;
    return { left: `${delta < 0 ? 50 - w : 50}%`, width: `${w}%` };
  };
  return (
    <section className="panel tornado" aria-labelledby="sens-title">
      <h2 id="sens-title">{he.sens.title}</h2>
      {rows.map((r) => (
        <div className="trow" key={r.id}>
          <div className="tlabel">{r.label}</div>
          <div className="ttrack" dir="ltr">
            <div className="tbase" />
            <div className="tbar lo" style={bar(r.deltaLow)} title={`${r.lowLabel}: ${signed(r.deltaLow)}`} />
            <div className="tbar hi" style={bar(r.deltaHigh)} title={`${r.highLabel}: ${signed(r.deltaHigh)}`} />
          </div>
          <div className="tvals" dir="ltr">
            <span>{r.lowLabel}: <b>{signed(r.deltaLow)}</b></span>
            <span>{r.highLabel}: <b>{signed(r.deltaHigh)}</b></span>
          </div>
        </div>
      ))}
    </section>
  );
}

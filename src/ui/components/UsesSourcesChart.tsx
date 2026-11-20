import { useState } from 'react';
import { formatIls } from '../../calc/format.js';
import type { Results } from '../../calc/types.js';
import { he } from '../i18n/he.js';

interface Seg {
  key: string;
  label: string;
  amount: number;
  color: number;
  gross?: number;
  tax?: number;
  net?: number;
  mortgage?: boolean;
}

const W = 400;
const H = 360;
const TOP = 28;
const BAR_W = 140;
const USES_X = 230;
const SRC_X = 30;

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function Bar({ segs, x, scale, selected, onSelect }: {
  segs: Seg[];
  x: number;
  scale: number;
  selected: string | null;
  onSelect: (s: Seg | null) => void;
}) {
  let y = TOP + H;
  return (
    <g>
      {segs.map((s) => {
        const h = Math.max(0, s.amount * scale);
        y -= h;
        const top = y;
        const cls = s.mortgage ? 'seg mortgage' : `seg c${s.color % 10}`;
        return (
          <g
            key={s.key}
            className={selected === s.key ? 'segg selected' : 'segg'}
            tabIndex={0}
            role="button"
            aria-label={`${s.label}: ${formatIls(s.amount)}`}
            onMouseEnter={() => onSelect(s)}
            onFocus={() => onSelect(s)}
            onClick={() => onSelect(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(s);
              }
            }}
          >
            <rect className={cls} x={x} y={top} width={BAR_W} height={h} fill={s.mortgage ? 'url(#hatch)' : undefined} />
            {h >= 18 && (
              <text className="seglabel" x={x + BAR_W / 2} y={top + h / 2 + 4} textAnchor="middle">
                {truncate(s.label, 20)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function UsesSourcesChart({ results }: { results: Results }) {
  const [sel, setSel] = useState<Seg | null>(null);

  const uses: Seg[] = results.uses.map((u, i) => ({ key: `u-${u.id}`, label: u.label, amount: u.amount, color: i }));
  const sources: Seg[] = results.sources
    .filter((s) => s.enabled && s.net > 0)
    .map((s, i) => ({ key: `s-${s.id}`, label: s.label, amount: s.net, color: 6 + (i % 4), gross: s.gross, tax: s.tax, net: s.net }));
  if (results.mortgage > 0) {
    sources.push({ key: 'mortgage', label: he.chart.mortgage, amount: results.mortgage, color: 0, mortgage: true });
  }
  const total = (a: Seg[]) => a.reduce((s, x) => s + x.amount, 0);
  const max = Math.max(total(uses), total(sources), 1);
  const scale = H / max;

  const Legend = ({ segs, title }: { segs: Seg[]; title: string }) => (
    <div>
      <h3>{title}</h3>
      <ul className="legend">
        {segs.map((s) => (
          <li key={s.key}>
            <button type="button" onClick={() => setSel(s)} className={sel?.key === s.key ? 'on' : ''}>
              <i className={s.mortgage ? 'sw mortgage' : `sw c${s.color % 10}`} />
              <span className="lname">{s.label}</span>
              <span className="lamt">{formatIls(s.amount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const other = sel && sel.gross !== undefined ? sel.gross - (sel.tax ?? 0) - (sel.net ?? 0) : 0;

  return (
    <section className="panel chartpanel" aria-labelledby="chart-title">
      <h2 id="chart-title">{he.chart.title}</h2>
      <svg className="chart" viewBox={`0 0 ${W} ${TOP + H + 4}`} role="img" aria-label={he.chart.title}>
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" className="hatchbg" />
            <line x1="0" y1="0" x2="0" y2="8" className="hatchline" strokeWidth="3" />
          </pattern>
        </defs>
        <text className="coltitle" x={SRC_X + BAR_W / 2} y={18} textAnchor="middle">{he.chart.sources}</text>
        <text className="coltitle" x={USES_X + BAR_W / 2} y={18} textAnchor="middle">{he.chart.uses}</text>
        <Bar segs={sources} x={SRC_X} scale={scale} selected={sel?.key ?? null} onSelect={setSel} />
        <Bar segs={uses} x={USES_X} scale={scale} selected={sel?.key ?? null} onSelect={setSel} />
      </svg>
      <div className="detail" role="status" aria-live="polite">
        {sel ? (
          <>
            <b>{sel.label}</b>
            {sel.gross !== undefined ? (
              <dl>
                <div><dt>{he.chart.gross}</dt><dd>{formatIls(sel.gross)}</dd></div>
                <div><dt>{he.chart.tax}</dt><dd>{formatIls(sel.tax ?? 0)}</dd></div>
                {other > 0.5 && <div><dt>{he.chart.otherDeductions}</dt><dd>{formatIls(other)}</dd></div>}
                <div><dt>{he.chart.net}</dt><dd>{formatIls(sel.net ?? 0)}</dd></div>
              </dl>
            ) : (
              <dl><div><dt>{he.chart.amount}</dt><dd>{formatIls(sel.amount)}</dd></div></dl>
            )}
          </>
        ) : (
          <span className="muted">{he.chart.hint}</span>
        )}
      </div>
      <div className="legends">
        <Legend segs={sources} title={he.chart.sources} />
        <Legend segs={uses} title={he.chart.uses} />
      </div>
    </section>
  );
}

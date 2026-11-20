import { formatIls, formatPct } from '../../calc/format.js';
import type { Inputs, Results } from '../../calc/types.js';
import { he } from '../i18n/he.js';

interface Props {
  results: Results;
  inputs: Inputs;
}

export function Headline({ results, inputs }: Props) {
  const gap = results.surplus > 0;
  return (
    <section className="headline" aria-label={he.head.mortgage}>
      <div className="cards">
        <div className="card">
          <div className="cardlabel">{he.head.mortgage}</div>
          <div className="cardvalue" data-testid="mortgage-value">{formatIls(results.mortgage)}</div>
        </div>
        <div className="card">
          <div className="cardlabel">{he.head.monthly}</div>
          <div className="cardvalue" data-testid="monthly-value">{formatIls(results.monthlyPayment)}</div>
          <div className="cardsub">{he.head.perMonth}</div>
        </div>
        <div className={results.ltvOverCap ? 'card bad' : 'card'}>
          <div className="cardlabel">{he.head.ltv}</div>
          <div className="cardvalue" data-testid="ltv-value">{formatPct(results.ltv)}</div>
          <div className="cardsub">
            {he.head.cap} {formatPct(inputs.mortgage.ltvCap)}
            {results.ltvOverCap ? ` · ${he.head.overCap}` : ''}
          </div>
        </div>
        <div className={gap ? 'card good' : 'card'}>
          <div className="cardlabel">{gap ? he.head.surplus : he.head.shortfall}</div>
          <div className="cardvalue">
            {gap ? formatIls(results.surplus) : results.mortgage > 0 ? formatIls(results.mortgage) : he.head.noGap}
          </div>
        </div>
      </div>
      <p className="risk" data-testid="tax-risk">
        {he.head.taxRisk}: <b>+{formatIls(results.purchaseTaxRisk)}</b>
      </p>
    </section>
  );
}

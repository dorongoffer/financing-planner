import { applyOverrides } from '../../calc/presets.js';
import { formatIls } from '../../calc/format.js';
import type { Inputs, RenovationLevel, Results } from '../../calc/types.js';
import { he } from '../i18n/he.js';
import { Group, NumField, OptNumField, TextField, Toggle } from './fields.js';

interface Props {
  inputs: Inputs;
  results: Results;
  notes: Record<string, string>;
  onChange: (next: Inputs) => void;
}

const LEVELS: RenovationLevel[] = ['low', 'mid', 'high'];

export function InputsPanel({ inputs, results, notes, onChange }: Props) {
  const set = (path: string, v: number | string | boolean | null) => onChange(applyOverrides(inputs, { [path]: v }));
  const net = (id: string) => results.sources.find((s) => s.id === id)?.net ?? 0;
  const { sale, rsu, purchase, renovation, mortgage } = inputs;
  const cg = results.capitalGains;

  const addCustom = () => {
    const next = structuredClone(inputs);
    next.custom.push({ id: `c${Date.now()}`, name: '', amount: 0, enabled: true });
    onChange(next);
  };
  const removeCustom = (i: number) => {
    const next = structuredClone(inputs);
    next.custom.splice(i, 1);
    onChange(next);
  };

  return (
    <section className="panel inputs" aria-labelledby="inputs-title">
      <h2 id="inputs-title">{he.inputs.title}</h2>

      <Group title={he.inputs.sale} defaultOpen>
        <Toggle
          label={he.inputs.enabled}
          ariaLabel={`${he.inputs.enabled}: ${he.src.sale}`}
          checked={sale.enabled}
          onChange={(v) => set('sale.enabled', v)}
        />
        <NumField label={he.inputs.salePrice} value={sale.salePrice} onChange={(v) => set('sale.salePrice', v)} />
        <NumField label={he.inputs.mortgagePayoff} value={sale.mortgagePayoff} onChange={(v) => set('sale.mortgagePayoff', v)} />
        <div className="row2">
          <NumField label={he.inputs.sellerLawyerPct} kind="pct" value={sale.sellerLawyerPct} onChange={(v) => set('sale.sellerLawyerPct', v)} />
          <NumField label={he.inputs.vatPct} kind="pct" value={sale.vatPct} onChange={(v) => set('sale.vatPct', v)} />
        </div>
        <div className="row2">
          <Toggle label={he.inputs.realtorEnabled} checked={sale.realtorEnabled} onChange={(v) => set('sale.realtorEnabled', v)} />
          {sale.realtorEnabled && (
            <NumField label={he.inputs.realtorPct} kind="pct" value={sale.realtorPct} onChange={(v) => set('sale.realtorPct', v)} />
          )}
        </div>
        <NumField label={he.inputs.purchasePrice} value={sale.purchasePrice} onChange={(v) => set('sale.purchasePrice', v)} />
        <NumField
          label={he.inputs.cpiFactor}
          kind="dec"
          value={sale.cpiFactor}
          onChange={(v) => set('sale.cpiFactor', v)}
          hint={notes.cpiFactor}
        />
        <NumField label={he.inputs.purchaseTaxPaid} value={sale.purchaseTaxPaid} onChange={(v) => set('sale.purchaseTaxPaid', v)} />
        <NumField label={he.inputs.otherDeductibles} value={sale.otherDeductibles} onChange={(v) => set('sale.otherDeductibles', v)} />
        <NumField label={he.inputs.improvements} value={sale.improvements} onChange={(v) => set('sale.improvements', v)} />
        <NumField label={he.inputs.exemptionCeiling} value={sale.exemptionCeiling} onChange={(v) => set('sale.exemptionCeiling', v)} />
        <NumField label={he.inputs.capitalGainsRate} kind="pct" value={sale.capitalGainsRate} onChange={(v) => set('sale.capitalGainsRate', v)} />
        <p className="readout">
          {he.inputs.capGainsLine}: <b>{formatIls(cg.tax)}</b> · {he.chart.net}: <b>{formatIls(net('sale'))}</b>
        </p>
      </Group>

      <Group title={he.inputs.rsu}>
        <Toggle
          label={he.inputs.enabled}
          ariaLabel={`${he.inputs.enabled}: ${he.src.rsu}`}
          checked={rsu.enabled}
          onChange={(v) => set('rsu.enabled', v)}
        />
        <NumField label={he.inputs.valueUsd} suffix="$" value={rsu.valueUsd} onChange={(v) => set('rsu.valueUsd', v)} />
        <div className="row2">
          <NumField label={he.inputs.usdIls} kind="dec" value={rsu.usdIls} onChange={(v) => set('rsu.usdIls', v)} />
          <NumField label={he.inputs.rsuTaxRate} kind="pct" value={rsu.taxRate} onChange={(v) => set('rsu.taxRate', v)} />
        </div>
        <p className="readout">
          {he.chart.net}: <b>{formatIls(net('rsu'))}</b>
        </p>
      </Group>

      <Group title={he.inputs.savings}>
        <h3>{he.inputs.studyFunds}</h3>
        {inputs.studyFunds.map((f, i) => (
          <div className="srcrow" key={f.id}>
            <Toggle
              label={`${f.name} (${f.holder})`}
              ariaLabel={`${he.inputs.enabled}: ${f.name} (${f.holder})`}
              checked={f.enabled}
              onChange={(v) => set(`studyFunds.${i}.enabled`, v)}
            />
            <NumField compact label={he.chart.amount} value={f.amount} onChange={(v) => set(`studyFunds.${i}.amount`, v)} />
          </div>
        ))}
        {notes.studyFunds && <p className="note">{notes.studyFunds}</p>}

        <h3>{he.inputs.savingsRows}</h3>
        {inputs.savings.map((s, i) => (
          <div className="srcrow" key={s.id}>
            <Toggle
              label={s.name}
              ariaLabel={`${he.inputs.enabled}: ${s.name}`}
              checked={s.enabled}
              onChange={(v) => set(`savings.${i}.enabled`, v)}
            />
            <div className="row3">
              <NumField compact label={he.inputs.gross} value={s.gross} onChange={(v) => set(`savings.${i}.gross`, v)} />
              <NumField compact label={he.inputs.taxableGain} value={s.taxableGain} onChange={(v) => set(`savings.${i}.taxableGain`, v)} />
              <NumField compact label={he.inputs.taxRate} kind="pct" value={s.taxRate} onChange={(v) => set(`savings.${i}.taxRate`, v)} />
            </div>
            <p className="readout">
              {he.chart.net}: <b>{formatIls(net(s.id))}</b>
            </p>
          </div>
        ))}

        <h3>{he.inputs.customTitle}</h3>
        {inputs.custom.map((c, i) => (
          <div className="srcrow" key={c.id}>
            <Toggle
              label={he.inputs.enabled}
              ariaLabel={`${he.inputs.enabled}: ${c.name || he.inputs.customTitle}`}
              checked={c.enabled}
              onChange={(v) => set(`custom.${i}.enabled`, v)}
            />
            <div className="row2">
              <TextField compact label={he.inputs.customName} value={c.name} onChange={(v) => set(`custom.${i}.name`, v)} />
              <NumField compact label={he.inputs.customAmount} value={c.amount} onChange={(v) => set(`custom.${i}.amount`, v)} />
            </div>
            <button type="button" className="btn small" onClick={() => removeCustom(i)}>
              {he.inputs.remove}
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={addCustom}>
          + {he.inputs.addCustom}
        </button>
      </Group>

      <Group title={he.inputs.purchase}>
        <NumField label={he.inputs.price} value={purchase.price} onChange={(v) => set('purchase.price', v)} />
        <fieldset className="seg" aria-label={he.inputs.taxMode}>
          <legend>{he.inputs.taxMode}</legend>
          {(['single', 'additional'] as const).map((m) => (
            <label key={m} className={purchase.taxMode === m ? 'on' : ''}>
              <input type="radio" name="taxMode" checked={purchase.taxMode === m} onChange={() => set('purchase.taxMode', m)} />
              {m === 'single' ? he.inputs.single : he.inputs.additional}
            </label>
          ))}
        </fieldset>
        {notes.purchaseTax && <p className="note">{notes.purchaseTax}</p>}
        <div className="row2">
          <NumField label={he.inputs.buyerLawyerPct} kind="pct" value={purchase.buyerLawyerPct} onChange={(v) => set('purchase.buyerLawyerPct', v)} />
          <NumField label={he.inputs.vatPct} kind="pct" value={purchase.vatPct} onChange={(v) => set('purchase.vatPct', v)} />
        </div>
        <div className="row2">
          <NumField label={he.inputs.buyerRealtorPct} kind="pct" value={purchase.realtorPct} onChange={(v) => set('purchase.realtorPct', v)} />
          <NumField label={he.inputs.misc} value={purchase.misc} onChange={(v) => set('purchase.misc', v)} />
        </div>
      </Group>

      <Group title={he.inputs.renovation}>
        <fieldset className="seg" aria-label={he.inputs.level}>
          <legend>{he.inputs.level}</legend>
          {LEVELS.map((l) => (
            <label key={l} className={renovation.level === l ? 'on' : ''}>
              <input type="radio" name="level" checked={renovation.level === l} onChange={() => set('renovation.level', l)} />
              {he.inputs[l]}
            </label>
          ))}
        </fieldset>
        {renovation.items.map((it, i) => (
          <div className="renoitem" key={it.id}>
            <div className="renoname">{it.name}</div>
            <div className="row4">
              {LEVELS.map((l) => (
                <NumField
                  compact
                  key={l}
                  label={he.inputs[l]}
                  value={it[l]}
                  onChange={(v) => set(`renovation.items.${i}.${l}`, v)}
                />
              ))}
              <OptNumField
                label={he.inputs.override}
                value={it.override}
                placeholder={he.inputs.useLevel}
                active={it.override !== null}
                onChange={(v) => set(`renovation.items.${i}.override`, v)}
              />
            </div>
          </div>
        ))}
        <div className="field">
          <label htmlFor="contingency">
            {he.inputs.contingency}: <b>{Math.round(renovation.contingencyPct * 100)}%</b>
          </label>
          <input
            id="contingency"
            type="range"
            min={0}
            max={50}
            step={1}
            value={Math.round(renovation.contingencyPct * 100)}
            onChange={(e) => set('renovation.contingencyPct', Number(e.target.value) / 100)}
          />
        </div>
        <Toggle
          label={he.inputs.includeRent}
          checked={renovation.contingencyIncludesRent}
          onChange={(v) => set('renovation.contingencyIncludesRent', v)}
        />
        <NumField label={he.inputs.cashReserve} value={inputs.cashReserve} onChange={(v) => set('cashReserve', v)} />
      </Group>

      <Group title={he.inputs.mortgage}>
        <div className="row3">
          <NumField label={he.inputs.annualRate} kind="pct" value={mortgage.annualRate} onChange={(v) => set('mortgage.annualRate', v)} />
          <NumField label={he.inputs.termYears} kind="dec" value={mortgage.termYears} onChange={(v) => set('mortgage.termYears', v)} />
          <NumField label={he.inputs.ltvCap} kind="pct" value={mortgage.ltvCap} onChange={(v) => set('mortgage.ltvCap', v)} />
        </div>
      </Group>
    </section>
  );
}

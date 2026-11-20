import { useId, useState, type ReactNode } from 'react';
import { formatNumber } from '../../calc/format.js';

export type NumKind = 'int' | 'pct' | 'dec';

function raw(value: number, kind: NumKind): string {
  if (kind === 'pct') return String(+(value * 100).toFixed(4));
  return String(value);
}

function shown(value: number, kind: NumKind): string {
  if (kind === 'int') return formatNumber(value);
  return raw(value, kind);
}

function parse(text: string, kind: NumKind): number | null {
  const t = text.replace(/[,\s]/g, '');
  if (t === '' || t === '-' || t === '.') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return kind === 'pct' ? n / 100 : n;
}

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  kind?: NumKind;
  suffix?: string;
  hint?: ReactNode;
  compact?: boolean;
}

/** Number input: raw text while editing, thousands separators on blur. Percent fields show %. */
export function NumField({ label, value, onChange, kind = 'int', suffix, hint, compact }: NumFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const sfx = suffix ?? (kind === 'pct' ? '%' : undefined);
  return (
    <div className={compact ? 'field compact' : 'field'}>
      <label htmlFor={id}>{label}</label>
      <div className="inputwrap">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={draft ?? shown(value, kind)}
          onFocus={(e) => {
            setDraft(raw(value, kind));
            e.target.select();
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parse(e.target.value, kind);
            if (n !== null) onChange(n);
          }}
          onBlur={() => setDraft(null)}
        />
        {sfx && <span className="sfx">{sfx}</span>}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

interface OptNumFieldProps {
  label: string;
  value: number | null;
  placeholder: string;
  onChange: (v: number | null) => void;
  active?: boolean;
}

/** Like NumField but empty means null (no override). */
export function OptNumField({ label, value, placeholder, onChange, active }: OptNumFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className={active ? 'field compact active' : 'field compact'}>
      <label htmlFor={id}>{label}</label>
      <div className="inputwrap">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          dir="ltr"
          placeholder={placeholder}
          value={draft ?? (value === null ? '' : formatNumber(value))}
          onFocus={(e) => {
            setDraft(value === null ? '' : String(value));
            e.target.select();
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(parse(e.target.value, 'int'));
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}

export function TextField({ label, value, onChange, compact }: TextFieldProps) {
  const id = useId();
  return (
    <div className={compact ? 'field compact' : 'field'}>
      <label htmlFor={id}>{label}</label>
      <div className="inputwrap">
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}

export function Toggle({ label, checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

interface GroupProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Group({ title, defaultOpen, children }: GroupProps) {
  return (
    <details className="group" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="groupbody">{children}</div>
    </details>
  );
}

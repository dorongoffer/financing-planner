import { useRef } from 'react';
import { he } from '../i18n/he.js';

export type PendingAction =
  | { kind: 'import'; text: string; summary: string }
  | { kind: 'clear'; summary: string };

interface Props {
  usingExample: boolean;
  storageOk: boolean;
  pending: PendingAction | null;
  note: { text: string; error: boolean } | null;
  dragging: boolean;
  onFile: (file: File) => void;
  onExport: () => void;
  onAskClear: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DataBar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className={p.dragging ? 'databar drag' : 'databar'} aria-label={he.data.label}>
      {p.usingExample && <div className="banner" role="status">{he.exampleBanner}</div>}
      <div className="scenbtns">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          aria-label={he.data.import}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) p.onFile(f);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn primary" onClick={() => fileRef.current?.click()}>{he.data.import}</button>
        <button type="button" className="btn" onClick={p.onExport}>{he.data.export}</button>
        <button type="button" className="btn danger" onClick={p.onAskClear}>{he.data.clear}</button>
      </div>
      <p className="muted hint">{p.dragging ? he.data.dropHint : he.data.hint}</p>
      {!p.storageOk && <p className="errmsg hint">{he.data.storageOff}</p>}
      {p.note && <p className={p.note.error ? 'errmsg hint' : 'okmsg'} role="status">{p.note.text}</p>}
      {p.pending && (
        <div className="confirm" role="alertdialog" aria-label={p.pending.summary}>
          <p>{p.pending.summary}</p>
          <div className="scenbtns">
            <button type="button" className="btn danger" onClick={p.onConfirm}>{he.data.proceed}</button>
            <button type="button" className="btn" onClick={p.onCancel}>{he.scen.cancel}</button>
          </div>
        </div>
      )}
    </section>
  );
}

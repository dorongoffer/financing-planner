import { useState } from 'react';
import type { Preset } from '../../calc/types.js';
import { he } from '../i18n/he.js';
import type { Scenario } from '../types.js';

interface Props {
  scenarios: Scenario[];
  activeId: string | null;
  dirty: boolean;
  compareOpen: boolean;
  presets: Preset[];
  message: string | null;
  onSelect: (id: string | null) => void;
  onSave: () => void;
  onSaveAs: (name: string) => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleCompare: () => void;
  onPreset: (i: number) => void;
}

type Panel = { kind: 'saveAs' | 'rename'; initial: string } | { kind: 'delete' } | null;

export function ScenarioBar(p: Props) {
  const hasActive = p.activeId !== null;
  const active = p.scenarios.find((s) => s.id === p.activeId) ?? null;
  const [panel, setPanel] = useState<Panel>(null);
  const [name, setName] = useState('');

  const open = (kind: 'saveAs' | 'rename', initial: string) => {
    setName(initial);
    setPanel({ kind, initial });
  };
  const submit = () => {
    const n = name.trim();
    if (!n || !panel || panel.kind === 'delete') return;
    if (panel.kind === 'saveAs') p.onSaveAs(n);
    else p.onRename(n);
    setPanel(null);
  };

  return (
    <section className="scenbar" aria-label={he.scen.label}>
      <div className="scenrow">
        <select
          aria-label={he.scen.label}
          value={p.activeId ?? ''}
          onChange={(e) => {
            setPanel(null);
            p.onSelect(e.target.value || null);
          }}
        >
          <option value="">{he.scen.none}</option>
          {p.scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          aria-label={he.scen.preset}
          value=""
          onChange={(e) => {
            if (e.target.value !== '') p.onPreset(Number(e.target.value));
          }}
        >
          <option value="">{he.scen.preset}</option>
          {p.presets.map((pr, i) => (
            <option key={`${pr.name}-${i}`} value={i}>{pr.name}</option>
          ))}
        </select>
        {p.dirty && <span className="dirty" role="status">● {he.scen.unsaved}</span>}
        {p.message && !p.dirty && <span className="okmsg" role="status">{p.message}</span>}
      </div>
      <div className="scenbtns">
        <button
          type="button"
          className="btn primary"
          onClick={() => (hasActive ? p.onSave() : open('saveAs', ''))}
        >
          {he.scen.save}
        </button>
        <button type="button" className="btn" onClick={() => open('saveAs', active ? `${active.name} (2)` : '')}>{he.scen.saveAs}</button>
        <button type="button" className="btn" disabled={!hasActive} onClick={() => open('rename', active?.name ?? '')}>{he.scen.rename}</button>
        <button type="button" className="btn" disabled={!hasActive} onClick={p.onDuplicate}>{he.scen.duplicate}</button>
        <button type="button" className="btn danger" disabled={!hasActive} onClick={() => setPanel({ kind: 'delete' })}>{he.scen.delete}</button>
        <button
          type="button"
          className={p.compareOpen ? 'btn on' : 'btn'}
          aria-pressed={p.compareOpen}
          onClick={p.onToggleCompare}
        >
          {he.scen.compare}
        </button>
      </div>
      {panel && panel.kind !== 'delete' && (
        <form
          className="inlineform"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="text"
            aria-label={he.scen.nameLabel}
            placeholder={he.scen.nameLabel}
            value={name}
            maxLength={80}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn primary" disabled={!name.trim()}>{he.scen.ok}</button>
          <button type="button" className="btn" onClick={() => setPanel(null)}>{he.scen.cancel}</button>
        </form>
      )}
      {panel && panel.kind === 'delete' && (
        <div className="confirm" role="alertdialog" aria-label={he.scen.confirmDelete}>
          <p>{he.scen.confirmDelete}</p>
          <div className="scenbtns">
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setPanel(null);
                p.onDelete();
              }}
            >
              {he.scen.delete}
            </button>
            <button type="button" className="btn" onClick={() => setPanel(null)}>{he.scen.cancel}</button>
          </div>
        </div>
      )}
    </section>
  );
}

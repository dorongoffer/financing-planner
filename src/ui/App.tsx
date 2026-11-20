import { useCallback, useEffect, useMemo, useState } from 'react';
import { compute } from '../calc/compute.js';
import { applyOverrides } from '../calc/presets.js';
import type { Inputs } from '../calc/types.js';
import { ComparePanel } from './components/ComparePanel.js';
import { DataBar, type PendingAction } from './components/DataBar.js';
import { Headline } from './components/Headline.js';
import { InputsPanel } from './components/InputsPanel.js';
import { ScenarioBar } from './components/ScenarioBar.js';
import { Tornado } from './components/Tornado.js';
import { UsesSourcesChart } from './components/UsesSourcesChart.js';
import { buildExport, exportFileName, parseImport } from './fileFormat.js';
import { he } from './i18n/he.js';
import {
  clearState,
  createScenario,
  deleteScenario,
  duplicateScenario,
  importDefaults,
  importExport,
  loadState,
  saveState,
  updateScenario,
  type StoreState,
} from './store.js';

const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function App() {
  const [store, setStore] = useState<StoreState>(() => loadState());
  const [inputs, setInputs] = useState<Inputs>(() => {
    const s = loadState();
    return s.scenarios.find((x) => x.id === s.activeScenarioId)?.inputs ?? s.defaults.inputs;
  });
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [storageOk, setStorageOk] = useState(true);

  const { defaults, scenarios, activeScenarioId: activeId } = store;
  const results = useMemo(() => compute(inputs), [inputs]);
  const active = scenarios.find((s) => s.id === activeId) ?? null;
  const baseline = active ? active.inputs : defaults.inputs;
  const dirty = useMemo(() => JSON.stringify(inputs) !== JSON.stringify(baseline), [inputs, baseline]);

  /** Persist and adopt a new store state. */
  const commit = useCallback((next: StoreState) => {
    const saved = saveState(next);
    setStorageOk(saved !== next);
    setStore(saved);
  }, []);

  const onSelect = (id: string | null) => {
    setMessage(null);
    const s = scenarios.find((x) => x.id === id);
    setInputs(s ? s.inputs : defaults.inputs);
    commit({ ...store, activeScenarioId: s ? s.id : null });
  };

  const saveAs = (name: string) => {
    const r = createScenario(store, name, inputs);
    commit(r.state);
    setMessage(he.scen.saved);
  };

  const save = () => {
    if (!active) return;
    commit(updateScenario(store, active.id, { inputs }));
    setMessage(he.scen.saved);
  };

  const rename = (name: string) => {
    if (active) commit(updateScenario(store, active.id, { name }));
  };

  const duplicate = () => {
    if (!active) return;
    const r = duplicateScenario(store, active.id, he.scen.copySuffix);
    if (!r) return;
    commit(r.state);
    setInputs(r.scenario.inputs);
  };

  const remove = () => {
    if (!active) return;
    commit(deleteScenario(store, active.id));
    setCompareIds((ids) => ids.filter((x) => x !== active.id));
    setInputs(defaults.inputs);
  };

  const loadPreset = (i: number) => {
    const p = defaults.presets[i];
    if (!p) return;
    setMessage(null);
    commit({ ...store, activeScenarioId: null });
    setInputs(applyOverrides(defaults.inputs, p.overrides));
  };

  const onFile = useCallback(async (file: File) => {
    setNote(null);
    let text: string;
    try {
      text = await readFile(file);
    } catch {
      setNote({ text: he.data.readError, error: true });
      return;
    }
    const parsed = parseImport(text);
    if ('error' in parsed) {
      setPending(null);
      setNote({ text: parsed.error, error: true });
      return;
    }
    const summary =
      parsed.kind === 'defaults'
        ? he.data.confirmDefaults(parsed.defaults.presets.length)
        : he.data.confirmExport(parsed.scenarios.length);
    setPending({ kind: 'import', text, summary });
  }, []);

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'clear') {
      const s = clearState();
      setStore(s);
      setInputs(s.defaults.inputs);
      setCompareIds([]);
      setNote({ text: he.data.cleared, error: false });
    } else {
      const parsed = parseImport(pending.text);
      if ('error' in parsed) {
        setNote({ text: parsed.error, error: true });
      } else {
        const next =
          parsed.kind === 'defaults'
            ? importDefaults(store, parsed.defaults)
            : importExport(store, parsed.defaults, parsed.scenarios);
        commit(next);
        setInputs(next.defaults.inputs);
        setCompareIds([]);
        setMessage(null);
        setNote({ text: he.data.imported, error: false });
      }
    }
    setPending(null);
  };

  const exportNow = () => {
    const file = buildExport(defaults, scenarios, VERSION);
    download(exportFileName(), JSON.stringify(file, null, 2));
    setNote({ text: he.data.exported, error: false });
  };

  // Drag-and-drop a JSON file anywhere on the page.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) void onFile(f);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [onFile]);

  return (
    <div className="shell">
      <header className="top">
        <h1>{he.appTitle}</h1>
      </header>
      <DataBar
        usingExample={store.usingExample}
        storageOk={storageOk}
        pending={pending}
        note={note}
        dragging={dragging}
        onFile={(f) => void onFile(f)}
        onExport={exportNow}
        onAskClear={() => setPending({ kind: 'clear', summary: he.data.confirmClear })}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
      <ScenarioBar
        scenarios={scenarios}
        activeId={activeId}
        dirty={dirty}
        compareOpen={compareOpen}
        presets={defaults.presets}
        message={message}
        onSelect={onSelect}
        onSave={save}
        onSaveAs={saveAs}
        onRename={rename}
        onDuplicate={duplicate}
        onDelete={remove}
        onToggleCompare={() => setCompareOpen((o) => !o)}
        onPreset={loadPreset}
      />
      {compareOpen && <ComparePanel scenarios={scenarios} ids={compareIds} onChange={setCompareIds} />}
      <main className="grid">
        <div className="a-head"><Headline results={results} inputs={inputs} /></div>
        <div className="a-chart"><UsesSourcesChart results={results} /></div>
        <div className="a-inputs">
          <InputsPanel inputs={inputs} results={results} notes={defaults.notes} onChange={setInputs} />
        </div>
        <div className="a-tornado"><Tornado inputs={inputs} /></div>
      </main>
      <footer className="foot">
        <div>{he.appTitle} · {he.version} {VERSION}</div>
        <p>{he.disclaimer}</p>
      </footer>
    </div>
  );
}

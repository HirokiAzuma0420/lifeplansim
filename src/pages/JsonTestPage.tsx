import { useState } from 'react';

// Standalone tester page for posting raw JSON to /api/simulate.
// ASCII-only labels to avoid encoding issues.
export default function JsonTestPage() {
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      setJsonText(text);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleExecute = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      type InputPayload = { inputParams: unknown } | Record<string, unknown>;
      let payload: InputPayload;
      if (parsed && typeof parsed === 'object' && 'inputParams' in (parsed as Record<string, unknown>)) {
        payload = parsed as Record<string, unknown>;
      } else {
        payload = { inputParams: parsed } as InputPayload;
      }
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'API error');
      setResult(data as Record<string, unknown>);
      try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch (e) { void e; }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">JSON Test Input (/json-test)</h1>
        <p className="text-sm text-gray-600 mb-4">
          Post JSON to /api/simulate. Provide either the full body with inputParams, or the InputParams object (will be wrapped).
        </p>

        <div className="bg-white rounded border p-4 mb-4">
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Upload JSON file</label>
            <input type="file" accept="application/json" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }} />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Paste JSON</label>
            <textarea
              className="w-full h-48 border rounded p-2 font-mono text-xs"
              placeholder="Paste InputParams JSON or { inputParams: { ... } }"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            onClick={handleExecute}
            disabled={busy || !jsonText.trim()}
          >
            {busy ? 'Running...' : 'Run API'}
          </button>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {result !== null && (
          <div className="bg-white rounded border p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Response JSON</h2>
              <span className="text-xs text-gray-500">Also copied to clipboard</span>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded max-h-[70vh] overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

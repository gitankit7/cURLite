import React, { useState, useRef } from 'react';
import { MethodBadge, TabBtn } from './components.jsx';
import { METHODS, METHOD_COLORS, generateCurl, copyToClipboard } from './curl.js';

export default function BuilderScreen({ service, onBack, onUpdateService }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [headerPairs, setHeaderPairs] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [activeTab, setActiveTab] = useState('builder');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [mainCopied, setMainCopied] = useState(false);
  const [verbose, setVerbose] = useState(true);
  const [label, setLabel] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bodyCopied, setBodyCopied] = useState(false);
  const [filterLabel, setFilterLabel] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [editingCurlId, setEditingCurlId] = useState(null);
  const [editingCurlText, setEditingCurlText] = useState('');
  const responseRef = useRef(null);

  const history = service.history || [];

  const headers = headerPairs
    .filter((p) => p.key.trim())
    .map((p) => `${p.key}: ${p.value}`)
    .join('\n');

  const curlCommand = generateCurl(method, url, headers, body, verbose);

  // Sorted: bookmarked first
  const sortedHistory = [...history].sort((a, b) => {
    if (a.bookmarked && !b.bookmarked) return -1;
    if (!a.bookmarked && b.bookmarked) return 1;
    return 0;
  });

  const addToHistory = () => {
    if (!url.trim()) return;
    const filtered = history.filter((h) => !(h.method === method && h.url === url));
    const entry = {
      id: Date.now(),
      method,
      url,
      headers,
      body,
      curl: curlCommand,
      label: label.trim() || '',
      timestamp: new Date().toLocaleString(),
      bookmarked: false,
    };
    onUpdateService({ ...service, history: [entry, ...filtered.slice(0, 49)] });
  };

  const executeRequest = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setResponse(null);

    // Save to history
    addToHistory();

    try {
      const headerObj = {};
      headerPairs.filter((p) => p.key.trim()).forEach((p) => {
        headerObj[p.key.trim()] = p.value.trim();
      });

      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          url,
          headers: headerObj,
          body: body || undefined,
          verbose,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        status: 0,
        time: 0,
        body: '',
        stderr: '',
        error: `Could not reach backend: ${err.message}. Make sure the server is running (npm start).`,
      });
    }

    setIsLoading(false);
    setTimeout(() => {
      if (responseRef.current) {
        responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const toggleBookmark = (id) => {
    onUpdateService({ ...service, history: history.map((h) => (h.id === id ? { ...h, bookmarked: !h.bookmarked } : h)) });
  };

  const deleteLabel = (id) => {
    onUpdateService({ ...service, history: history.map((h) => (h.id === id ? { ...h, label: '' } : h)) });
  };

  const saveCurlEdit = (id) => {
    if (!editingCurlText.trim()) { setEditingCurlId(null); return; }
    onUpdateService({
      ...service,
      history: history.map((h) => (h.id === id ? { ...h, curl: editingCurlText } : h)),
    });
    setEditingCurlId(null);
    setEditingCurlText('');
  };

  const saveLabel = (id) => {
    onUpdateService({ ...service, history: history.map((h) => (h.id === id ? { ...h, label: editingLabelText.trim() } : h)) });
    setEditingLabelId(null);
    setEditingLabelText('');
  };

  const executeFromHistory = async (entry) => {
    setIsLoading(true);
    setResponse(null);
    setActiveTab('builder');

    // Load it into the builder
    setMethod(entry.method);
    setUrl(entry.url);
    setBody(entry.body);
    setLabel(entry.label || '');
    const pairs = entry.headers
      ? entry.headers.split('\n').filter(Boolean).map((h) => {
          const [k, ...v] = h.split(':');
          return { key: k.trim(), value: v.join(':').trim() };
        })
      : [];
    setHeaderPairs(pairs.length ? pairs : [{ key: '', value: '' }]);

    // Build headers object from the entry
    const headerObj = {};
    if (entry.headers) {
      entry.headers.split('\n').filter(Boolean).forEach((h) => {
        const [k, ...v] = h.split(':');
        if (k.trim()) headerObj[k.trim()] = v.join(':').trim();
      });
    }

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: entry.method,
          url: entry.url,
          headers: headerObj,
          body: entry.body || undefined,
          verbose,
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        status: 0, time: 0, body: '', stderr: '',
        error: `Could not reach backend: ${err.message}. Make sure the server is running (npm start).`,
      });
    }

    setIsLoading(false);
    setTimeout(() => {
      if (responseRef.current) {
        responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const deleteHistoryItem = (id) => {
    onUpdateService({ ...service, history: history.filter((h) => h.id !== id) });
  };

  const clearHistory = () => {
    onUpdateService({ ...service, history: [] });
  };

  const handleCopy = async (text, idx) => {
    await copyToClipboard(text);
    if (idx !== undefined) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } else {
      setMainCopied(true);
      setTimeout(() => setMainCopied(false), 1500);
    }
  };

  const loadFromHistory = (entry) => {
    setMethod(entry.method);
    setUrl(entry.url);
    setBody(entry.body);
    setLabel(entry.label || '');
    const pairs = entry.headers
      ? entry.headers.split('\n').filter(Boolean).map((h) => {
          const [k, ...v] = h.split(':');
          return { key: k.trim(), value: v.join(':').trim() };
        })
      : [];
    setHeaderPairs(pairs.length ? pairs : [{ key: '', value: '' }]);
    setActiveTab('builder');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', fontFamily: "'IBM Plex Mono', monospace", color: '#cbd5e1' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          borderBottom: '1px solid #1e293b',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
              borderRadius: 8, padding: '6px 14px', fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >← Services</button>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#0b1120',
            }}
          >{'>_'}</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: '#f1f5f9' }}>
              {service.name}
            </div>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              cURL Builder
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#334155' }}>
          {history.length} request{history.length !== 1 ? 's' : ''} saved
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <TabBtn active={activeTab === 'builder'} onClick={() => setActiveTab('builder')}>Builder</TabBtn>
        <TabBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')}>History ({history.length})</TabBtn>
      </div>

      {activeTab === 'builder' && (
        <div style={{ padding: 24, maxWidth: 900 }}>
          {/* URL Bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{
                background: '#1e293b', color: METHOD_COLORS[method],
                border: `1px solid ${METHOD_COLORS[method]}50`, borderRadius: 8, padding: '10px 12px',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13,
                cursor: 'pointer', outline: 'none', minWidth: 100,
              }}
            >
              {METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeRequest()}
              placeholder="https://api.example.com/endpoint"
              style={{
                flex: 1, minWidth: 200, background: '#1e293b', color: '#e2e8f0',
                border: '1px solid #334155', borderRadius: 8, padding: '10px 14px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={executeRequest}
              disabled={isLoading || !url.trim()}
              style={{
                background: isLoading ? '#334155' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13,
                cursor: isLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                opacity: !url.trim() ? 0.5 : 1, transition: 'all 0.2s',
              }}
            >{isLoading ? '⏳ Running...' : '▶ Send'}</button>
            <button
              onClick={addToHistory}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px 16px',
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >Save</button>
          </div>

          {/* Label */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Label
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="optional — e.g. Get all users, Create order..."
              style={{
                flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
                borderRadius: 8, padding: '7px 12px', fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {/* Verbose toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setVerbose(!verbose)}
              style={{
                background: verbose ? '#22d3ee18' : '#1e293b',
                color: verbose ? '#22d3ee' : '#475569',
                border: `1px solid ${verbose ? '#22d3ee40' : '#334155'}`,
                borderRadius: 6, padding: '4px 12px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >-v verbose {verbose ? 'ON' : 'OFF'}</button>
          </div>

          {/* Headers */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8 }}>
              Headers
            </div>
            {headerPairs.map((pair, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <input
                  type="text" value={pair.key}
                  onChange={(e) => { const n = [...headerPairs]; n[i] = { ...n[i], key: e.target.value }; setHeaderPairs(n); }}
                  placeholder="Key"
                  style={{ flex: 1, minWidth: 100, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: 'none' }}
                />
                <input
                  type="text" value={pair.value}
                  onChange={(e) => { const n = [...headerPairs]; n[i] = { ...n[i], value: e.target.value }; setHeaderPairs(n); }}
                  placeholder="Value"
                  style={{ flex: 2, minWidth: 140, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: 'none' }}
                />
                <button
                  onClick={() => setHeaderPairs(headerPairs.filter((_, j) => j !== i))}
                  style={{ background: '#1e293b', color: '#f87171', border: '1px solid #334155', borderRadius: 6, width: 32, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}
                >×</button>
              </div>
            ))}
            <button
              onClick={() => setHeaderPairs([...headerPairs, { key: '', value: '' }])}
              style={{ background: 'transparent', color: '#6366f1', border: '1px dashed #334155', borderRadius: 6, padding: '6px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 4 }}
            >+ Add Header</button>
          </div>

          {/* Body */}
          {!['GET', 'HEAD', 'DELETE'].includes(method) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8 }}>
                Request Body
              </div>
              <textarea
                value={body} onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}' rows={6}
                style={{
                  width: '100%', background: '#1e293b', color: '#a3e635', border: '1px solid #334155',
                  borderRadius: 8, padding: '12px 14px', fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Generated cURL */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                Generated cURL
              </div>
              <button
                onClick={() => handleCopy(curlCommand)}
                style={{
                  background: mainCopied ? '#22c55e20' : '#1e293b',
                  color: mainCopied ? '#22c55e' : '#94a3b8',
                  border: `1px solid ${mainCopied ? '#22c55e50' : '#334155'}`,
                  borderRadius: 6, padding: '4px 12px',
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >{mainCopied ? '✓ Copied' : 'Copy'}</button>
            </div>
            <pre
              style={{
                background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
                padding: 16, margin: 0, fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12, lineHeight: 1.7, color: '#22d3ee',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowX: 'auto',
              }}
            >{curlCommand}</pre>
          </div>

          {/* Response Output */}
          {(response || isLoading) && (
            <div ref={responseRef} style={{ marginTop: 24 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 10 }}>
                Response
              </div>

              {isLoading && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>⏳</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Executing curl...</div>
                  <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
                </div>
              )}

              {response && !isLoading && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Status bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {response.error ? (
                        <span style={{ background: '#f8717118', color: '#f87171', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 700, border: '1px solid #f8717140' }}>
                          ERROR
                        </span>
                      ) : (
                        <span style={{
                          background: response.status >= 200 && response.status < 300 ? '#22c55e18' : response.status >= 400 ? '#f8717118' : '#fbbf2418',
                          color: response.status >= 200 && response.status < 300 ? '#22c55e' : response.status >= 400 ? '#f87171' : '#fbbf24',
                          padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 700,
                          border: `1px solid ${response.status >= 200 && response.status < 300 ? '#22c55e40' : response.status >= 400 ? '#f8717140' : '#fbbf2440'}`,
                        }}>
                          {response.status}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#475569' }}>{response.time}ms</span>
                    </div>
                    {response.body && (
                      <button
                        onClick={async () => { await copyToClipboard(response.body); setBodyCopied(true); setTimeout(() => setBodyCopied(false), 1500); }}
                        style={{
                          background: bodyCopied ? '#22c55e20' : '#1e293b',
                          color: bodyCopied ? '#22c55e' : '#94a3b8',
                          border: `1px solid ${bodyCopied ? '#22c55e50' : '#334155'}`,
                          borderRadius: 5, padding: '3px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >{bodyCopied ? '✓ Copied' : 'Copy Body'}</button>
                    )}
                  </div>

                  {/* Verbose stderr (curl debug output) */}
                  {verbose && response.stderr && (
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e293b', maxHeight: 200, overflowY: 'auto' }}>
                      <div style={{ fontSize: 10, color: '#475569', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Verbose Output
                      </div>
                      <pre style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, lineHeight: 1.5, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {response.stderr}
                      </pre>
                    </div>
                  )}

                  {/* Body or Error */}
                  <div style={{ padding: 16, maxHeight: 500, overflowY: 'auto' }}>
                    {response.error ? (
                      <div style={{ color: '#f87171', fontSize: 13, lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Request Failed</div>
                        <div style={{ color: '#fb923c', fontSize: 12 }}>{response.error}</div>
                      </div>
                    ) : (
                      <pre style={{
                        margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                        lineHeight: 1.6, color: '#a3e635', whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}>{response.body || '(empty response)'}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ padding: 24, maxWidth: 900 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>No requests yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Use the builder to save your first curl command</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Filter + Clear row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    placeholder="Filter by label..."
                    style={{
                      width: '100%', background: '#1e293b', color: '#e2e8f0',
                      border: '1px solid #334155', borderRadius: 8, padding: '7px 12px 7px 30px',
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 12 }}>🔍</span>
                </div>
                <button
                  onClick={clearHistory}
                  style={{ background: 'transparent', color: '#f87171', border: '1px solid #f8717130', borderRadius: 6, padding: '5px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >Clear All</button>
              </div>
              {(() => {
                const filtered = filterLabel.trim()
                  ? sortedHistory.filter((e) => e.label && e.label.toLowerCase().includes(filterLabel.toLowerCase()))
                  : sortedHistory;

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
                      <div style={{ fontSize: 12 }}>No matches for "{filterLabel}"</div>
                    </div>
                  );
                }

                return filtered.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    background: '#0f172a',
                    border: entry.bookmarked ? '1px solid #fbbf2440' : '1px solid #1e293b',
                    borderRadius: 10, padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      {entry.bookmarked && <span style={{ fontSize: 12, flexShrink: 0 }}>⭐</span>}
                      <MethodBadge method={entry.method} />
                      {entry.label && editingLabelId !== entry.id && (
                        <span style={{
                          fontSize: 11, color: '#c084fc', fontWeight: 600, flexShrink: 0,
                          background: '#c084fc12', padding: '2px 8px', borderRadius: 4,
                          border: '1px solid #c084fc30', maxWidth: 180,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{entry.label}</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); deleteLabel(entry.id); }}
                            title="Remove label"
                            style={{ cursor: 'pointer', color: '#c084fc80', fontSize: 13, lineHeight: 1, flexShrink: 0 }}
                          >×</span>
                        </span>
                      )}
                      {!entry.label && editingLabelId !== entry.id && (
                        <button
                          onClick={() => { setEditingLabelId(entry.id); setEditingLabelText(''); }}
                          title="Add label"
                          style={{
                            background: 'transparent', color: '#475569', border: '1px dashed #334155',
                            borderRadius: 4, padding: '1px 6px', fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10, cursor: 'pointer', flexShrink: 0,
                          }}
                        >+ label</button>
                      )}
                      {editingLabelId === entry.id && (
                        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                          <input
                            autoFocus
                            value={editingLabelText}
                            onChange={(e) => setEditingLabelText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(entry.id); if (e.key === 'Escape') setEditingLabelId(null); }}
                            placeholder="Label..."
                            style={{
                              width: 120, background: '#1e293b', color: '#e2e8f0',
                              border: '1px solid #c084fc', borderRadius: 4, padding: '2px 6px',
                              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, outline: 'none',
                            }}
                          />
                          <button onClick={() => saveLabel(entry.id)}
                            style={{ background: '#c084fc', color: '#0b1120', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
                          >✓</button>
                          <button onClick={() => setEditingLabelId(null)}
                            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
                          >✕</button>
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.url}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#334155' }}>{entry.timestamp}</span>
                      <button onClick={() => executeFromHistory(entry)}
                        title="Execute this request"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
                          border: 'none', borderRadius: 5, padding: '3px 10px',
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                          cursor: 'pointer', fontWeight: 600,
                        }}
                      >▶ Run</button>
                      <button onClick={() => toggleBookmark(entry.id)} title={entry.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        style={{
                          background: entry.bookmarked ? '#fbbf2418' : '#1e293b',
                          color: entry.bookmarked ? '#fbbf24' : '#475569',
                          border: `1px solid ${entry.bookmarked ? '#fbbf2440' : '#334155'}`,
                          borderRadius: 5, padding: '3px 8px', fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >{entry.bookmarked ? '★' : '☆'}</button>
                      <button onClick={() => loadFromHistory(entry)}
                        style={{ background: '#1e293b', color: '#6366f1', border: '1px solid #334155', borderRadius: 5, padding: '3px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, cursor: 'pointer' }}
                      >Load</button>
                      <button onClick={() => handleCopy(entry.curl, idx)}
                        style={{
                          background: copiedIdx === idx ? '#22c55e20' : '#1e293b',
                          color: copiedIdx === idx ? '#22c55e' : '#94a3b8',
                          border: `1px solid ${copiedIdx === idx ? '#22c55e50' : '#334155'}`,
                          borderRadius: 5, padding: '3px 10px', fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >{copiedIdx === idx ? '✓' : 'Copy'}</button>
                      <button onClick={() => deleteHistoryItem(entry.id)}
                        style={{ background: '#1e293b', color: '#f87171', border: '1px solid #334155', borderRadius: 5, padding: '3px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, cursor: 'pointer' }}
                      >×</button>
                    </div>
                  </div>
                  {editingCurlId === entry.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        autoFocus
                        value={editingCurlText}
                        onChange={(e) => setEditingCurlText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setEditingCurlId(null); }}
                        rows={6}
                        style={{
                          width: '100%', background: '#0b1120', color: '#22d3ee',
                          border: '1px solid #6366f1', borderRadius: 6, padding: 12,
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, lineHeight: 1.6,
                          resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveCurlEdit(entry.id)}
                          style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >Save</button>
                        <button onClick={() => setEditingCurlId(null)}
                          style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 5, padding: '4px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, cursor: 'pointer' }}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <pre style={{
                        background: '#0b1120', borderRadius: 6, padding: 12, margin: 0,
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, lineHeight: 1.6,
                        color: '#22d3ee', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      }}>{entry.curl}</pre>
                      <button
                        onClick={() => { setEditingCurlId(entry.id); setEditingCurlText(entry.curl); }}
                        title="Edit command"
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: '#1e293b', color: '#64748b', border: '1px solid #334155',
                          borderRadius: 4, padding: '2px 8px', fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10, cursor: 'pointer',
                        }}
                      >✏️ Edit</button>
                    </div>
                  )}
                </div>
              ));
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

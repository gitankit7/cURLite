import React, { useState } from 'react';

const icons = ['🔵', '🟢', '🟠', '🔴', '🟣', '⚪', '🟡', '🔷', '💠', '⬡'];

export default function ServiceListScreen({ services, onSelect, onAdd, onDelete, onRename }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
      setShowAdd(false);
    }
  };

  const handleRename = (id) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b1120',
        fontFamily: "'IBM Plex Mono', monospace",
        color: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          borderBottom: '1px solid #1e293b',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#0b1120',
            }}
          >
            {'>_'}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: '#f1f5f9',
                letterSpacing: '-0.02em',
              }}
            >
              cURLite
            </div>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Select or create a service
            </div>
          </div>
        </div>
      </div>

      {/* Service Grid */}
      <div style={{ maxWidth: 720, width: '100%', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {services.map((svc, idx) => (
            <div
              key={svc.id}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onClick={() => {
                if (editingId !== svc.id) onSelect(svc);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(svc.id); setEditName(svc.name); }}
                  style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
                  title="Rename"
                >✏️</button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(svc.id); }}
                  style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
                  title="Delete"
                >🗑️</button>
              </div>

              <div style={{ fontSize: 32, marginBottom: 12 }}>{icons[idx % icons.length]}</div>
              {editingId === svc.id ? (
                <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(svc.id)}
                    style={{
                      flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #6366f1',
                      borderRadius: 6, padding: '4px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleRename(svc.id)}
                    style={{
                      background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6,
                      padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >✓</button>
                </div>
              ) : (
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: '#e2e8f0', marginBottom: 4 }}>
                  {svc.name}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                {svc.history?.length || 0} request{(svc.history?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          ))}

          {/* Add Service Card */}
          {!showAdd ? (
            <div
              onClick={() => setShowAdd(true)}
              style={{
                background: 'transparent', border: '2px dashed #1e293b', borderRadius: 12, padding: 20,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 120, transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ fontSize: 28, color: '#334155', marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Add Service</div>
            </div>
          ) : (
            <div
              style={{
                background: '#0f172a', border: '1px solid #6366f1', borderRadius: 12, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>New Service Name</div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. My API"
                style={{
                  background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
                  borderRadius: 8, padding: '8px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAdd}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                    border: 'none', borderRadius: 6, padding: '7px 0', fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}
                >Create</button>
                <button
                  onClick={() => { setShowAdd(false); setNewName(''); }}
                  style={{
                    background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                    borderRadius: 6, padding: '7px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, cursor: 'pointer',
                  }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

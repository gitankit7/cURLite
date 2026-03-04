import React, { useState, useEffect, useCallback } from 'react';
import storage from './storage.js';
import ServiceListScreen from './ServiceListScreen.jsx';
import BuilderScreen from './BuilderScreen.jsx';

const DEFAULT_SERVICES = [
  { id: 'svc-1', name: 'Service-1', history: [] },
  { id: 'svc-2', name: 'Service-2', history: [] },
  { id: 'svc-3', name: 'Service-3', history: [] },
];

export default function App() {
  const [services, setServices] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Load on mount
  useEffect(() => {
    (async () => {
      const stored = await storage.load();
      if (stored && stored.length > 0) {
        setServices(stored);
      } else {
        setServices(DEFAULT_SERVICES);
        await storage.save(DEFAULT_SERVICES);
      }
    })();
  }, []);

  const persist = useCallback(async (updated) => {
    setServices(updated);
    await storage.save(updated);
  }, []);

  const addService = (name) => {
    const newSvc = { id: `svc-${Date.now()}`, name, history: [] };
    persist([...services, newSvc]);
  };

  const deleteService = (id) => {
    persist(services.filter((s) => s.id !== id));
  };

  const renameService = (id, name) => {
    persist(services.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const updateService = (updated) => {
    const newList = services.map((s) => (s.id === updated.id ? updated : s));
    persist(newList);
    setSelectedService(updated);
  };

  if (!services) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0b1120', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'IBM Plex Mono', monospace", color: '#475569',
      }}>
        Loading...
      </div>
    );
  }

  if (selectedService) {
    const fresh = services.find((s) => s.id === selectedService.id) || selectedService;
    return <BuilderScreen service={fresh} onBack={() => setSelectedService(null)} onUpdateService={updateService} />;
  }

  return (
    <ServiceListScreen
      services={services}
      onSelect={setSelectedService}
      onAdd={addService}
      onDelete={deleteService}
      onRename={renameService}
    />
  );
}

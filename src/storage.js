/**
 * Storage layer — persists data to a JSON file on disk via the Express backend.
 *
 * File location:  curlite/data/services.json
 * To reset:       just delete the data/ folder or the file inside it.
 *
 * Falls back to localStorage if the backend is unreachable (e.g. running
 * frontend-only with `npm run dev` instead of `npm start`).
 */

const API = '/api/data';
const LS_KEY = 'curlite:services';

const storage = {
  /**
   * Load all services. Tries backend first, falls back to localStorage.
   */
  async load() {
    try {
      const res = await fetch(API);
      if (res.ok) {
        const { services } = await res.json();
        return services;
      }
    } catch {
      // backend unreachable
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Persist the full services array. Writes to backend + localStorage mirror.
   */
  async save(services) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(services));
    } catch { /* ignore */ }

    try {
      await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      });
    } catch (err) {
      console.warn('[storage] backend save failed, data in localStorage only:', err.message);
    }
  },

  /**
   * Clear all stored data.
   */
  async clear() {
    localStorage.removeItem(LS_KEY);
    try {
      await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: [] }),
      });
    } catch { /* ignore */ }
  },

  /**
   * Export data as a downloadable JSON file.
   */
  async exportJSON() {
    const data = await this.load();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curlite-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import from a JSON file and persist.
   */
  async importJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      await this.save(data);
      return data;
    }
    throw new Error('Invalid format — expected an array of services');
  },
};

export default storage;

import type { Track } from "../types/music";

const DB_NAME = "musify_offline_db";
const STORE_NAME = "downloaded_tracks";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStore = {
  async saveTrack(track: Track): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const item = {
          ...track,
          downloadedAt: new Date().toISOString(),
        };
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      // Fallback to localStorage if IndexedDB is blocked in private browsing
      try {
        const existing = JSON.parse(localStorage.getItem("musify_offline_fallback") || "[]");
        const filtered = existing.filter((t: Track) => t.id !== track.id);
        filtered.unshift(track);
        localStorage.setItem("musify_offline_fallback", JSON.stringify(filtered.slice(0, 50)));
      } catch {}
    }
  },

  async removeTrack(trackId: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(trackId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem("musify_offline_fallback") || "[]");
        const filtered = existing.filter((t: Track) => t.id !== trackId);
        localStorage.setItem("musify_offline_fallback", JSON.stringify(filtered));
      } catch {}
    }
  },

  async getAllTracks(): Promise<Track[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        return JSON.parse(localStorage.getItem("musify_offline_fallback") || "[]");
      } catch {
        return [];
      }
    }
  },

  async isDownloaded(trackId: string): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(Boolean(req.result));
        req.onerror = () => resolve(false);
      });
    } catch {
      try {
        const existing: Track[] = JSON.parse(localStorage.getItem("musify_offline_fallback") || "[]");
        return existing.some((t) => t.id === trackId);
      } catch {
        return false;
      }
    }
  },
};


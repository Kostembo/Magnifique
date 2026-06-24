const DB_NAME = "magnifique-shifts";
const STORE = "pending-shifts";
const SYNC_TAG = "shift-sync";

export interface PendingShift {
  id: string;
  action: "checkin" | "checkout";
  event_id: string;
  timestamp: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueShift(shift: PendingShift): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(shift);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function scheduleShiftSync(shift: PendingShift): Promise<void> {
  await queueShift(shift);
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // Background Sync API (not universally typed)
      const syncMgr = (reg as unknown as { sync?: { register(tag: string): Promise<void> } }).sync;
      if (syncMgr) await syncMgr.register(SYNC_TAG);
    } catch {
      // SW not ready or sync not supported — pending item stays in IndexedDB
    }
  }
}

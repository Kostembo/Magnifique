// Service Worker — Magnifique PWA
const STATIC_CACHE = "magnifique-static-v1";
const PAGES_CACHE = "magnifique-pages-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Не кэшируем API запросы и Next.js внутренние роуты
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Для навигационных запросов (HTML страницы) — network first, fallback на кэш
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
    );
    return;
  }

  // Для статических ассетов — cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
  }
});

// Web Push уведомления
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Magnifique", body: event.data.text() };
  }

  const { title = "Magnifique", body = "", url = "/", tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: tag ?? "magnifique-notification",
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

// ─── Background Sync — offline check-in / checkout ───────────────────────────

const SHIFT_STORE = "pending-shifts";

function swOpenShiftDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("magnifique-shifts", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(SHIFT_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function swGetPending() {
  const db = await swOpenShiftDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(SHIFT_STORE, "readonly").objectStore(SHIFT_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function swRemove(id) {
  const db = await swOpenShiftDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHIFT_STORE, "readwrite");
    tx.objectStore(SHIFT_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function syncShifts() {
  const shifts = await swGetPending();
  for (const shift of shifts) {
    const endpoint = shift.action === "checkin"
      ? "/api/time-entries/checkin"
      : "/api/time-entries/checkout";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: shift.event_id, timestamp: shift.timestamp }),
      });
      // Remove on success or unrecoverable error (4xx) — retryable errors (5xx) stay in queue
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await swRemove(shift.id);
      }
    } catch {
      // Network still down — leave in queue, will retry on next sync
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "shift-sync") {
    event.waitUntil(syncShifts());
  }
});

// Клик по уведомлению — открываем нужную страницу
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

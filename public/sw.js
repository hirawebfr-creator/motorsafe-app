/**
 * MotorSafe Service Worker
 * 
 * Fonctionnalités:
 * - Cache des assets statiques pour fonctionnement hors-ligne partiel
 * - Stratégie network-first pour les APIs
 * - Cache-first pour les ressources statiques
 */

const CACHE_NAME = "motorsafe-v1";
const STATIC_CACHE_NAME = "motorsafe-static-v1";

// Assets à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
];

// Patterns pour le cache statique
const STATIC_PATTERNS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
];

// Installation - précache des assets essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Précache des assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation - nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => {
            console.log("[SW] Suppression ancien cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // Ignorer les requêtes API (toujours réseau)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques - cache first
  const isStatic = STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isStatic) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages - network first avec fallback
  event.respondWith(networkFirst(request));
});

// Stratégie Cache First (pour les assets statiques)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error("[SW] Fetch error:", error);
    return new Response("Offline", { status: 503 });
  }
}

// Stratégie Network First (pour les pages et APIs)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Fallback pour les pages HTML
    if (request.headers.get("Accept")?.includes("text/html")) {
      return caches.match("/") || new Response("Offline", { status: 503 });
    }
    
    return new Response("Offline", { status: 503 });
  }
}

// Réception de messages (pour forcer refresh, etc.)
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// ============================================================================
// Push Notifications
// ============================================================================

self.addEventListener("push", (event) => {
  console.log("[SW] Push reçu:", event);

  let data = {
    title: "MotorSafe",
    body: "Vous avez une nouvelle notification",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    tag: "motorsafe-notification",
    url: "/notifications",
  };

  // Parser les données du push si présentes
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        url: payload.url || data.url,
        data: payload.data || {},
      };
    } catch (e) {
      // Si pas du JSON, utiliser comme texte
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      ...data.data,
    },
    actions: [
      { action: "open", title: "Voir" },
      { action: "dismiss", title: "Ignorer" },
    ],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click sur une notification
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification cliquée:", event);
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";
  
  if (event.action === "dismiss") {
    return;
  }

  // Ouvrir ou focus sur l'onglet existant
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Chercher un onglet MotorSafe déjà ouvert
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Fermeture d'une notification
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification fermée:", event);
});

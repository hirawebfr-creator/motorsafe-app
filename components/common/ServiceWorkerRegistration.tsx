"use client";

import { useEffect } from "react";

/**
 * PWA Service Worker Registration
 * 
 * Enregistre le service worker pour les fonctionnalités PWA:
 * - Installation sur l'écran d'accueil
 * - Fonctionnement hors-ligne partiel
 * - Mise en cache des assets
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Enregistrer le service worker en production uniquement
    if (process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered:", registration.scope);

            // Vérifier les mises à jour périodiquement
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Toutes les heures
          })
          .catch((error) => {
            console.error("[PWA] Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}

/**
 * Hook pour détecter si l'app est installée en mode standalone
 */
export function useIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - Safari iOS
    window.navigator.standalone === true
  );
}

/**
 * Hook pour l'événement d'installation PWA
 */
export function useInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      
      // Stocker pour afficher plus tard
      window.dispatchEvent(
        new CustomEvent("pwa-install-available", { detail: deferredPrompt })
      );
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);
}

// Type pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * Demande la permission pour les notifications push
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("[PWA] Notifications non supportées");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("[PWA] Permission notifications refusée");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Vérifier si déjà abonné
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Créer un nouvel abonnement
      // Note: En production, la clé VAPID viendrait du serveur
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn("[PWA] VAPID key non configurée, utilisation des notifications locales");
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Envoyer l'abonnement au serveur
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
    }

    console.log("[PWA] Push subscription active");
    return subscription;
  } catch (error) {
    console.error("[PWA] Erreur abonnement push:", error);
    return null;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notifier le serveur
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      
      console.log("[PWA] Désabonné des push notifications");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[PWA] Erreur désabonnement push:", error);
    return false;
  }
}

/**
 * Envoyer une notification locale (sans serveur)
 */
export async function sendLocalNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: "motorsafe-local",
      ...options,
    });
    
    return true;
  } catch (error) {
    console.error("[PWA] Erreur notification locale:", error);
    return false;
  }
}

/**
 * Vérifier si les notifications push sont supportées et activées
 */
export function getPushNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  canAsk: boolean;
} {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { supported: false, permission: "unsupported", canAsk: false };
  }

  return {
    supported: true,
    permission: Notification.permission,
    canAsk: Notification.permission === "default",
  };
}

// Helper pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

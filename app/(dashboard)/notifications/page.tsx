"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Settings,
  Loader2,
  RefreshCw,
  Car,
  FileText,
  CreditCard,
  PenTool,
  Calendar,
  UserPlus,
} from "lucide-react";

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

type NotificationCategory = "info" | "success" | "warning" | "error";

type Notification = {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
};

interface ApiNotification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<NotificationCategory, { bg: string; color: string }> = {
  info: { bg: "#DBEAFE", color: "#2563EB" },
  success: { bg: "#D1FAE5", color: "#059669" },
  warning: { bg: "#FEF3C7", color: "#D97706" },
  error: { bg: "#FEE2E2", color: "#DC2626" },
};

function getNotificationMeta(type: string): { Icon: typeof Bell; category: NotificationCategory } {
  switch (type) {
    case "intervention_created":
    case "intervention_completed":
      return { Icon: Car, category: "info" };
    case "signature_requested":
    case "signature_completed":
      return { Icon: PenTool, category: "success" };
    case "signature_expired":
      return { Icon: PenTool, category: "warning" };
    case "quote_accepted":
      return { Icon: FileText, category: "success" };
    case "quote_rejected":
      return { Icon: FileText, category: "error" };
    case "invoice_paid":
      return { Icon: CreditCard, category: "success" };
    case "invoice_overdue":
      return { Icon: CreditCard, category: "error" };
    case "client_created":
    case "vehicle_created":
      return { Icon: UserPlus, category: "info" };
    case "appointment_reminder":
      return { Icon: Calendar, category: "warning" };
    case "siv_quota_low":
    case "storage_quota_low":
    case "subscription_expiring":
      return { Icon: AlertCircle, category: "warning" };
    default:
      return { Icon: Bell, category: "info" };
  }
}

function parseContent(content: string): { title: string; message: string; actionUrl?: string } {
  try {
    const parsed = JSON.parse(content);
    return { title: parsed.title || "Notification", message: parsed.message || content, actionUrl: parsed.actionUrl };
  } catch {
    return { title: "Notification", message: content };
  }
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ============================================
// Component
// ============================================

export default function NotificationsPage() {
  const { isMobile, isTablet } = useResponsive();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.ok && data.notifications) {
        const mapped: Notification[] = data.notifications.map((n: ApiNotification) => {
          const { title, message, actionUrl } = parseContent(n.content);
          const meta = getNotificationMeta(n.type);
          return { id: n.id, type: n.type, category: meta.category, title, message, time: formatTime(n.createdAt), read: n.read, actionUrl };
        });
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read", id }) });
    } catch (err) {
      console.error("Failed to mark as read:", err);
      fetchNotifications();
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_all_read" }) });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  }

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      fetchNotifications();
    }
  }

  async function clearAll() {
    if (!confirm("Supprimer toutes les notifications ?")) return;
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_all" }) });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      fetchNotifications();
    }
  }

  const cardStyle: React.CSSProperties = { borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" };
  const statCardStyle: React.CSSProperties = { ...cardStyle, padding: "20px" };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "32px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={24} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>Notifications</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Restez informé des événements importants</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => void fetchNotifications()} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>
            <RefreshCw size={16} color="#6B7280" />
          </button>
          {unreadCount > 0 && (
            <button onClick={() => void markAllAsRead()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
              <Check size={16} /> Tout marquer comme lu
            </button>
          )}
          <a href="/parametres?tab=notifications" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 500, color: "#374151", textDecoration: "none" }}>
            <Settings size={16} /> Paramètres
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Total</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>{notifications.length}</div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={24} color="#7C3AED" />
            </div>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Non lues</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>{unreadCount}</div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={24} color="#D97706" />
            </div>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Lues</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>{notifications.length - unreadCount}</div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={24} color="#059669" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setFilter("all")} style={{ padding: "8px 16px", borderRadius: "9999px", border: "none", fontSize: "14px", fontWeight: 500, background: filter === "all" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6", color: filter === "all" ? "#fff" : "#6B7280", cursor: "pointer" }}>Toutes</button>
          <button onClick={() => setFilter("unread")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "9999px", border: "none", fontSize: "14px", fontWeight: 500, background: filter === "unread" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6", color: filter === "unread" ? "#fff" : "#6B7280", cursor: "pointer" }}>
            Non lues
            {unreadCount > 0 && <span style={{ padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, background: filter === "unread" ? "rgba(255,255,255,0.3)" : "#6366F1", color: "#fff" }}>{unreadCount}</span>}
          </button>
        </div>
        {notifications.length > 0 && (
          <button onClick={() => void clearAll()} style={{ background: "none", border: "none", fontSize: "14px", color: "#DC2626", cursor: "pointer" }}>Tout supprimer</button>
        )}
      </div>

      {/* Notifications List */}
      <div style={cardStyle}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <BellOff size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Aucune notification</div>
            <div style={{ fontSize: "14px", color: "#6B7280" }}>{filter === "unread" ? "Vous avez lu toutes vos notifications" : "Vous n'avez pas encore de notifications"}</div>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification, idx) => {
              const cfg = CATEGORY_CONFIG[notification.category];
              const meta = getNotificationMeta(notification.type);
              const Icon = meta.Icon;
              return (
                <div key={notification.id} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px", borderTop: idx > 0 ? "1px solid #E5E7EB" : "none", background: !notification.read ? "rgba(99, 102, 241, 0.05)" : "transparent" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: notification.read ? 500 : 600, color: notification.read ? "#6B7280" : "#111827" }}>{notification.title}</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6B7280" }}>{notification.message}</p>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                        <Clock size={12} /> {notification.time}
                      </span>
                    </div>
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                      {!notification.read && (
                        <button onClick={() => void markAsRead(notification.id)} style={{ background: "none", border: "none", fontSize: "13px", fontWeight: 500, color: "#6366F1", cursor: "pointer" }}>Marquer comme lu</button>
                      )}
                      {notification.actionUrl && (
                        <a href={notification.actionUrl} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, color: "#6366F1", textDecoration: "none" }}>
                          Voir détails <ChevronRight size={14} />
                        </a>
                      )}
                      <button onClick={() => void deleteNotification(notification.id)} style={{ background: "none", border: "none", fontSize: "13px", color: "#9CA3AF", cursor: "pointer" }}>Supprimer</button>
                    </div>
                  </div>
                  {!notification.read && <div style={{ width: "8px", height: "8px", borderRadius: "9999px", background: "#6366F1", flexShrink: 0, marginTop: "6px" }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

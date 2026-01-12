"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Info,
  Settings,
} from "lucide-react";

type NotificationType = "info" | "success" | "warning" | "error";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
};

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; bg: string; color: string }> = {
  info: { icon: Info, bg: "var(--ms-info-light)", color: "var(--ms-info)" },
  success: { icon: CheckCircle, bg: "var(--ms-success-light)", color: "var(--ms-success)" },
  warning: { icon: AlertCircle, bg: "var(--ms-warning-light)", color: "var(--ms-warning)" },
  error: { icon: AlertCircle, bg: "var(--ms-error-light)", color: "var(--ms-error)" },
};

// Demo notifications - currently empty
const DEMO_NOTIFICATIONS: Notification[] = [];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read) 
    : notifications;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setNotifications([]);
  }

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Notifications</h1>
          <p className="ms-page-subtitle">
            Restez informé des événements importants
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="ms-btn ms-btn-secondary"
            >
              <Check size={16} />
              Tout marquer comme lu
            </button>
          )}
          <button type="button" className="ms-btn ms-btn-ghost">
            <Settings size={16} />
            Paramètres
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Total</div>
              <div className="ms-stat-value">{notifications.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <Bell size={24} className="text-[var(--ms-primary)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Non lues</div>
              <div className="ms-stat-value">{unreadCount}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]">
              <AlertCircle size={24} className="text-[var(--ms-warning)]" />
            </div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="ms-stat-label">Lues</div>
              <div className="ms-stat-value">{notifications.length - unreadCount}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-success-light)]">
              <CheckCircle size={24} className="text-[var(--ms-success)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div className="ms-tabs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`ms-tab ${filter === "all" ? "ms-tab-active" : ""}`}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`ms-tab ${filter === "unread" ? "ms-tab-active" : ""}`}
          >
            Non lues
            {unreadCount > 0 && (
              <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--ms-primary)] px-1.5 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-[var(--ms-error)] hover:underline"
          >
            Tout supprimer
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="ms-card">
        {filteredNotifications.length === 0 ? (
          <div className="ms-empty py-12">
            <div className="ms-empty-icon">
              <BellOff size={28} />
            </div>
            <div className="ms-empty-title">Aucune notification</div>
            <div className="ms-empty-text">
              {filter === "unread"
                ? "Vous avez lu toutes vos notifications"
                : "Vous n'avez pas encore de notifications"}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--ms-border)]">
            {filteredNotifications.map((notification, idx) => {
              const cfg = TYPE_CONFIG[notification.type];
              const Icon = cfg.icon;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-5 transition-colors ms-animate-slide-up ${
                    !notification.read ? "bg-[var(--ms-primary-light)]/30" : ""
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-sm ${!notification.read ? "font-semibold text-[var(--ms-text)]" : "font-medium text-[var(--ms-text-secondary)]"}`}>
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-xs text-[var(--ms-text-muted)]">
                          <Clock size={12} className="mr-1 inline-block" />
                          {notification.time}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm font-medium text-[var(--ms-primary)] hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="flex items-center gap-1 text-sm font-medium text-[var(--ms-primary)] hover:underline"
                        >
                          Voir détails
                          <ChevronRight size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-error)]"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--ms-primary)]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

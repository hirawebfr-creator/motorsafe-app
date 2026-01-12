"use client";

import { useState } from "react";
import {
  Archive,
  Inbox,
  MessageCircle,
  Reply,
  Search,
  Send,
  Star,
  Trash2,
  User,
} from "lucide-react";

type Message = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
};

export default function MessagesPage() {
  const [messages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "inbox", label: "Boîte de réception", icon: Inbox, count: messages.filter((m) => !m.read).length },
    { id: "sent", label: "Envoyés", icon: Send },
    { id: "starred", label: "Favoris", icon: Star },
    { id: "archive", label: "Archivés", icon: Archive },
  ];
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Messages</h1>
          <p className="ms-page-subtitle">
            Gérez vos conversations avec vos clients
          </p>
        </div>
        <button type="button" className="ms-btn ms-btn-primary">
          <MessageCircle size={18} />
          Nouveau message
        </button>
      </div>

      {/* Main Content */}
      <div className="ms-card overflow-hidden">
        <div className="flex" style={{ minHeight: "calc(100vh - 280px)" }}>
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--ms-border)] bg-[var(--ms-bg)]">
            {/* Search */}
            <div className="p-4">
              <div className="ms-search">
                <Search size={16} className="ms-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ms-search-input"
                />
              </div>
            </div>

            {/* Tabs */}
            <nav className="px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[var(--ms-primary-light)] text-[var(--ms-primary)]"
                      : "text-[var(--ms-text-secondary)] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={18} />
                    {tab.label}
                  </div>
                  {tab.count ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--ms-primary)] px-1.5 text-xs font-semibold text-white">
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          {/* Message List & Content */}
          <div className="flex flex-1">
            {/* List */}
            <div className="w-80 border-r border-[var(--ms-border)]">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="ms-empty-icon mb-4">
                    <Inbox size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--ms-text)]">Aucun message</h3>
                  <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                    Votre boîte de réception est vide
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--ms-border)]">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedId(msg.id)}
                      className={`w-full p-4 text-left transition-colors hover:bg-[var(--ms-bg)] ${
                        selectedId === msg.id ? "bg-[var(--ms-primary-light)]" : ""
                      } ${!msg.read ? "bg-white" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                            <User size={16} className="text-white" />
                          </div>
                          <div>
                            <div className={`text-sm ${!msg.read ? "font-semibold text-[var(--ms-text)]" : "text-[var(--ms-text-secondary)]"}`}>
                              {msg.sender}
                            </div>
                            <div className="text-xs text-[var(--ms-text-muted)]">{msg.time}</div>
                          </div>
                        </div>
                        {msg.starred && <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />}
                      </div>
                      <div className={`mt-2 text-sm ${!msg.read ? "font-medium text-[var(--ms-text)]" : "text-[var(--ms-text-secondary)]"}`}>
                        {msg.subject}
                      </div>
                      <div className="mt-1 truncate text-xs text-[var(--ms-text-muted)]">
                        {msg.preview}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col">
              {!selectedId ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ms-bg)]">
                    <MessageCircle size={32} className="text-[var(--ms-text-muted)]" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--ms-text)]">
                    Sélectionnez un message
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ms-text-muted)]">
                    Cliquez sur un message pour voir son contenu
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  {/* Message Header */}
                  <div className="flex items-center justify-between border-b border-[var(--ms-border)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ms-primary)] to-[#8B5CF6]">
                        <User size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--ms-text)]">
                          {messages.find((m) => m.id === selectedId)?.sender}
                        </div>
                        <div className="text-sm text-[var(--ms-text-muted)]">
                          {messages.find((m) => m.id === selectedId)?.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="ms-btn-icon-sm ms-btn-ghost rounded-lg">
                        <Reply size={18} />
                      </button>
                      <button type="button" className="ms-btn-icon-sm ms-btn-ghost rounded-lg">
                        <Star size={18} />
                      </button>
                      <button type="button" className="ms-btn-icon-sm ms-btn-ghost rounded-lg">
                        <Archive size={18} />
                      </button>
                      <button type="button" className="ms-btn-icon-sm ms-btn-ghost rounded-lg text-[var(--ms-error)]">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="text-lg font-semibold text-[var(--ms-text)]">
                      {messages.find((m) => m.id === selectedId)?.subject}
                    </h2>
                    <div className="mt-4 text-[var(--ms-text-secondary)]">
                      {messages.find((m) => m.id === selectedId)?.preview}
                    </div>
                  </div>

                  {/* Reply Input */}
                  <div className="border-t border-[var(--ms-border)] p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Écrire une réponse..."
                        className="flex-1 rounded-lg border border-[var(--ms-border)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--ms-primary)] focus:ring-2 focus:ring-[var(--ms-primary-light)]"
                      />
                      <button type="button" className="ms-btn ms-btn-primary">
                        <Send size={16} />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

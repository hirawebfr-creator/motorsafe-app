"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/shared/use-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Car,
  Wrench,
  Check,
  Loader2,
  Clock,
  Bell,
  CalendarDays,
  X,
} from "lucide-react";

// ============================================================================
// PLANNING PAGE - SafeMotor Design System (Fully Responsive)
// ============================================================================

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

  return {
    isMobile: screen === "mobile",
    isTablet: screen === "tablet",
    screen,
  };
}

// Types
type AppointmentStatus = "SCHEDULED" | "DONE" | "CANCELLED" | "NO_SHOW";

type Appointment = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes: string | null;
  reminderPolicy: "NONE" | "STANDARD";
  client: { id: number; firstName: string; lastName: string; phone?: string | null };
  vehicle?: { id: string; plate: string; brand: string; model: string } | null;
  intervention?: { id: string; status: string; typeIntervention: string } | null;
};

type Client = { id: number; firstName: string; lastName: string; email?: string | null };
type Vehicle = { id: string; plate: string; brand: string; model: string };
type ViewMode = "day" | "week";

// Helpers
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toLocalDateTimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: "Planifié", color: "#3B82F6", bg: "#DBEAFE" },
  DONE: { label: "Terminé", color: "#10B981", bg: "#ECFDF5" },
  CANCELLED: { label: "Annulé", color: "#6B7280", bg: "#F3F4F6" },
  NO_SHOW: { label: "Absent", color: "#F59E0B", bg: "#FFFBEB" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

// ============================================================================
// Main Component
// ============================================================================

export default function PlanningPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isMobile, isTablet } = useResponsive();

  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    vehicleId: "",
    interventionId: "",
    title: "",
    startAt: "",
    endAt: "",
    notes: "",
    reminderPolicy: "NONE" as "NONE" | "STANDARD",
  });

  // Handle query params
  useEffect(() => {
    const clientId = searchParams.get("clientId");
    const vehicleId = searchParams.get("vehicleId");
    const interventionId = searchParams.get("interventionId");
    const title = searchParams.get("title");

    if (clientId) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);

      setFormData({
        clientId,
        vehicleId: vehicleId || "",
        interventionId: interventionId || "",
        title: title || "",
        startAt: toLocalDateTimeString(now),
        endAt: toLocalDateTimeString(end),
        notes: "",
        reminderPolicy: "STANDARD",
      });
      setShowModal(true);
    }
  }, [searchParams]);

  // Data loading
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const from = view === "day" ? startOfDay(currentDate) : startOfWeek(currentDate);
      const to = view === "day" ? endOfDay(currentDate) : endOfWeek(currentDate);

      const res = await fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`);
      const json = await res.json();

      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur");
      setAppointments(json.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=100");
      const json = await res.json();
      if (json.ok) {
        const data = json.data?.items || json.data || [];
        setClients(data);
      }
    } catch {
      // Ignore
    }
  }, []);

  const loadVehicles = useCallback(async (clientId: number) => {
    try {
      const res = await fetch(`/api/vehicules?clientId=${clientId}&pageSize=50`);
      const json = await res.json();
      if (json.ok) {
        const data = json.data?.items || json.data || [];
        setVehicles(data);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (formData.clientId) {
      void loadVehicles(parseInt(formData.clientId));
    } else {
      setVehicles([]);
    }
  }, [formData.clientId, loadVehicles]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (view === "day" ? 1 : 7));
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === "day" ? 1 : 7));
    setCurrentDate(d);
  };

  // Actions
  const openNewModal = () => {
    setSelectedAppointment(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);

    setFormData({
      clientId: "",
      vehicleId: "",
      interventionId: "",
      title: "",
      startAt: toLocalDateTimeString(now),
      endAt: toLocalDateTimeString(end),
      notes: "",
      reminderPolicy: "NONE",
    });
    setShowModal(true);
  };

  const openEditModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setFormData({
      clientId: String(appt.client.id),
      vehicleId: appt.vehicle?.id || "",
      interventionId: appt.intervention?.id || "",
      title: appt.title,
      startAt: toLocalDateTimeString(new Date(appt.startAt)),
      endAt: toLocalDateTimeString(new Date(appt.endAt)),
      notes: appt.notes || "",
      reminderPolicy: appt.reminderPolicy,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setActionLoading("save");

      const payload = {
        clientId: parseInt(formData.clientId),
        vehicleId: formData.vehicleId || undefined,
        interventionId: formData.interventionId || undefined,
        title: formData.title,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        notes: formData.notes || undefined,
        reminderPolicy: formData.reminderPolicy,
      };

      const url = selectedAppointment ? `/api/appointments/${selectedAppointment.id}` : "/api/appointments";
      const method = selectedAppointment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (json.error?.code === "APPOINTMENT_CONFLICT") {
          const conflicts = json.error.details?.conflicts || [];
          const conflictMsg = conflicts
            .map((c: { title: string; startAt: string; endAt: string }) => `${c.title} (${formatTime(c.startAt)} - ${formatTime(c.endAt)})`)
            .join(", ");
          throw new Error(`Conflit avec: ${conflictMsg}`);
        }
        throw new Error(json.error?.message || "Erreur");
      }

      setShowModal(false);
      toast.success(selectedAppointment ? "RDV modifié" : "RDV créé");
      await loadAppointments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler ce RDV ?")) return;

    try {
      setActionLoading(`cancel-${id}`);
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur");
      toast.success("RDV annulé");
      await loadAppointments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      setActionLoading(`done-${id}`);
      const res = await fetch(`/api/appointments/${id}/mark-done`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Erreur");
      toast.success("RDV terminé");
      await loadAppointments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const weekDays = getWeekDays(currentDate);
  const padding = isMobile ? "16px" : isTablet ? "24px" : "32px";

  return (
    <div style={{ padding, maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: isMobile ? "40px" : "48px",
              height: isMobile ? "40px" : "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={isMobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111827", margin: 0 }}>
              Planning
            </h1>
            <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", margin: "4px 0 0" }}>
              Gérez vos rendez-vous
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: isMobile ? "10px 16px" : "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            fontSize: "14px",
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
          }}
        >
          <Plus size={18} />
          Nouveau RDV
        </button>
      </div>

      {/* Navigation Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: isMobile ? "12px" : "16px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <button type="button" onClick={goPrev} style={navBtnStyle}>
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goToday}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                background: "#fff",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Aujourd&apos;hui
            </button>
            <button type="button" onClick={goNext} style={navBtnStyle}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Date Display */}
          <h2
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: 600,
              color: "#111827",
              textAlign: "center",
              margin: 0,
            }}
          >
            {view === "day" ? formatDate(currentDate) : `${formatDateShort(weekDays[0])} — ${formatDateShort(weekDays[6])}`}
          </h2>

          {/* View Toggle */}
          <div style={{ display: "flex", gap: "8px", justifyContent: isMobile ? "center" : "flex-end" }}>
            <button
              type="button"
              onClick={() => setView("day")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: view === "day" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                fontSize: "13px",
                fontWeight: 500,
                color: view === "day" ? "#fff" : "#6B7280",
                cursor: "pointer",
              }}
            >
              <CalendarDays size={14} />
              Jour
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: view === "week" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                fontSize: "13px",
                fontWeight: 500,
                color: view === "week" ? "#fff" : "#6B7280",
                cursor: "pointer",
              }}
            >
              <Calendar size={14} />
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : appointments.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: isMobile ? "48px 24px" : "64px 24px",
            textAlign: "center",
          }}
        >
          <Calendar size={48} color="#9CA3AF" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
            Aucun rendez-vous
          </h3>
          <p style={{ color: "#6B7280", marginBottom: "24px" }}>Créez votre premier rendez-vous pour commencer</p>
          <button
            type="button"
            onClick={openNewModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Plus size={18} />
            Nouveau RDV
          </button>
        </div>
      ) : view === "day" ? (
        <DayView
          appointments={appointments}
          onEdit={openEditModal}
          onCancel={handleCancel}
          onMarkDone={handleMarkDone}
          actionLoading={actionLoading}
          isMobile={isMobile}
        />
      ) : (
        <WeekView weekDays={weekDays} appointments={appointments} onEdit={openEditModal} isMobile={isMobile} />
      )}

      {/* Modal */}
      {showModal && (
        <AppointmentModal
          isEdit={!!selectedAppointment}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          vehicles={vehicles}
          loading={actionLoading === "save"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          isMobile={isMobile}
        />
      )}

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
  background: "#fff",
  cursor: "pointer",
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ============================================================================
// Day View
// ============================================================================

function DayView({
  appointments,
  onEdit,
  onCancel,
  onMarkDone,
  actionLoading,
  isMobile,
}: {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onCancel: (id: string) => void;
  onMarkDone: (id: string) => void;
  actionLoading: string | null;
  isMobile: boolean;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
      {HOURS.map((hour, idx) => {
        const hourAppts = appointments.filter((a) => new Date(a.startAt).getHours() === hour);

        return (
          <div
            key={hour}
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              borderBottom: idx < HOURS.length - 1 ? "1px solid #F3F4F6" : "none",
              minHeight: isMobile ? "auto" : "70px",
            }}
          >
            <div
              style={{
                width: isMobile ? "100%" : "70px",
                padding: isMobile ? "8px 12px" : "12px",
                background: "#F9FAFB",
                borderRight: isMobile ? "none" : "1px solid #E5E7EB",
                borderBottom: isMobile ? "1px solid #E5E7EB" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: isMobile ? "flex-start" : "center",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280" }}>{hour}:00</span>
            </div>
            <div style={{ flex: 1, padding: "8px 12px" }}>
              {hourAppts.length === 0 ? (
                <div
                  style={{
                    height: isMobile ? "40px" : "50px",
                    borderRadius: "8px",
                    border: "1px dashed #E5E7EB",
                    background: "#FAFAFA",
                  }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {hourAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      onEdit={() => onEdit(appt)}
                      onCancel={() => onCancel(appt.id)}
                      onMarkDone={() => onMarkDone(appt.id)}
                      actionLoading={actionLoading}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Week View
// ============================================================================

function WeekView({
  weekDays,
  appointments,
  onEdit,
  isMobile,
}: {
  weekDays: Date[];
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  isMobile: boolean;
}) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(7, 100px)" : "repeat(7, 1fr)",
          gap: "8px",
          minWidth: isMobile ? "750px" : "auto",
        }}
      >
        {weekDays.map((day) => {
          const dayAppts = appointments.filter((a) => new Date(a.startAt).toDateString() === day.toDateString());
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={day.toISOString()}
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: `1px solid ${isToday ? "#6366F1" : "#E5E7EB"}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: isToday ? "#EEF2FF" : "#F9FAFB",
                  borderBottom: "1px solid #E5E7EB",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: isToday ? "#6366F1" : "#6B7280",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: isToday ? "#6366F1" : "#111827" }}>
                  {day.getDate()}
                </div>
              </div>

              <div style={{ padding: "8px", minHeight: "150px" }}>
                {dayAppts.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      minHeight: "130px",
                      borderRadius: "8px",
                      border: "1px dashed #E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9CA3AF",
                      fontSize: "11px",
                    }}
                  >
                    Aucun RDV
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dayAppts.map((appt) => (
                      <AppointmentCardCompact key={appt.id} appointment={appt} onClick={() => onEdit(appt)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Appointment Card (Day View)
// ============================================================================

function AppointmentCard({
  appointment,
  onEdit,
  onCancel,
  onMarkDone,
  actionLoading,
  isMobile,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onCancel: () => void;
  onMarkDone: () => void;
  actionLoading: string | null;
  isMobile: boolean;
}) {
  const cfg = STATUS_CONFIG[appointment.status];

  return (
    <div
      onClick={onEdit}
      style={{
        background: "#fff",
        borderRadius: "10px",
        border: "1px solid #E5E7EB",
        padding: isMobile ? "12px" : "14px 16px",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 600,
                background: cfg.bg,
                color: cfg.color,
              }}
            >
              {cfg.label}
            </span>
            <span style={{ fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} />
              {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
            </span>
          </div>
          <h4 style={{ fontSize: isMobile ? "14px" : "15px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
            {appointment.title}
          </h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: isMobile ? "8px" : "12px",
              fontSize: "12px",
              color: "#6B7280",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <User size={12} />
              {appointment.client.firstName} {appointment.client.lastName}
            </span>
            {appointment.vehicle && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Car size={12} />
                {appointment.vehicle.plate}
              </span>
            )}
            {appointment.intervention && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Wrench size={12} />
                Intervention liée
              </span>
            )}
          </div>
        </div>

        {appointment.status === "SCHEDULED" && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onMarkDone}
              disabled={!!actionLoading}
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "none",
                background: actionLoading === `done-${appointment.id}` ? "#D1FAE5" : "transparent",
                color: "#16A34A",
                cursor: actionLoading ? "not-allowed" : "pointer",
              }}
              title="Marquer terminé"
            >
              {actionLoading === `done-${appointment.id}` ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Check size={16} />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={!!actionLoading}
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "none",
                background: actionLoading === `cancel-${appointment.id}` ? "#FEE2E2" : "transparent",
                color: "#DC2626",
                cursor: actionLoading ? "not-allowed" : "pointer",
              }}
              title="Annuler"
            >
              {actionLoading === `cancel-${appointment.id}` ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <X size={16} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Appointment Card Compact (Week View)
// ============================================================================

function AppointmentCardCompact({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) {
  const cfg = STATUS_CONFIG[appointment.status];

  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: "8px",
        background: cfg.bg,
        borderLeft: `3px solid ${cfg.color}`,
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "2px" }}>{formatTime(appointment.startAt)}</div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#111827",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {appointment.title}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#6B7280",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {appointment.client.firstName} {appointment.client.lastName}
      </div>
    </div>
  );
}

// ============================================================================
// Modal
// ============================================================================

function AppointmentModal({
  isEdit,
  formData,
  setFormData,
  clients,
  vehicles,
  loading,
  onClose,
  onSubmit,
  isMobile,
}: {
  isEdit: boolean;
  formData: {
    clientId: string;
    vehicleId: string;
    interventionId: string;
    title: string;
    startAt: string;
    endAt: string;
    notes: string;
    reminderPolicy: "NONE" | "STANDARD";
  };
  setFormData: (data: typeof formData) => void;
  clients: Client[];
  vehicles: Vehicle[];
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isMobile: boolean;
}) {
  const isValid = formData.clientId && formData.title && formData.startAt && formData.endAt;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 100,
        padding: isMobile ? 0 : "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "16px 16px 0 0" : "16px",
          width: isMobile ? "100%" : "520px",
          maxWidth: "100%",
          maxHeight: isMobile ? "90vh" : "85vh",
          overflow: "auto",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
            {isEdit ? "Modifier le RDV" : "Nouveau RDV"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "4px", background: "transparent", border: "none", cursor: "pointer", color: "#6B7280" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Client */}
          <div>
            <label style={labelStyle}>Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value, vehicleId: "" })}
              style={selectStyle}
            >
              <option value="">Choisir un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          {vehicles.length > 0 && (
            <div>
              <label style={labelStyle}>Véhicule</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                style={selectStyle}
              >
                <option value="">Aucun véhicule</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={labelStyle}>Type de RDV *</label>
            <input
              type="text"
              placeholder="Ex: Diagnostic, E85, Reprog..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Début *</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fin *</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              placeholder="Notes optionnelles..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
            />
          </div>

          {/* Reminder */}
          <div>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
              <Bell size={14} />
              Rappels automatiques
            </label>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {[
                { value: "NONE", label: "Aucun rappel" },
                { value: "STANDARD", label: "Standard (J-1 + H-2)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `2px solid ${formData.reminderPolicy === opt.value ? "#6366F1" : "#E5E7EB"}`,
                    background: formData.reminderPolicy === opt.value ? "#EEF2FF" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="reminder"
                    value={opt.value}
                    checked={formData.reminderPolicy === opt.value}
                    onChange={() => setFormData({ ...formData, reminderPolicy: opt.value as "NONE" | "STANDARD" })}
                    style={{ width: "16px", height: "16px", accentColor: "#6366F1" }}
                  />
                  <span style={{ fontSize: "13px", color: "#111827" }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>
              Rappels envoyés par email 24h et 2h avant le RDV
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid || loading}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: !isValid || loading ? "#D1D5DB" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              cursor: !isValid || loading ? "not-allowed" : "pointer",
              boxShadow: !isValid || loading ? "none" : "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {isEdit ? "Modifier" : "Créer le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 500,
  color: "#374151",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  fontSize: "14px",
  background: "#fff",
  cursor: "pointer",
};

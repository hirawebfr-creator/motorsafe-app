"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Loading } from "@/components/common/Loading";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Car,
  Wrench,
  X,
  Check,
  Loader2,
} from "lucide-react";

// ============================================
// Types
// ============================================

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

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
};

type ViewMode = "day" | "week";

// ============================================
// Helpers
// ============================================

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: "Planifié", bg: "bg-blue-100", text: "text-blue-700" },
  DONE: { label: "Terminé", bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { label: "Annulé", bg: "bg-gray-100", text: "text-gray-500" },
  NO_SHOW: { label: "Absent", bg: "bg-orange-100", text: "text-orange-700" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

// ============================================
// Main Component
// ============================================

export default function PlanningPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
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

  // Handle query params from intervention page
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

  // ============================================
  // Data Loading
  // ============================================

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const from = view === "day" ? startOfDay(currentDate) : startOfWeek(currentDate);
      const to = view === "day" ? endOfDay(currentDate) : endOfWeek(currentDate);

      const res = await fetch(
        `/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`
      );
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur chargement");
      }

      setAppointments(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?limit=200");
      const json = await res.json();
      if (json.ok) {
        setClients(json.data || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  const loadVehicles = useCallback(async (clientId: number) => {
    try {
      const res = await fetch(`/api/vehicles?clientId=${clientId}&limit=50`);
      const json = await res.json();
      if (json.ok) {
        setVehicles(json.data || []);
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

  // ============================================
  // Navigation
  // ============================================

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === "day") {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (view === "day") {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  // ============================================
  // Actions
  // ============================================

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
      setError(null);

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

      const url = selectedAppointment
        ? `/api/appointments/${selectedAppointment.id}`
        : "/api/appointments";
      const method = selectedAppointment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        // Check for conflict
        if (json.error?.code === "APPOINTMENT_CONFLICT") {
          const conflicts = json.error.details?.conflicts || [];
          const conflictMsg = conflicts.map((c: { title: string; startAt: string; endAt: string }) => 
            `${c.title} (${formatTime(c.startAt)} - ${formatTime(c.endAt)})`
          ).join(", ");
          throw new Error(`Conflit avec: ${conflictMsg}`);
        }
        throw new Error(json.error?.message || "Erreur");
      }

      setShowModal(false);
      await loadAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur");
      }

      await loadAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      setActionLoading(`done-${id}`);
      const res = await fetch(`/api/appointments/${id}/mark-done`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur");
      }

      await loadAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // Render
  // ============================================

  const weekDays = getWeekDays(currentDate);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Planning"
        description="Gérez vos rendez-vous et planning"
        action={
          <Button onClick={openNewModal}>
            <Plus size={16} />
            Nouveau RDV
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goPrev}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="ghost" onClick={goNext}>
              <ChevronRight size={18} />
            </Button>
          </div>

          <h2 className="text-lg font-semibold">
            {view === "day"
              ? formatDate(currentDate)
              : `${formatDate(weekDays[0])} — ${formatDate(weekDays[6])}`}
          </h2>

          <div className="flex items-center gap-2">
            <Button
              variant={view === "day" ? "primary" : "secondary"}
              onClick={() => setView("day")}
            >
              Jour
            </Button>
            <Button
              variant={view === "week" ? "primary" : "secondary"}
              onClick={() => setView("week")}
            >
              Semaine
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {loading ? (
        <Loading />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} className="text-gray-400" />}
          title="Aucun RDV"
          description="Créez votre premier rendez-vous"
        />
      ) : view === "day" ? (
        <DayView
          appointments={appointments}
          onEdit={openEditModal}
          onCancel={handleCancel}
          onMarkDone={handleMarkDone}
          actionLoading={actionLoading}
        />
      ) : (
        <WeekView
          weekDays={weekDays}
          appointments={appointments}
          onEdit={openEditModal}
        />
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
        />
      )}
    </div>
  );
}

// ============================================
// Day View Component
// ============================================

function DayView({
  appointments,
  onEdit,
  onCancel,
  onMarkDone,
  actionLoading,
}: {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onCancel: (id: string) => void;
  onMarkDone: (id: string) => void;
  actionLoading: string | null;
}) {
  return (
    <div className="space-y-3">
      {HOURS.map((hour) => {
        const hourAppts = appointments.filter((a) => {
          const h = new Date(a.startAt).getHours();
          return h === hour;
        });

        return (
          <div key={hour} className="flex gap-4">
            <div className="w-16 text-sm text-muted2 pt-2">{hour}:00</div>
            <div className="flex-1 min-h-[60px] border-l-2 border-border pl-4">
              {hourAppts.length === 0 ? (
                <div className="h-[60px] bg-surface2/50 rounded-lg border border-dashed border-border" />
              ) : (
                <div className="space-y-2">
                  {hourAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      onEdit={() => onEdit(appt)}
                      onCancel={() => onCancel(appt.id)}
                      onMarkDone={() => onMarkDone(appt.id)}
                      actionLoading={actionLoading}
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

// ============================================
// Week View Component
// ============================================

function WeekView({
  weekDays,
  appointments,
  onEdit,
}: {
  weekDays: Date[];
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-2 min-w-[800px]">
        {weekDays.map((day) => {
          const dayAppts = appointments.filter((a) => {
            const apptDate = new Date(a.startAt).toDateString();
            return apptDate === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div
                className={`text-center p-2 rounded-lg ${
                  isToday ? "bg-indigo-100 text-indigo-700" : "bg-surface2"
                }`}
              >
                <div className="text-xs text-muted2">
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className="text-lg font-semibold">{day.getDate()}</div>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {dayAppts.length === 0 ? (
                  <div className="h-full border border-dashed border-border rounded-lg" />
                ) : (
                  dayAppts.map((appt) => (
                    <AppointmentCardCompact
                      key={appt.id}
                      appointment={appt}
                      onClick={() => onEdit(appt)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Appointment Card (Day View)
// ============================================

function AppointmentCard({
  appointment,
  onEdit,
  onCancel,
  onMarkDone,
  actionLoading,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onCancel: () => void;
  onMarkDone: () => void;
  actionLoading: string | null;
}) {
  const cfg = STATUS_CONFIG[appointment.status];

  return (
    <Card className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1" onClick={onEdit}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
            <span className="text-xs text-muted2">
              {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
            </span>
          </div>
          <h4 className="font-semibold">{appointment.title}</h4>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted2">
            <span className="flex items-center gap-1">
              <User size={14} />
              {appointment.client.firstName} {appointment.client.lastName}
            </span>
            {appointment.vehicle && (
              <span className="flex items-center gap-1">
                <Car size={14} />
                {appointment.vehicle.plate}
              </span>
            )}
            {appointment.intervention && (
              <span className="flex items-center gap-1">
                <Wrench size={14} />
                {appointment.intervention.typeIntervention}
              </span>
            )}
          </div>
        </div>

        {appointment.status === "SCHEDULED" && (
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkDone}
              disabled={!!actionLoading}
              className="p-1.5 rounded hover:bg-green-200 text-green-600"
              title="Marquer terminé"
            >
              {actionLoading === `done-${appointment.id}` ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={!!actionLoading}
              className="p-1.5 rounded hover:bg-red-200 text-red-600"
              title="Annuler"
            >
              {actionLoading === `cancel-${appointment.id}` ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Appointment Card Compact (Week View)
// ============================================

function AppointmentCardCompact({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[appointment.status];

  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-lg cursor-pointer hover:opacity-80 ${cfg.bg}`}
    >
      <div className="text-xs text-muted2">{formatTime(appointment.startAt)}</div>
      <div className={`text-sm font-medium truncate ${cfg.text}`}>{appointment.title}</div>
      <div className="text-xs truncate">
        {appointment.client.firstName} {appointment.client.lastName}
      </div>
    </div>
  );
}

// ============================================
// Modal Component
// ============================================

function AppointmentModal({
  isEdit,
  formData,
  setFormData,
  clients,
  vehicles,
  loading,
  onClose,
  onSubmit,
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
}) {
  const isValid = formData.clientId && formData.title && formData.startAt && formData.endAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? "Modifier le RDV" : "Nouveau RDV"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-surface2 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value, vehicleId: "" })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
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
              <label className="block text-sm font-medium mb-1">Véhicule</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">Type de RDV *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Diagnostic, E85, Reprog..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Début *</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fin *</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Notes optionnelles..."
            />
          </div>

          {/* Reminder Policy */}
          <div>
            <label className="block text-sm font-medium mb-2">Rappels automatiques</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reminderPolicy"
                  value="NONE"
                  checked={formData.reminderPolicy === "NONE"}
                  onChange={() => setFormData({ ...formData, reminderPolicy: "NONE" })}
                  className="h-4 w-4"
                />
                <span>Aucun</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reminderPolicy"
                  value="STANDARD"
                  checked={formData.reminderPolicy === "STANDARD"}
                  onChange={() => setFormData({ ...formData, reminderPolicy: "STANDARD" })}
                  className="h-4 w-4"
                />
                <span>Standard (J-1 + H-2)</span>
              </label>
            </div>
            <p className="text-xs text-muted2 mt-1">
              Rappels envoyés par email au client 24h et 2h avant le RDV
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!isValid || loading} className="flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : isEdit ? "Modifier" : "Créer"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Helper: Convert Date to datetime-local string
// ============================================

function toLocalDateTimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

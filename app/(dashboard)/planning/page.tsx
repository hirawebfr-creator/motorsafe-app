"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/shared/button";
import { Modal } from "@/components/shared/modal";
import { Select } from "@/components/shared/select";
import { Input } from "@/components/shared/input";
import { Textarea } from "@/components/shared/textarea";
import { Badge } from "@/components/shared/badge";
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'info' | 'success' | 'neutral' | 'warning' }> = {
  SCHEDULED: { label: "Planifié", variant: "info" },
  DONE: { label: "Terminé", variant: "success" },
  CANCELLED: { label: "Annulé", variant: "neutral" },
  NO_SHOW: { label: "Absent", variant: "warning" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

// ============================================
// Main Component
// ============================================

export default function PlanningPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    } catch {
      // Silently fail - toast would cause re-render loop
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=100");
      const json = await res.json();
      if (json.ok) {
        // L'API retourne { items, page, pageSize, total }
        const clientsData = json.data?.items || json.data || [];
        const mappedClients = clientsData.map((c: { id: number; firstName: string; lastName: string; email?: string | null }) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
        }));
        setClients(mappedClients);
      }
    } catch (err) {
      console.error("[DEBUG] loadClients error:", err);
    }
  }, []);

  const loadVehicles = useCallback(async (clientId: number) => {
    try {
      const res = await fetch(`/api/vehicules?clientId=${clientId}&pageSize=50`);
      const json = await res.json();
      if (json.ok) {
        // L'API retourne { items, page, pageSize, total }
        const vehiclesData = json.data?.items || json.data || [];
        setVehicles(vehiclesData);
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

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur");
      }

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

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur");
      }

      toast.success("RDV marqué comme terminé");
      await loadAppointments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
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
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '16px',
        marginBottom: '8px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Planning</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Gérez vos rendez-vous</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openNewModal}>
          Nouveau RDV
        </Button>
      </div>

      {/* Navigation Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Navigation Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={goPrev}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="ghost" size="sm" onClick={goNext}>
              <ChevronRight size={18} />
            </Button>
          </div>

          {/* Current Date Display */}
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {view === "day"
              ? formatDate(currentDate)
              : `${formatDate(weekDays[0])} — ${formatDate(weekDays[6])}`}
          </h2>

          {/* View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant={view === "day" ? "primary" : "secondary"}
              size="sm"
              leftIcon={<CalendarDays size={16} />}
              onClick={() => setView("day")}
            >
              Jour
            </Button>
            <Button
              variant={view === "week" ? "primary" : "secondary"}
              size="sm"
              leftIcon={<Calendar size={16} />}
              onClick={() => setView("week")}
            >
              Semaine
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#6B7280' }} />
        </div>
      ) : appointments.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <Calendar size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Aucun rendez-vous
          </h3>
          <p style={{ color: '#6B7280', marginBottom: '20px' }}>
            Créez votre premier rendez-vous pour commencer
          </p>
          <Button leftIcon={<Plus size={16} />} onClick={openNewModal}>
            Nouveau RDV
          </Button>
        </div>
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
      <AppointmentModal
        isOpen={showModal}
        isEdit={!!selectedAppointment}
        formData={formData}
        setFormData={setFormData}
        clients={clients}
        vehicles={vehicles}
        loading={actionLoading === "save"}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />
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
    <div style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      {HOURS.map((hour, index) => {
        const hourAppts = appointments.filter((a) => {
          const h = new Date(a.startAt).getHours();
          return h === hour;
        });

        return (
          <div 
            key={hour} 
            style={{
              display: 'flex',
              borderBottom: index < HOURS.length - 1 ? '1px solid #F3F4F6' : 'none',
              minHeight: '70px',
            }}
          >
            <div style={{
              width: '70px',
              padding: '12px',
              background: '#F9FAFB',
              borderRight: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                {hour}:00
              </span>
            </div>
            <div style={{ flex: 1, padding: '8px 12px' }}>
              {hourAppts.length === 0 ? (
                <div style={{
                  height: '100%',
                  minHeight: '50px',
                  borderRadius: '8px',
                  border: '1px dashed #E5E7EB',
                  background: '#FAFAFA',
                }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div style={{ overflowX: 'auto' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
        gap: '8px',
        minWidth: '1000px',
      }}>
        {weekDays.map((day) => {
          const dayAppts = appointments.filter((a) => {
            const apptDate = new Date(a.startAt).toDateString();
            return apptDate === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={day.toISOString()} style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: `1px solid ${isToday ? '#3B82F6' : '#E5E7EB'}`,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px',
                background: isToday ? '#EFF6FF' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                textAlign: 'center',
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: isToday ? '#3B82F6' : '#6B7280',
                  textTransform: 'uppercase',
                  fontWeight: '500',
                }}>
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: isToday ? '#3B82F6' : '#111827',
                }}>
                  {day.getDate()}
                </div>
              </div>

              <div style={{ padding: '8px', minHeight: '180px' }}>
                {dayAppts.length === 0 ? (
                  <div style={{
                    height: '100%',
                    minHeight: '160px',
                    borderRadius: '8px',
                    border: '1px dashed #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9CA3AF',
                    fontSize: '12px',
                  }}>
                    Aucun RDV
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayAppts.map((appt) => (
                      <AppointmentCardCompact
                        key={appt.id}
                        appointment={appt}
                        onClick={() => onEdit(appt)}
                      />
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
    <div 
      style={{
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onClick={onEdit}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
            <span style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
            </span>
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            {appointment.title}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} />
              {appointment.client.firstName} {appointment.client.lastName}
            </span>
            {appointment.vehicle && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Car size={14} />
                {appointment.vehicle.plate}
              </span>
            )}
            {appointment.intervention && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wrench size={14} />
                Intervention liée
              </span>
            )}
          </div>
        </div>

        {appointment.status === "SCHEDULED" && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onMarkDone}
              disabled={!!actionLoading}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: actionLoading === `done-${appointment.id}` ? '#D1FAE5' : 'transparent',
                color: '#16A34A',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLElement).style.background = '#D1FAE5'; }}
              onMouseLeave={(e) => { if (!actionLoading) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: actionLoading === `cancel-${appointment.id}` ? '#FEE2E2' : 'transparent',
                color: '#DC2626',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLElement).style.background = '#FEE2E2'; }}
              onMouseLeave={(e) => { if (!actionLoading) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              title="Annuler"
            >
              {actionLoading === `cancel-${appointment.id}` ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span style={{ fontWeight: '600', fontSize: '16px' }}>✕</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
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
  
  const bgColors = {
    info: '#EFF6FF',
    success: '#DCFCE7',
    neutral: '#F3F4F6',
    warning: '#FEF3C7',
  };
  
  const borderColors = {
    info: '#3B82F6',
    success: '#16A34A',
    neutral: '#9CA3AF',
    warning: '#F59E0B',
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: '8px',
        background: bgColors[cfg.variant],
        borderLeft: `3px solid ${borderColors[cfg.variant]}`,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
        {formatTime(appointment.startAt)}
      </div>
      <div style={{ 
        fontSize: '13px', 
        fontWeight: '600', 
        color: '#111827',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {appointment.title}
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: '#6B7280',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {appointment.client.firstName} {appointment.client.lastName}
      </div>
    </div>
  );
}

// ============================================
// Modal Component
// ============================================

function AppointmentModal({
  isOpen,
  isEdit,
  formData,
  setFormData,
  clients,
  vehicles,
  loading,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
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

  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: `${c.firstName} ${c.lastName}`,
  }));

  const vehicleOptions = [
    { value: "", label: "Aucun véhicule" },
    ...vehicles.map((v) => ({
      value: v.id,
      label: `${v.plate} - ${v.brand} ${v.model}`,
    })),
  ];

  const reminderOptions = [
    { value: "NONE", label: "Aucun rappel" },
    { value: "STANDARD", label: "Standard (J-1 + H-2)" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} fullWidth>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!isValid || loading} loading={loading} fullWidth>
            {isEdit ? "Modifier" : "Créer le RDV"}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Client */}
        <Select
          label="Client"
          required
          placeholder="Choisir un client..."
          options={clientOptions}
          value={formData.clientId}
          onValueChange={(val) => setFormData({ ...formData, clientId: val, vehicleId: "" })}
          searchable
          emptyText="Aucun client trouvé"
        />

        {/* Vehicle */}
        {vehicles.length > 0 && (
          <Select
            label="Véhicule"
            placeholder="Sélectionner un véhicule"
            options={vehicleOptions}
            value={formData.vehicleId}
            onValueChange={(val) => setFormData({ ...formData, vehicleId: val })}
          />
        )}

        {/* Title */}
        <Input
          label="Type de RDV"
          required
          placeholder="Ex: Diagnostic, E85, Reprog..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Début"
            required
            type="datetime-local"
            value={formData.startAt}
            onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
          />
          <Input
            label="Fin"
            required
            type="datetime-local"
            value={formData.endAt}
            onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          placeholder="Notes optionnelles..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          minRows={2}
        />

        {/* Reminder Policy */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
            <Bell size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Rappels automatiques
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            {reminderOptions.map((opt) => (
              <label 
                key={opt.value} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${formData.reminderPolicy === opt.value ? '#0A1628' : '#E5E7EB'}`,
                  background: formData.reminderPolicy === opt.value ? '#F9FAFB' : '#FFFFFF',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="reminderPolicy"
                  value={opt.value}
                  checked={formData.reminderPolicy === opt.value}
                  onChange={() => setFormData({ ...formData, reminderPolicy: opt.value as "NONE" | "STANDARD" })}
                  style={{ width: '16px', height: '16px', accentColor: '#0A1628' }}
                />
                <span style={{ fontSize: '14px', color: '#111827' }}>{opt.label}</span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
            Rappels envoyés par email au client 24h et 2h avant le RDV
          </p>
        </div>
      </div>
    </Modal>
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

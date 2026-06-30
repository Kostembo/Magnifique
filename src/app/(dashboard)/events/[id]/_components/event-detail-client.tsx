"use client";

import { useState, useRef, useTransition } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Pencil, Users, Package, MessageSquare,
  User, Clock, MapPin, Phone, UserCheck, UserX, Loader2,
  Bell, BellRing, Plus, ExternalLink, Check, X, FileDown, Trash2, ChefHat, UserPlus, Warehouse,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/utils";

import { ActiveShiftTab } from "./active-shift-tab";
import { EventMenuTab } from "./event-menu-tab";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { ShiftCheckinCard } from "./shift-checkin-card";
import { motion } from "framer-motion";
import { Ring, StaffBar, MagneticCard, stagger, fadeUp } from "@/lib/motion";

type AssignmentStatus = "invited" | "confirmed" | "declined" | "expired" | "waitlisted";

type Assignment = {
  id: string; status: AssignmentStatus; is_priority: boolean;
  invited_at: Date | string; responded_at?: Date | string | null;
  goes_to_warehouse: boolean;
  employee: { id: string; full_name: string; phone: string; role: string; tier: string };
};

type Position = {
  id: number; role: string; needed_count: number; reserved_for_core: number;
  priority_deadline?: Date | string | null; assignments: Assignment[];
};

type Comment = {
  id: string; body: string; created_at: Date | string;
  author: { id: string; full_name: string; role: string };
};

type RequisitionItem = { id: number; name: string; quantity: unknown; unit: string; is_picked: boolean };
type Requisition = { id: string; status: string; items: RequisitionItem[] };

type EventDetail = {
  id: string; title: string; client?: string | null; location?: string | null;
  starts_at: Date | string; status: string; positions: Position[];
  requisitions: Requisition[] | null[]; comments: Comment[];
  organizer_name?: string | null; organizer_phone?: string | null;
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  invited: "Ожидает", confirmed: "Подтвердил", declined: "Отказался",
  expired: "Истекло", waitlisted: "Хочет",
};

const STATUS_BADGE: Record<AssignmentStatus, "warning" | "success" | "danger" | "secondary" | "info"> = {
  invited: "warning", confirmed: "success", declined: "danger", expired: "secondary", waitlisted: "info",
};

const EVENT_STATUS: Record<string, { label: string; color: string }> = {
  recruiting: { label: "Набор",          color: "hsl(var(--warn))" },
  staffed:    { label: "Укомплектовано", color: "hsl(var(--info))" },
  draft:      { label: "Черновик",       color: "hsl(var(--muted-foreground))" },
  done:       { label: "Завершено",      color: "hsl(var(--muted-foreground))" },
};

type TimeEntryData = {
  checked_in_at: Date | string | null;
  checked_out_at: Date | string | null;
  calculated_hours: number | null;
  calculated_pay: number | null;
};

interface Props {
  event: EventDetail;
  isManager: boolean;
  role: string;
  currentUserId: string;
  timeEntry: TimeEntryData | null;
  hasConfirmedAssignment: boolean;
  menuItemCount: number;
  invitedAssignmentId: string | null;
}

export function EventDetailClient({ event, isManager, role, currentUserId, timeEntry, hasConfirmedAssignment, menuItemCount, invitedAssignmentId }: Props) {
  const canEditMenu = ["manager", "owner", "admin", "sales"].includes(role);
  const canSeeMenu = canEditMenu || role === "chef";
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [inviteStatus, setInviteStatus] = useState<"invited" | "confirmed" | "declined" | null>(invitedAssignmentId ? "invited" : null);
  const [comments, setComments] = useState(event.comments);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [requisition, setRequisition] = useState<Requisition | null>(event.requisitions?.[0] ?? null);
  const [creatingReq, setCreatingReq] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [positions, setPositions] = useState(event.positions);
  const [invitePosition, setInvitePosition] = useState<{ id: number; role: string; event_id: string } | null>(null);

  const totalConfirmed = positions.reduce((s, p) => s + p.assignments.filter((a) => a.status === "confirmed").length, 0);
  const totalNeeded = positions.reduce((s, p) => s + p.needed_count, 0);
  const pct = totalNeeded ? totalConfirmed / totalNeeded : 0;
  const sm = EVENT_STATUS[event.status] ?? EVENT_STATUS.draft;
  const isLive = event.status === "live";

  const isRecruitingDone = totalNeeded > 0 && pct >= 1;
  const isRequisitionDone = !!requisition && requisition.status === "done";
  const isMenuDone = menuItemCount > 0;

  async function inviteAction(mode: "core" | "pool" | "remind", positionId?: number) {
    try {
      const res = await fetch(`/api/events/${event.id}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...(positionId ? { position_id: positionId } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const n = data.invited ?? data.reminded ?? 0;
        if (n === 0 && mode !== "remind") {
          toast({ title: "Никто не приглашён", description: "Нет подходящих сотрудников: проверьте позиции и наличие активных сотрудников нужной роли.", variant: "destructive" });
        } else {
          toast({ title: mode === "remind" ? `Напоминание отправлено ${n} чел.` : `Приглашено ${n} чел.`, variant: "success" });
        }
        startTransition(() => router.refresh());
      } else {
        toast({ title: "Ошибка", description: data.error ?? "Не удалось отправить приглашения", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
    }
  }

  async function toggleWarehouse(positionId: number, assignmentId: string, current: boolean) {
    try {
      const res = await fetch(`/api/events/${event.id}/assignments/${assignmentId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goes_to_warehouse: !current }),
      });
      if (res.ok) {
        setPositions((prev) => prev.map((p) => {
          if (p.id !== positionId) return p;
          return { ...p, assignments: p.assignments.map((a) => a.id === assignmentId ? { ...a, goes_to_warehouse: !current } : a) };
        }));
      }
    } catch { /* non-critical */ }
  }

  async function removeAssignment(assignmentId: string) {
    setRemovingId(assignmentId);
    try {
      const res = await fetch(`/api/events/${event.id}/assignments/${assignmentId}`, { method: "DELETE" });
      if (res.ok) {
        setPositions((prev) => prev.map((p) => ({ ...p, assignments: p.assignments.filter((a) => a.id !== assignmentId) })));
        toast({ title: "Сотрудник удалён из мероприятия", variant: "success" });
      } else {
        toast({ title: "Ошибка удаления", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  }

  async function createRequisition() {
    setCreatingReq(true);
    try {
      const res = await fetch(`/api/events/${event.id}/requisitions`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRequisition(data);
        toast({ title: "Заявка создана", variant: "success" });
      } else {
        toast({ title: "Ошибка создания заявки", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
    } finally {
      setCreatingReq(false);
    }
  }

  async function deleteEvent() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/events";
        return;
      }
      toast({ title: "Ошибка удаления", variant: "destructive" });
      setConfirmDelete(false);
      setDeleting(false);
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/events/${event.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setCommentText("");
      } else {
        toast({ title: "Ошибка отправки", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const ROLE_L: Record<string, string> = { waiter: "Официант", cook: "Повар", warehouse: "Склад", manager: "Менеджер" };
    const TIER_L: Record<string, string> = { core: "Костяк", regular: "Основной", trainee: "Стажёр" };
    const fontBuffer = await fetch("/fonts/Arial.ttf").then((r) => r.arrayBuffer());
    const bytes = new Uint8Array(fontBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const doc = new jsPDF();
    doc.addFileToVFS("Arial.ttf", btoa(binary));
    doc.addFont("Arial.ttf", "Arial", "normal");
    doc.setFont("Arial");
    const dateStr = format(new Date(event.starts_at), "d MMMM yyyy, HH:mm", { locale: ru });
    doc.setFontSize(16); doc.text(event.title, 14, 18);
    doc.setFontSize(10); doc.setTextColor(120); doc.text(dateStr, 14, 26); doc.setTextColor(0);
    const confirmed = positions.flatMap((p) =>
      p.assignments.filter((a) => a.status === "confirmed").map((a) => [
        a.employee.full_name, a.employee.phone, ROLE_L[a.employee.role] ?? a.employee.role, TIER_L[a.employee.tier] ?? a.employee.tier,
      ])
    );
    autoTable(doc, {
      startY: 32, head: [["ФИО", "Телефон", "Должность", "Уровень"]],
      body: confirmed.length ? confirmed : [["Нет подтверждённых сотрудников", "", "", ""]],
      styles: { font: "Arial", fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42], textColor: [244, 244, 245] },
    });
    doc.save(`staff_${event.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}.pdf`);
  }

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-4 max-w-5xl mx-auto">

      {/* Back + manager actions */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-2xl">
          <Link href="/events"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        {isManager && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />Изменить
              </Link>
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <Button variant="destructive" size="sm" onClick={deleteEvent} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить?"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Нет</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hero card */}
      <MagneticCard
        layoutId={`ev-${event.id}`}
        strength={0}
        className="relative rounded-3xl p-5 overflow-hidden"
        style={{
          background: isLive
            ? "linear-gradient(165deg, rgba(246,183,60,0.16), rgba(246,183,60,0.03) 55%, hsl(var(--card)))"
            : "hsl(var(--card))",
          border: isLive ? "1px solid rgba(246,183,60,0.22)" : "1px solid hsl(var(--border))",
        }}
      >
        {isLive && (
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,183,60,0.22), transparent 70%)" }} />
        )}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
              style={{ color: sm.color, background: `${sm.color}1f` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: sm.color }} />
              {sm.label}
            </span>
            <motion.h1 layout className="relative font-display font-extrabold text-[26px] leading-[1.08] tracking-[-0.03em] mt-3">
              {event.title}
            </motion.h1>
            {event.client && <p className="relative text-[14px] text-muted-foreground mt-1.5">{event.client}</p>}
          </div>
          <div className="shrink-0 text-right mt-0.5">
            <div className="flex items-center justify-end gap-1">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[13px] font-semibold leading-tight">
                {format(new Date(event.starts_at), "d MMM yyyy", { locale: ru })}
              </p>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {format(new Date(event.starts_at), "HH:mm", { locale: ru })}
            </p>
            {event.location && (
              <div className="mt-2.5">
                <div className="flex items-center justify-end gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[13px] font-semibold leading-tight max-w-[120px] truncate">{event.location}</p>
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">Площадка</p>
              </div>
            )}
            {(event.organizer_name || event.organizer_phone) && (
              <div className="mt-2.5">
                <div className="flex items-center justify-end gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[13px] font-semibold leading-tight max-w-[130px] truncate">
                    {event.organizer_name ?? event.organizer_phone}
                  </p>
                </div>
                {event.organizer_name && event.organizer_phone && (
                  <p className="text-[12px] text-muted-foreground mt-0.5 text-right">{event.organizer_phone}</p>
                )}
                {!event.organizer_phone && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">Организатор</p>
                )}
              </div>
            )}
          </div>
        </div>
      </MagneticCard>


      {inviteStatus === "invited" && invitedAssignmentId && (
        <InviteResponseCard
          assignmentId={invitedAssignmentId}
          onConfirm={() => setInviteStatus("confirmed")}
          onDecline={() => setInviteStatus("declined")}
        />
      )}

      {(role === "waiter" || role === "cook") && (
        <ShiftCheckinCard
          eventId={event.id}
          initialEntry={timeEntry}
          hasConfirmedAssignment={hasConfirmedAssignment}
        />
      )}

      <Tabs defaultValue={isManager ? "recruiting" : "discussion"}>
        <TabsList className="w-full h-auto gap-1 bg-transparent p-0 grid grid-cols-2 md:flex md:flex-nowrap md:overflow-x-auto">
          {[
            ...(isManager ? [
              { value: "recruiting", icon: <Users className="h-4 w-4" />, label: "Набор", done: isRecruitingDone },
              { value: "requisition", icon: <Package className="h-4 w-4" />, label: "Сбор", done: isRequisitionDone },
            ] : []),
            ...(canSeeMenu ? [{ value: "menu", icon: <ChefHat className="h-4 w-4" />, label: "Меню", done: isMenuDone }] : []),
            { value: "discussion", icon: <MessageSquare className="h-4 w-4" />, label: "Обсуждение", badge: comments.length, done: false },
          ...(isManager ? [{ value: "shift", icon: <Clock className="h-4 w-4" />, label: "Смена", done: false }] : []),
          ].map(({ value, icon, label, badge, done }) => (
            <TabsTrigger key={value} value={value}
              className="min-w-0 md:flex-1 gap-1.5 rounded-2xl text-[13px] px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-card data-[state=inactive]:border data-[state=inactive]:border-border"
            >
              {icon}{label}
              {isManager && done && (
                <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15 }}>
                  <Check className="absolute" style={{ width: 15, height: 15, color: "#000", strokeWidth: 4 }} />
                  <Check className="absolute" style={{ width: 15, height: 15, color: "hsl(var(--ok))", strokeWidth: 2.5 }} />
                </span>
              )}
              {badge != null && badge > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">{badge}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Staffing summary */}
        {isManager && totalNeeded > 0 && (
          <div className="rounded-3xl p-4 mq-hair flex items-center gap-4 mt-3" style={{ background: "hsl(var(--card))" }}>
            <Ring value={pct} size={64} stroke={6} color={pct >= 1 ? "hsl(var(--ok))" : undefined}>
              <span className="font-display font-extrabold text-[15px] leading-none flex items-baseline gap-[1px]">
                {Math.round(pct * 100)}<span className="text-[9px]">%</span>
              </span>
            </Ring>
            <div className="flex-1 min-w-0">
              <p className="text-[15px]">
                <span className="font-display font-extrabold text-[18px]">{totalConfirmed}</span>
                <span className="text-muted-foreground"> из {totalNeeded} подтвердили</span>
              </p>
              <div className="mt-2">
                <StaffBar value={pct} />
              </div>
            </div>
          </div>
        )}

        {/* ===== НАБОР ===== */}
        <TabsContent value="recruiting" className="space-y-4 mt-4">
          {isManager && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="rounded-xl justify-center" onClick={() => inviteAction("core")} disabled={isPending}>
                <Bell className="h-4 w-4 mr-1.5 flex-shrink-0" />Позвать костяк
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl justify-center" onClick={() => inviteAction("pool")} disabled={isPending}>
                <BellRing className="h-4 w-4 mr-1.5 flex-shrink-0" />Открыть пул
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl justify-center" onClick={() => inviteAction("remind")} disabled={isPending}>
                <span style={{ filter: "grayscale(1)", marginRight: 6, fontSize: "1rem", flexShrink: 0 }}>🤫</span>Напомнить
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl justify-center" onClick={exportPdf}>
                <FileDown className="h-4 w-4 mr-1.5 flex-shrink-0" />PDF
              </Button>
            </div>
          )}

          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
            {positions.map((pos) => {
              const confirmed = pos.assignments.filter((a) => a.status === "confirmed").length;
              const invited = pos.assignments.filter((a) => a.status === "invited").length;
              const isStaffed = confirmed >= pos.needed_count;
              const displayed = isStaffed
                ? pos.assignments.filter((a) => a.status === "confirmed" || a.status === "waitlisted")
                : pos.assignments;
              const posPct = pos.needed_count ? confirmed / pos.needed_count : 0;

              return (
                <motion.div key={pos.id} variants={fadeUp}
                  className="rounded-3xl mq-hair p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-[15px]">{ROLE_LABELS[pos.role] ?? pos.role}</p>
                      {pos.reserved_for_core > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pos.reserved_for_core} слота — костяк
                          {pos.priority_deadline && ` до ${format(new Date(pos.priority_deadline), "d MMM HH:mm", { locale: ru })}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-[14px] tabular-nums"
                        style={{ color: posPct >= 1 ? "hsl(var(--ok))" : "hsl(var(--primary))" }}>
                        {confirmed}/{pos.needed_count}
                      </span>
                      {invited > 0 && <span className="text-muted-foreground text-xs">({invited} ждут)</span>}
                      {isManager && (
                        <button onClick={() => setInvitePosition({ id: pos.id, role: pos.role, event_id: event.id })}
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5 min-h-0 min-w-0 h-auto w-auto"
                          aria-label="Добавить сотрудника">
                          <UserPlus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <StaffBar value={posPct} />

                  {displayed.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {displayed.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          {a.status === "confirmed"
                            ? <UserCheck className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--ok))" }} />
                            : a.status === "declined"
                            ? <UserX className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--bad))" }} />
                            : <User className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className="flex-1 truncate">{a.employee.full_name}</span>
                          {a.is_priority && <span className="text-xs" style={{ color: "hsl(var(--primary))" }}>★</span>}
                          <Badge variant={STATUS_BADGE[a.status]} className="text-xs shrink-0">
                            {STATUS_LABELS[a.status]}
                          </Badge>
                          {isManager && a.status === "confirmed" && (
                            <button
                              onClick={() => toggleWarehouse(pos.id, a.id, a.goes_to_warehouse)}
                              className="shrink-0 p-0.5 min-h-0 min-w-0 h-auto w-auto transition-colors"
                              style={{ color: a.goes_to_warehouse ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                              aria-label="Склад"
                              title={a.goes_to_warehouse ? "Едет на склад" : "Едет прямо на площадку"}
                            >
                              <Warehouse className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isManager && (
                            <button onClick={() => removeAssignment(a.id)} disabled={removingId === a.id}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5 min-h-0 min-w-0 h-auto w-auto"
                              aria-label="Удалить">
                              {removingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* ===== СБОР ===== */}
        <TabsContent value="requisition" className="space-y-3 mt-4">
          {!requisition ? (
            <div className="rounded-3xl mq-hair p-8 text-center text-muted-foreground space-y-3" style={{ background: "hsl(var(--card))" }}>
              <Package className="h-8 w-8 mx-auto opacity-40" />
              <p className="font-medium">Заявка ещё не создана</p>
              {isManager && (
                <Button onClick={createRequisition} disabled={creatingReq} size="sm" className="gap-2 rounded-xl">
                  {creatingReq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Создать заявку
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl mq-hair p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Заявка на сбор</span>
                  <Badge variant={
                    requisition.status === "done" ? "success" : requisition.status === "picking" ? "info"
                    : requisition.status === "sent" ? "warning" : "secondary"
                  }>
                    {requisition.status === "draft" ? "Черновик" : requisition.status === "sent" ? "Отправлена"
                     : requisition.status === "picking" ? "Сборка" : "Собрана"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl">
                  <Link href={`/requisitions/${requisition.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />Открыть
                  </Link>
                </Button>
              </div>
              {requisition.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Позиций пока нет</p>
              ) : (
                <ul className="space-y-1.5">
                  {requisition.items.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        item.is_picked ? "bg-primary border-primary text-primary-foreground" : "border-muted"
                      }`}>
                        {item.is_picked && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className={`flex-1 ${item.is_picked ? "line-through text-muted-foreground" : ""}`}>{item.name}</span>
                      <span className="text-muted-foreground">{String(item.quantity)} {item.unit}</span>
                    </li>
                  ))}
                  {requisition.items.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-6">+ ещё {requisition.items.length - 5} позиций</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===== МЕНЮ ===== */}
        {canSeeMenu && (
          <TabsContent value="menu" className="mt-4">
            <EventMenuTab eventId={event.id} canEdit={canEditMenu} />
          </TabsContent>
        )}

        {/* ===== ОБСУЖДЕНИЕ ===== */}
        <TabsContent value="discussion" className="space-y-3 mt-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {comments.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-10">Комментариев пока нет</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className={`flex gap-3 ${c.author.id === currentUserId ? "flex-row-reverse" : ""}`}>
                <div className="h-9 w-9 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-xs font-bold font-display">
                  {c.author.full_name.charAt(0)}
                </div>
                <div className={`max-w-[75%] space-y-1 ${c.author.id === currentUserId ? "items-end flex flex-col" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{c.author.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(c.created_at), "d MMM, HH:mm", { locale: ru })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                      c.author.id === currentUserId ? "bg-primary text-primary-foreground" : "mq-hair"
                    }`}
                    style={c.author.id !== currentUserId ? { background: "hsl(var(--card))" } : {}}
                  >
                    {c.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendComment} className="flex gap-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий..."
              rows={2}
              className="flex-1 resize-none rounded-2xl mq-hair px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendComment(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button type="submit" size="sm" className="rounded-2xl self-end" disabled={sendingComment || !commentText.trim()}>
              {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "→"}
            </Button>
          </form>
        </TabsContent>

        {isManager && (
          <TabsContent value="shift" className="mt-4">
            <ActiveShiftTab eventId={event.id} />
          </TabsContent>
        )}
      </Tabs>

      <AddEmployeeDialog
        position={invitePosition}
        onClose={() => setInvitePosition(null)}
        onAdded={(params) => {
          if (invitePosition) {
            setPositions((prev) => prev.map((p) => {
              if (p.id !== invitePosition.id) return p;
              return {
                ...p,
                assignments: [...p.assignments, {
                  id: params.assignmentId, status: "confirmed" as const,
                  is_priority: false, goes_to_warehouse: false, invited_at: new Date().toISOString(), responded_at: new Date().toISOString(),
                  employee: { id: params.employeeId, full_name: params.employeeName, phone: "", role: invitePosition.role, tier: params.employeeTier },
                }],
              };
            }));
          }
          setInvitePosition(null);
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}

function InviteResponseCard({ assignmentId, onConfirm, onDecline }: {
  assignmentId: string;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function respond(action: "confirm" | "decline") {
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast({ title: action === "confirm" ? "Смена принята" : "Смена отклонена", variant: "success" });
        action === "confirm" ? onConfirm() : onDecline();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: (data as { error?: string }).error ?? "Ошибка", variant: "destructive" });
      }
    } catch {
      toast({ title: "Нет соединения", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl p-4 mq-hair space-y-3" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--warn))" }}>
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--warn))" }} />
        <p className="text-[14px] font-semibold">Вас приглашают на эту смену</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 rounded-xl gap-1.5" onClick={() => respond("confirm")} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Принять
        </Button>
        <Button size="sm" variant="outline" className="flex-1 rounded-xl gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => respond("decline")} disabled={loading}>
          <X className="h-4 w-4" />
          Отказаться
        </Button>
      </div>
    </div>
  );
}

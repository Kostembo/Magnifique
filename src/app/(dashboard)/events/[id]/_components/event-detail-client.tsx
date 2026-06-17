"use client";

import { useState, useRef, useTransition } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffingBar } from "@/components/events/staffing-bar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Pencil, Users, Package, MessageSquare,
  User, Clock, MapPin, UserCheck, UserX, Loader2,
  Bell, BellRing, Plus, ExternalLink, Check, X, FileDown, Trash2,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AssignmentStatus = "invited" | "confirmed" | "declined" | "expired";

type Assignment = {
  id: string;
  status: AssignmentStatus;
  is_priority: boolean;
  invited_at: Date | string;
  responded_at?: Date | string | null;
  employee: { id: string; full_name: string; phone: string; role: string; tier: string };
};

type Position = {
  id: number;
  role: string;
  needed_count: number;
  reserved_for_core: number;
  priority_deadline?: Date | string | null;
  assignments: Assignment[];
};

type Comment = {
  id: string;
  body: string;
  created_at: Date | string;
  author: { id: string; full_name: string; role: string };
};

type RequisitionItem = { id: number; name: string; quantity: unknown; unit: string; is_picked: boolean };

type Requisition = {
  id: string;
  status: string;
  items: RequisitionItem[];
};

type EventDetail = {
  id: string;
  title: string;
  client?: string | null;
  location?: string | null;
  starts_at: Date | string;
  status: string;
  positions: Position[];
  requisitions: Requisition[] | null[];
  comments: Comment[];
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  invited: "Ожидает",
  confirmed: "Подтвердил",
  declined: "Отказался",
  expired: "Истекло",
};

const STATUS_BADGE: Record<AssignmentStatus, "warning" | "success" | "danger" | "secondary"> = {
  invited: "warning",
  confirmed: "success",
  declined: "danger",
  expired: "secondary",
};

interface Props {
  event: EventDetail;
  isManager: boolean;
  currentUserId: string;
}

export function EventDetailClient({ event, isManager, currentUserId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(event.comments);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [requisition, setRequisition] = useState<Requisition | null>(
    event.requisitions?.[0] ?? null
  );
  const [creatingReq, setCreatingReq] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [positions, setPositions] = useState(event.positions);

  const totalConfirmed = positions.reduce(
    (s, p) => s + p.assignments.filter((a) => a.status === "confirmed").length, 0
  );
  const totalNeeded = positions.reduce((s, p) => s + p.needed_count, 0);

  async function inviteAction(mode: "core" | "pool" | "remind", positionId?: number) {
    const res = await fetch(`/api/events/${event.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...(positionId ? { position_id: positionId } : {}) }),
    });
    const data = await res.json();
    if (res.ok) {
      const n = data.invited ?? data.reminded ?? 0;
      toast({
        title: mode === "remind" ? `Напоминание отправлено ${n} чел.` : `Приглашено ${n} чел.`,
        variant: "success",
      });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  async function removeAssignment(assignmentId: string) {
    setRemovingId(assignmentId);
    const res = await fetch(`/api/events/${event.id}/assignments/${assignmentId}`, { method: "DELETE" });
    setRemovingId(null);
    if (res.ok) {
      setPositions((prev) =>
        prev.map((p) => ({
          ...p,
          assignments: p.assignments.filter((a) => a.id !== assignmentId),
        }))
      );
      toast({ title: "Сотрудник удалён из мероприятия", variant: "success" });
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  }

  async function createRequisition() {
    setCreatingReq(true);
    const res = await fetch(`/api/events/${event.id}/requisitions`, { method: "POST" });
    setCreatingReq(false);
    if (res.ok) {
      const data = await res.json();
      setRequisition(data);
      toast({ title: "Заявка создана", variant: "success" });
    } else {
      toast({ title: "Ошибка создания заявки", variant: "destructive" });
    }
  }

  async function deleteEvent() {
    setDeleting(true);
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/events");
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
      setConfirmDelete(false);
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    const res = await fetch(`/api/events/${event.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText.trim() }),
    });
    setSendingComment(false);
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } else {
      toast({ title: "Ошибка отправки", variant: "destructive" });
    }
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const ROLE_LABELS_LOCAL: Record<string, string> = {
      waiter: "Официант", cook: "Повар", warehouse: "Склад", manager: "Менеджер",
    };
    const TIER_LABELS_LOCAL: Record<string, string> = {
      core: "Костяк", regular: "Основной", trainee: "Стажёр",
    };

    // Load Arial from /public/fonts — supports Cyrillic
    const fontBuffer = await fetch("/fonts/Arial.ttf").then((r) => r.arrayBuffer());
    const bytes = new Uint8Array(fontBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    const fontBase64 = btoa(binary);

    const doc = new jsPDF();
    doc.addFileToVFS("Arial.ttf", fontBase64);
    doc.addFont("Arial.ttf", "Arial", "normal");
    doc.setFont("Arial");

    const dateStr = format(new Date(event.starts_at), "d MMMM yyyy, HH:mm", { locale: ru });
    doc.setFontSize(16);
    doc.text(event.title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(dateStr, 14, 26);
    doc.setTextColor(0);

    const confirmed = positions.flatMap((p) =>
      p.assignments.filter((a) => a.status === "confirmed").map((a) => [
        a.employee.full_name,
        a.employee.phone,
        ROLE_LABELS_LOCAL[a.employee.role] ?? a.employee.role,
        TIER_LABELS_LOCAL[a.employee.tier] ?? a.employee.tier,
      ])
    );

    autoTable(doc, {
      startY: 32,
      head: [["ФИО", "Телефон", "Должность", "Уровень"]],
      body: confirmed.length ? confirmed : [["Нет подтверждённых сотрудников", "", "", ""]],
      styles: { font: "Arial", fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42], textColor: [244, 244, 245] },
    });

    const safeName = event.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_");
    doc.save(`staff_${safeName}.pdf`);
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/events"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{event.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(event.starts_at), "d MMMM yyyy, HH:mm", { locale: ru })}
            </span>
            {event.client && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {event.client}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
        {isManager && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Изменить
              </Link>
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteEvent}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить?"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Нет
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Общая полоса заполнения */}
      {totalNeeded > 0 && (
        <StaffingBar confirmed={totalConfirmed} needed={totalNeeded} />
      )}

      <Tabs defaultValue="recruiting">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="recruiting" className="flex-1 sm:flex-none gap-1.5">
            <Users className="h-4 w-4" />
            Набор
          </TabsTrigger>
          <TabsTrigger value="requisition" className="flex-1 sm:flex-none gap-1.5">
            <Package className="h-4 w-4" />
            Сбор
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex-1 sm:flex-none gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Обсуждение
            {comments.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">{comments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== НАБОР ===== */}
        <TabsContent value="recruiting" className="space-y-4">
          {isManager && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => inviteAction("core")} disabled={isPending}>
                <Bell className="h-4 w-4 mr-1.5" />
                Позвать костяк
              </Button>
              <Button variant="outline" size="sm" onClick={() => inviteAction("pool")} disabled={isPending}>
                <BellRing className="h-4 w-4 mr-1.5" />
                Открыть пул
              </Button>
              <Button variant="outline" size="sm" onClick={() => inviteAction("remind")} disabled={isPending}>
                <span style={{ filter: "grayscale(1)", marginRight: 6, fontSize: "1rem" }}>🤫</span>
                Напомнить молчунам
              </Button>
              <Button variant="outline" size="sm" onClick={exportPdf}>
                <FileDown className="h-4 w-4 mr-1.5" />
                Экспорт PDF
              </Button>
            </div>
          )}

          {positions.map((pos) => {
            const confirmed = pos.assignments.filter((a) => a.status === "confirmed").length;
            const invited = pos.assignments.filter((a) => a.status === "invited").length;

            return (
              <div key={pos.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{ROLE_LABELS[pos.role] ?? pos.role}</p>
                    {pos.reserved_for_core > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {pos.reserved_for_core} слота — для костяка
                        {pos.priority_deadline && ` до ${format(new Date(pos.priority_deadline), "d MMM HH:mm", { locale: ru })}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-green-700 font-medium">{confirmed}</span>
                    <span className="text-muted-foreground">/{pos.needed_count}</span>
                    {invited > 0 && <span className="text-muted-foreground text-xs ml-1">({invited} ждут)</span>}
                  </div>
                </div>

                <StaffingBar confirmed={confirmed} needed={pos.needed_count} />

                {pos.assignments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {pos.assignments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        {a.status === "confirmed" ? (
                          <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                        ) : a.status === "declined" ? (
                          <UserX className="h-4 w-4 text-red-500 shrink-0" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 truncate">{a.employee.full_name}</span>
                        {a.is_priority && (
                          <span className="text-xs text-amber-600">★</span>
                        )}
                        <Badge variant={STATUS_BADGE[a.status]} className="text-xs shrink-0">
                          {STATUS_LABELS[a.status]}
                        </Badge>
                        {isManager && (
                          <button
                            onClick={() => removeAssignment(a.id)}
                            disabled={removingId === a.id}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                            aria-label="Удалить"
                          >
                            {removingId === a.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <X className="h-3.5 w-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ===== СБОР ===== */}
        <TabsContent value="requisition" className="space-y-3">
          {!requisition ? (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground space-y-3">
              <Package className="h-8 w-8 mx-auto opacity-40" />
              <p className="font-medium">Заявка ещё не создана</p>
              {isManager && (
                <Button onClick={createRequisition} disabled={creatingReq} size="sm" className="gap-2">
                  {creatingReq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Создать заявку
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Заявка на сбор</span>
                  <Badge variant={
                    requisition.status === "done" ? "success" :
                    requisition.status === "picking" ? "info" :
                    requisition.status === "sent" ? "warning" : "secondary"
                  }>
                    {requisition.status === "draft" ? "Черновик" :
                     requisition.status === "sent" ? "Отправлена" :
                     requisition.status === "picking" ? "Сборка" : "Собрана"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/requisitions/${requisition.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Открыть
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
                      <span className={`flex-1 ${item.is_picked ? "line-through text-muted-foreground" : ""}`}>
                        {item.name}
                      </span>
                      <span className="text-muted-foreground">{String(item.quantity)} {item.unit}</span>
                    </li>
                  ))}
                  {requisition.items.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      + ещё {requisition.items.length - 5} позиций
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===== ОБСУЖДЕНИЕ ===== */}
        <TabsContent value="discussion" className="space-y-3">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {comments.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">
                Комментариев пока нет
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className={`flex gap-3 ${c.author.id === currentUserId ? "flex-row-reverse" : ""}`}>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
                  {c.author.full_name.charAt(0)}
                </div>
                <div className={`max-w-[75%] space-y-0.5 ${c.author.id === currentUserId ? "items-end flex flex-col" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{c.author.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(c.created_at), "d MMM, HH:mm", { locale: ru })}
                    </span>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    c.author.id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {c.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendComment} className="flex gap-2 pt-2 border-t">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий..."
              rows={2}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendComment(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button type="submit" size="sm" disabled={sendingComment || !commentText.trim()}>
              {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "→"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

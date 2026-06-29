"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, UserPlus, CheckCircle2, User, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS, TIER_LABELS } from "@/lib/utils";
import type { CSSProperties } from "react";

type Candidate = {
  id: string;
  full_name: string;
  tier: string;
  photo_url: string | null;
};

interface Position {
  id: number;
  role: string;
  event_id: string;
}

interface Props {
  position: Position | null;
  onClose: () => void;
  onAdded: (params: { assignmentId: string; employeeId: string; employeeName: string; employeeTier: string }) => void;
}

const TIER_CHIP: Record<string, CSSProperties> = {
  core:    { background: "hsl(270 50% 18%)", color: "hsl(270 65% 72%)" },
  regular: { background: "hsl(30 50% 16%)",  color: "hsl(30 70% 62%)" },
  trainee: { background: "hsl(143 55% 18%)", color: "hsl(143 60% 68%)" },
};

const PAGE_SIZE = 5;

export function AddEmployeeDialog({ position, onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [inviting, setInviting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!position) return;
    setLoading(true);
    setCandidates([]);
    setDone(new Set());
    setSearch("");
    setPage(0);
    fetch(`/api/events/${position.event_id}/positions/${position.id}/candidates`)
      .then((r) => r.json())
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [position]);

  const filtered = useMemo(() =>
    candidates.filter((c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase())
    ),
    [candidates, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  async function invite(candidate: Candidate) {
    if (!position) return;
    setInviting(candidate.id);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: candidate.id,
          event_id: position.event_id,
          position_id: position.id,
          direct: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDone((prev) => new Set([...prev, candidate.id]));
        onAdded({ assignmentId: data.id, employeeId: candidate.id, employeeName: candidate.full_name, employeeTier: candidate.tier });
        toast({ title: `${candidate.full_name} добавлен`, variant: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: (data as { error?: string }).error ?? "Ошибка сервера", variant: "destructive" });
      }
    } finally {
      setInviting(null);
    }
  }

  return (
    <Dialog open={!!position} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm !flex flex-col gap-0 p-0 [&>button]:top-2 [&>button]:right-2 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:w-9 [&>button]:h-9 [&>button]:rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-3 pr-12 shrink-0">
          <DialogTitle>
            Добавить сотрудника
            {position && (
              <span className="font-normal text-muted-foreground ml-1.5 text-sm">
                · {ROLE_LABELS[position.role] ?? position.role}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Список */}
        <div className="px-5 shrink-0" style={{ minHeight: `${PAGE_SIZE * 52}px` }}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Нет сотрудников
            </p>
          )}
          {!loading && paged.map((c) => {
            const isDone = done.has(c.id);
            const isLoading = inviting === c.id;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" />
                    : <User className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{c.full_name}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium shrink-0"
                  style={TIER_CHIP[c.tier] ?? TIER_CHIP.regular}>
                  {TIER_LABELS[c.tier] ?? c.tier}
                </span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <button
                    onClick={() => invite(c)}
                    disabled={isLoading}
                    className="text-primary hover:text-primary/70 disabled:opacity-40 shrink-0 transition-colors"
                    aria-label="Добавить"
                  >
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <UserPlus className="h-4 w-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Пагинация */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
              aria-label="Следующая страница"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Итог */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 pb-4 shrink-0">
            <p className="text-[11px] text-muted-foreground text-center">
              {filtered.length} {filtered.length === 1 ? "сотрудник" : filtered.length < 5 ? "сотрудника" : "сотрудников"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

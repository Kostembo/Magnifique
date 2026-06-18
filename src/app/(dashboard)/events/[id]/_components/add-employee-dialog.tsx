"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, UserPlus, CheckCircle2, User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS, TIER_LABELS } from "@/lib/utils";

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

const TIER_BADGE: Record<string, "success" | "info" | "warning"> = {
  core: "success", regular: "info", trainee: "warning",
};

export function AddEmployeeDialog({ position, onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!position) return;
    setLoading(true);
    setCandidates([]);
    setDone(new Set());
    setSearch("");
    fetch(`/api/events/${position.event_id}/positions/${position.id}/candidates`)
      .then((r) => r.json())
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [position]);

  const filtered = candidates.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

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
        toast({ title: `${candidate.full_name} добавлен в пул`, variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: data.error ?? "Ошибка", variant: "destructive" });
      }
    } finally {
      setInviting(null);
    }
  }

  return (
    <Dialog open={!!position} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
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

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Нет доступных сотрудников
            </p>
          )}
          {filtered.map((c) => {
            const isDone = done.has(c.id);
            const isLoading = inviting === c.id;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" />
                    : <User className="h-4 w-4 text-zinc-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.full_name}</p>
                </div>
                <Badge variant={TIER_BADGE[c.tier] ?? "outline"} className="text-xs shrink-0">
                  {TIER_LABELS[c.tier] ?? c.tier}
                </Badge>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <button
                    onClick={() => invite(c)}
                    disabled={isLoading}
                    className="text-[hsl(38,62%,48%)] hover:text-[hsl(38,62%,38%)] disabled:opacity-40 shrink-0 transition-colors"
                    aria-label="Пригласить"
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
      </DialogContent>
    </Dialog>
  );
}

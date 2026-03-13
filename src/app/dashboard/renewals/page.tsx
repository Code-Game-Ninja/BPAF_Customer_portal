"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CalendarClock, CheckCircle2, AlertTriangle, Phone } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Renewal {
  id: string;
  policy_id: string;
  policy_number?: string;
  status: string; // due | contacted | renewed | lost
  due_date: string;
  renewed_date?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string; border: string; label: string }
> = {
  due: {
    icon: AlertTriangle,
    bg: "bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    label: "Due",
  },
  contacted: {
    icon: Phone,
    bg: "bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
    label: "Contacted",
  },
  renewed: {
    icon: CheckCircle2,
    bg: "bg-green-500/20",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-500/30",
    label: "Renewed",
  },
  lost: {
    icon: AlertTriangle,
    bg: "bg-red-500/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/30",
    label: "Lost",
  },
};

function toDate(v: string | undefined): Date | null {
  if (!v) return null;
  return new Date(v);
}

export default function RenewalsPage() {
  const { customer } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

  useEffect(() => {
    if (!customer?.customer_id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("renewals")
          .select("*")
          .eq("customer_id", customer.customer_id)
          .order("due_date", { ascending: true });
        if (error) throw error;
        setRenewals((data ?? []) as unknown as Renewal[]);
      } catch (err) {
        console.error("Failed to load renewals:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  const upcoming = renewals.filter(
    (r) => r.status === "due" || r.status === "contacted"
  );
  const completed = renewals.filter(
    (r) => r.status === "renewed" || r.status === "lost"
  );
  const display = tab === "upcoming" ? upcoming : completed;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-mono text-foreground tracking-tight">Renewals</h1>
        <p className="text-sm text-muted-foreground">
          Track policy renewal dates
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
        <button
          onClick={() => setTab("upcoming")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === "upcoming" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            }`}
        >
          Upcoming
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{upcoming.length}</span>
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === "completed" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            }`}
        >
          Completed
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{completed.length}</span>
        </button>
      </div>

      {/* Renewals List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 w-full rounded-md skeleton" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-12 flex flex-col items-center text-center shadow-sm">
          <CalendarClock className="h-12 w-12 text-muted mb-4" />
          <p className="text-lg font-medium text-foreground">
            {tab === "upcoming" ? "You're all caught up!" : "No completed renewals yet."}
          </p>
          <p className="text-sm text-muted-foreground">
            {tab === "upcoming"
              ? "No upcoming renewals at this time."
              : "Completed renewals will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {display.map((r) => {
            const dueDate = toDate(r.due_date);
            const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.due;
            const Icon = config.icon;
            const daysLeft = dueDate
              ? differenceInDays(dueDate, new Date())
              : null;

            return (
              <div
                key={r.id}
                className="rounded-md border border-border bg-card p-5 flex flex-col gap-4 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-lg font-bold">
                      {r.policy_number || r.policy_id}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="w-4 h-4" />
                      Due: {dueDate ? format(dueDate, "dd MMM yyyy") : "—"}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${config.bg} ${config.text} ${config.border}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </span>
                </div>

                {daysLeft !== null && r.status !== "renewed" && (
                  <div>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${daysLeft < 0
                          ? "bg-destructive/10 text-destructive"
                          : daysLeft <= 7
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {daysLeft < 0
                        ? `${Math.abs(daysLeft)} Days Overdue`
                        : daysLeft === 0
                          ? "Due Today"
                          : `${daysLeft} Days Left`}
                    </span>
                  </div>
                )}

                {r.notes && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border-l-2 border-primary">
                    <p className="italic">{r.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

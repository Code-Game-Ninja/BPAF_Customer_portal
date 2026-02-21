"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CalendarClock, CheckCircle2, AlertTriangle, Phone } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Renewal {
  id: string;
  policy_id: string;
  policy_number?: string;
  status: string; // due | contacted | renewed | lost
  due_date: Timestamp | string;
  renewed_date?: Timestamp | string;
  notes?: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string; border: string; label: string }
> = {
  due: {
    icon: AlertTriangle,
    bg: "bg-chart-4/15",
    text: "text-chart-4",
    border: "border-chart-4/30",
    label: "Due",
  },
  contacted: {
    icon: Phone,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: "Contacted",
  },
  renewed: {
    icon: CheckCircle2,
    bg: "bg-accent/15",
    text: "text-accent-foreground",
    border: "border-accent/30",
    label: "Renewed",
  },
  lost: {
    icon: AlertTriangle,
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    label: "Lost",
  },
};

function toDate(v: Timestamp | string | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  return new Date(v as string);
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
        const snap = await getDocs(
          query(
            collection(db, "renewals"),
            where("customer_id", "==", customer.customer_id),
            orderBy("due_date", "asc")
          )
        );
        setRenewals(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as unknown as Renewal)
          )
        );
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Renewals</h1>
        <p className="text-muted-foreground font-medium">
          Track your policy renewal dates and status.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-muted/60 p-1.5 rounded-2xl w-fit border border-border shadow-sm">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "upcoming"
              ? "bg-card text-foreground shadow-md ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          Upcoming
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
            tab === "upcoming" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>{upcoming.length}</span>
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "completed"
              ? "bg-card text-foreground shadow-md ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          Completed
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
            tab === "completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>{completed.length}</span>
        </button>
      </div>

      {/* Renewals List */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-16 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground font-medium">Loading renewals...</p>
        </div>
      ) : display.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-lg">
            {tab === "upcoming"
              ? "You're all caught up!"
              : "No completed renewals yet."}
          </p>
          <p className="text-muted-foreground text-sm">
            {tab === "upcoming"
              ? "No upcoming renewals at this time."
              : "Completed renewals will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-list">
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
                className="bg-card rounded-2xl border border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${config.bg} ${config.border} border`}
                  >
                    <Icon className={`h-6 w-6 ${config.text}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-bold text-foreground tracking-tight">
                      {r.policy_number || r.policy_id}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground flex flex-wrap items-center gap-2">
                      <span>Due: {dueDate ? format(dueDate, "dd MMM yyyy") : "—"}</span>
                      {daysLeft !== null && r.status !== "renewed" && (
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            daysLeft < 0
                              ? "bg-destructive/10 text-destructive"
                              : daysLeft <= 7
                              ? "bg-chart-4/15 text-chart-4"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days overdue`
                            : daysLeft === 0
                            ? "Due today"
                            : `${daysLeft} days left`}
                        </span>
                      )}
                    </p>
                    {r.notes && (
                      <p className="text-xs text-muted-foreground italic">{r.notes}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`self-start sm:self-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${config.bg} ${config.text} ${config.border} tracking-wide`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

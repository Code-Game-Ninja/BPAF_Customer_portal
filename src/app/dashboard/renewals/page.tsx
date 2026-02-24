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
    bg: "bg-chart-4",
    text: "text-foreground",
    border: "border-foreground",
    label: "Due",
  },
  contacted: {
    icon: Phone,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border-strong",
    label: "Contacted",
  },
  renewed: {
    icon: CheckCircle2,
    bg: "bg-[#10b981]",
    text: "text-white",
    border: "border-foreground",
    label: "Renewed",
  },
  lost: {
    icon: AlertTriangle,
    bg: "bg-destructive",
    text: "text-destructive-foreground",
    border: "border-foreground",
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
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-[0.9]">
          Renewals
        </h1>
        <p className="text-muted-foreground font-bold text-sm sm:text-base uppercase tracking-widest max-w-2xl mt-2 border-l-4 border-primary pl-4">
          TRACK POLICY RENEWAL DATES
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/30 p-2 border-4 border-foreground shadow-[4px_4px_0_var(--foreground)] w-fit relative z-10">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-black uppercase tracking-widest transition-all duration-200 border-2 ${tab === "upcoming"
              ? "bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0_var(--foreground)] translate-y-[-2px] translate-x-[-2px]"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card hover:border-border-strong"
            }`}
        >
          Upcoming
          <span className={`ml-3 px-2 py-0.5 text-xs font-black border-2 ${tab === "upcoming" ? "bg-background text-foreground border-foreground shadow-[2px_2px_0_var(--foreground)]" : "bg-muted text-muted-foreground border-transparent"
            }`}>{upcoming.length}</span>
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-black uppercase tracking-widest transition-all duration-200 border-2 ${tab === "completed"
              ? "bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0_var(--foreground)] translate-y-[-2px] translate-x-[-2px]"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card hover:border-border-strong"
            }`}
        >
          Completed
          <span className={`ml-3 px-2 py-0.5 text-xs font-black border-2 ${tab === "completed" ? "bg-background text-foreground border-foreground shadow-[2px_2px_0_var(--foreground)]" : "bg-muted text-muted-foreground border-transparent"
            }`}>{completed.length}</span>
        </button>
      </div>

      {/* Renewals List */}
      {loading ? (
        <div className="bg-card border-4 border-foreground p-16 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_var(--foreground)]">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-foreground border-l-transparent rounded-full animate-spin" />
          <p className="text-foreground font-black uppercase tracking-[0.2em]">Loading renewals...</p>
        </div>
      ) : display.length === 0 ? (
        <div className="bg-striped border-4 border-foreground p-12 sm:p-20 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_var(--foreground)] relative overflow-hidden">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary flex items-center justify-center mb-4 shadow-[8px_8px_0_var(--foreground)] border-4 border-foreground relative z-10 animate-in zoom-in duration-700">
            <CalendarClock className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
          </div>
          <p className="text-foreground font-black text-3xl sm:text-4xl tracking-tighter uppercase relative z-10 text-center bg-card px-4 border-2 border-foreground">
            {tab === "upcoming"
              ? "You're all caught up!"
              : "No completed renewals yet."}
          </p>
          <p className="text-muted-foreground font-bold text-sm sm:text-base tracking-wider uppercase text-center max-w-md relative z-10 bg-card p-4 border-2 border-border-strong">
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
                className="bg-card border-4 border-foreground p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0_var(--foreground)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--ring)] hover:border-ring transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-muted/20 rotate-45 translate-x-16 -translate-y-16 group-hover:bg-primary/5 transition-colors duration-500" />

                <div className="flex items-start sm:items-center gap-4 relative z-10">
                  <div
                    className={`w-14 h-14 flex-shrink-0 flex items-center justify-center border-2 shadow-[2px_2px_0_var(--foreground)] ${config.bg} ${config.border} transition-colors group-hover:border-primary`}
                  >
                    <Icon className={`h-6 w-6 ${config.text}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xl sm:text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors uppercase">
                      {r.policy_number || r.policy_id}
                    </p>
                    <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        DUE: {dueDate ? format(dueDate, "dd MMM yyyy") : "—"}
                      </span>
                      {daysLeft !== null && r.status !== "renewed" && (
                        <>
                          <span className="w-1.5 h-1.5 bg-foreground" />
                          <span
                            className={`px-2 py-0.5 border-2 ${daysLeft < 0
                                ? "bg-destructive text-destructive-foreground border-foreground"
                                : daysLeft <= 7
                                  ? "bg-chart-4 text-foreground border-foreground"
                                  : "bg-muted text-muted-foreground border-border-strong"
                              } shadow-[2px_2px_0_var(--foreground)]`}
                          >
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)} DAYS OVERDUE`
                              : daysLeft === 0
                                ? "DUE TODAY"
                                : `${daysLeft} DAYS LEFT`}
                          </span>
                        </>
                      )}
                    </div>
                    {r.notes && (
                      <p className="text-xs sm:text-sm text-foreground/80 mt-1 font-bold italic border-l-2 border-primary pl-2">{r.notes}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`relative z-10 self-start sm:self-center px-4 py-2 text-[10px] sm:text-xs font-black border-2 shadow-[2px_2px_0_var(--foreground)] ${config.bg} ${config.text} ${config.border} uppercase tracking-[0.2em]`}
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

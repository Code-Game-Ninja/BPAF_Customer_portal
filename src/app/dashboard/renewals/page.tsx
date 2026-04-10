"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AlertTriangle, CalendarClock, CheckCircle2, Phone, XCircle } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface Renewal {
  id: string;
  policy_id: string;
  policy_number?: string;
  status: string;
  due_date: string;
  renewed_date?: string;
  notes?: string;
}

const STATUS_STYLE: Record<
  string,
  {
    icon: React.ElementType;
    tone: string;
    label: string;
  }
> = {
  due: {
    icon: AlertTriangle,
    tone: "border-amber-200 bg-amber-100 text-amber-700",
    label: "Due",
  },
  contacted: {
    icon: Phone,
    tone: "border-sky-200 bg-sky-100 text-sky-700",
    label: "Contacted",
  },
  renewed: {
    icon: CheckCircle2,
    tone: "border-green-200 bg-green-100 text-green-700",
    label: "Renewed",
  },
  lost: {
    icon: XCircle,
    tone: "border-rose-200 bg-rose-100 text-rose-700",
    label: "Lost",
  },
};

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

  const upcoming = renewals.filter((renewal) => renewal.status === "due" || renewal.status === "contacted");
  const completed = renewals.filter((renewal) => renewal.status === "renewed" || renewal.status === "lost");
  const display = tab === "upcoming" ? upcoming : completed;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_14px_32px_rgba(47,62,64,0.06)] backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#798478]">Renewal Center</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f3e40]">Track Upcoming Renewals</h2>
        <p className="mt-2 text-sm text-[#627579]">
          Keep every active policy protected by reviewing due dates and your renewal progress.
        </p>
      </section>

      <section className="inline-flex rounded-2xl border border-[#e6d8c6] bg-white/85 p-1 shadow-[0_10px_22px_rgba(47,62,64,0.05)]">
        <button
          onClick={() => setTab("upcoming")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            tab === "upcoming" ? "bg-[#5d787a] text-white" : "text-[#5f7274] hover:bg-[#f3ece2]"
          }`}
        >
          Upcoming
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "upcoming" ? "bg-white/20" : "bg-[#ecf3f2] text-[#5d787a]"}`}>
            {upcoming.length}
          </span>
        </button>

        <button
          onClick={() => setTab("completed")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            tab === "completed" ? "bg-[#5d787a] text-white" : "text-[#5f7274] hover:bg-[#f3ece2]"
          }`}
        >
          Completed
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "completed" ? "bg-white/20" : "bg-[#ecf3f2] text-[#5d787a]"}`}>
            {completed.length}
          </span>
        </button>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#efe4d7]" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <section className="rounded-[2rem] border border-[#eadfce] bg-white/90 px-6 py-14 text-center shadow-[0_10px_22px_rgba(47,62,64,0.05)]">
          <CalendarClock className="mx-auto h-12 w-12 text-[#91a0a0]" />
          <p className="mt-4 text-lg font-semibold text-[#2f3e40]">
            {tab === "upcoming" ? "No upcoming renewals right now" : "No completed renewals yet"}
          </p>
          <p className="mt-2 text-sm text-[#798478]">
            {tab === "upcoming"
              ? "Your active portfolio currently has no immediate renewal deadlines."
              : "Renewed or lost entries will appear here once updated."}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {display.map((renewal) => {
            const dueDate = renewal.due_date ? new Date(renewal.due_date) : null;
            const config = STATUS_STYLE[renewal.status] || STATUS_STYLE.due;
            const Icon = config.icon;
            const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;

            return (
              <article
                key={renewal.id}
                className="rounded-[1.75rem] border border-[#eadfce] bg-white/90 p-5 shadow-[0_12px_28px_rgba(47,62,64,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#2f3e40] md:text-base">
                      {renewal.policy_number || renewal.policy_id}
                    </p>
                    <p className="mt-1 text-sm text-[#627579]">
                      Due {dueDate ? format(dueDate, "dd MMM yyyy") : "Not Available"}
                    </p>
                  </div>

                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${config.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                {daysLeft !== null && renewal.status !== "renewed" && renewal.status !== "lost" && (
                  <div className="mt-4">
                    <span
                      className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${
                        daysLeft < 0
                          ? "bg-rose-100 text-rose-700"
                          : daysLeft <= 7
                            ? "bg-amber-100 text-amber-700"
                            : "bg-[#ecf3f2] text-[#4d6a6d]"
                      }`}
                    >
                      {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? "Due today" : `${daysLeft} days left`}
                    </span>
                  </div>
                )}

                {renewal.notes && (
                  <p className="mt-4 rounded-xl border border-[#e6d8c6] bg-[#f8f2ea] p-3 text-sm text-[#5f7274]">
                    {renewal.notes}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

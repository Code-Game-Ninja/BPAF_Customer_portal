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
import { FileText, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  start_date: Timestamp | string;
  end_date: Timestamp | string;
  premium_amount: number;
  sum_insured?: number;
  insurer_name?: string;
  payment_frequency?: string;
}

function toDate(v: Timestamp | string | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  return new Date(v as string);
}

export default function PoliciesPage() {
  const { customer } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!customer?.customer_id) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "policies"),
            where("customer_id", "==", customer.customer_id),
            orderBy("createdAt", "desc")
          )
        );
        setPolicies(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as unknown as Policy)
          )
        );
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  const filtered = policies.filter((p) => {
    const matchSearch =
      !search ||
      p.policy_number.toLowerCase().includes(search.toLowerCase()) ||
      p.policy_type.toLowerCase().includes(search.toLowerCase()) ||
      (p.insurer_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-foreground leading-[0.9]">
          My Policies
        </h1>
        <p className="text-muted-foreground font-bold text-sm sm:text-base uppercase tracking-widest max-w-2xl mt-2 border-l-4 border-primary pl-4">
          VIEW AND MANAGE YOUR PORTFOLIO
        </p>
      </div>

      {/* Filters - Brutalist Bars */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
          <input
            type="text"
            placeholder="Search by policy number, type, or insurer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 bg-card border-4 border-foreground text-sm font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-[4px_4px_0_var(--foreground)] placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="relative group min-w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
            aria-label="Filter by status"
            className="w-full pl-12 pr-8 py-3 sm:py-4 bg-muted/30 border-4 border-border-strong text-sm font-black uppercase tracking-wider appearance-none focus:ring-4 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm cursor-pointer hover:bg-card hover:border-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="bg-card border-4 border-foreground p-16 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_var(--foreground)]">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-foreground border-l-transparent rounded-full animate-spin" />
          <p className="text-foreground font-black uppercase tracking-[0.2em]">Loading portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-striped border-4 border-foreground p-12 sm:p-20 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_var(--foreground)] relative overflow-hidden">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary flex items-center justify-center mb-4 shadow-[8px_8px_0_var(--foreground)] border-4 border-foreground relative z-10 animate-in zoom-in duration-700">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
          </div>
          <p className="text-foreground font-black text-3xl sm:text-4xl tracking-tighter uppercase relative z-10 text-center bg-card px-4 border-2 border-foreground">
            {policies.length === 0
              ? "No policies found"
              : "No matches found"}
          </p>
          <p className="text-muted-foreground font-bold text-sm sm:text-base tracking-wider uppercase text-center max-w-md relative z-10 bg-card p-4 border-2 border-border-strong">
            {policies.length === 0
              ? "Your policies will appear here once they are added."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-list">
          {filtered.map((p) => {
            const startDate = toDate(p.start_date);
            const endDate = toDate(p.end_date);
            const isExpanded = expanded === p.id;

            const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
              active: { bg: "bg-[#10b981]", text: "text-white", border: "border-foreground" },
              expired: { bg: "bg-destructive", text: "text-destructive-foreground", border: "border-foreground" },
              cancelled: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border-strong" },
              archived: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border-strong" },
            };
            const colors = statusConfig[p.status] || statusConfig.cancelled;

            return (
              <div
                key={p.id}
                className={`bg-card border-4 transition-all duration-300 overflow-hidden ${isExpanded ? "border-primary shadow-[8px_8px_0_var(--primary)]" : "border-foreground shadow-[4px_4px_0_var(--foreground)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--ring)] hover:border-ring"
                  }`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  className="w-full px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between text-left group gap-4 focus:outline-none focus:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 transition-colors ${isExpanded ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-primary border-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xl sm:text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">
                        {p.policy_number}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                        {p.policy_type}
                        {p.insurer_name && (
                          <>
                            <span className="w-1.5 h-1.5 bg-foreground" />
                            <span className="text-foreground">{p.insurer_name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t-2 border-border sm:border-t-0 p-2 sm:p-0">
                    <span className="text-xl sm:text-2xl font-black text-foreground tracking-tighter">
                      <span className="text-sm">₹</span>{p.premium_amount?.toLocaleString() || "—"}
                    </span>
                    <span
                      className={`ml-4 px-3 py-1 text-[10px] sm:text-xs font-black border-2 ${colors.bg} ${colors.text} ${colors.border} uppercase tracking-[0.2em] shadow-[2px_2px_0_var(--foreground)]`}
                    >
                      {p.status}
                    </span>
                  </div>
                </button>

                {/* Expanded Details - High Contrast Grid */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-4 border-t-4 border-foreground grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-muted/40 animate-in slide-in-from-top-2 fade-in duration-200">
                    <Detail
                      label="Start Date"
                      value={
                        startDate ? format(startDate, "dd MMM yyyy") : "—"
                      }
                    />
                    <Detail
                      label="End Date"
                      value={endDate ? format(endDate, "dd MMM yyyy") : "—"}
                    />
                    <Detail
                      label="Premium"
                      value={`₹${p.premium_amount?.toLocaleString() || "—"}`}
                      highlight
                    />
                    <Detail
                      label="Sum Insured"
                      value={
                        p.sum_insured
                          ? `₹${p.sum_insured.toLocaleString()}`
                          : "—"
                      }
                      highlight
                    />
                    <Detail
                      label="Frequency"
                      value={p.payment_frequency || "—"}
                    />
                    <Detail label="Type" value={p.policy_type} />
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

function Detail({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 p-3 border-2 border-transparent transition-colors ${highlight ? 'bg-background border-border shadow-sm' : ''}`}>
      <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
      <p className={`font-black tracking-tight ${highlight ? 'text-primary text-lg' : 'text-foreground text-base'} uppercase`}>{value}</p>
    </div>
  );
}

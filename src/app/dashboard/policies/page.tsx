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
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">My Policies</h1>
        <p className="text-muted-foreground font-medium">
          View and manage all your insurance policies.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by policy number, type, or insurer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative group min-w-40">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
            aria-label="Filter by status"
            className="w-full pl-10 pr-8 py-2.5 bg-card border border-input rounded-xl text-sm appearance-none focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all shadow-sm cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-16 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground font-medium">Loading policies...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-lg">
            {policies.length === 0
              ? "No policies found"
              : "No policies match your filters"}
          </p>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            {policies.length === 0
              ? "Your policies will appear here once they are added to your account."
              : "Try adjusting your search or filter criteria to find what you're looking for."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-list">
          {filtered.map((p) => {
            const startDate = toDate(p.start_date);
            const endDate = toDate(p.end_date);
            const isExpanded = expanded === p.id;
            
            const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
              active:    { bg: "bg-accent/15",      text: "text-accent-foreground", border: "border-accent/30" },
              expired:   { bg: "bg-destructive/10", text: "text-destructive",       border: "border-destructive/20" },
              cancelled: { bg: "bg-muted",          text: "text-muted-foreground",  border: "border-border" },
              archived:  { bg: "bg-muted",          text: "text-muted-foreground",  border: "border-border" },
            };
            const colors = statusConfig[p.status] || statusConfig.cancelled;

            return (
              <div
                key={p.id}
                className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? "border-primary/50 shadow-md ring-1 ring-primary/10" : "border-border shadow-sm hover:border-primary/30 hover:shadow-lg"
                }`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isExpanded ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-primary group-hover:bg-primary/10"
                    }`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {p.policy_number}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-1.5">
                        {p.policy_type}
                        {p.insurer_name ? <><span className="w-1 h-1 rounded-full bg-border"></span> {p.insurer_name}</> : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-foreground hidden sm:block">
                      ₹{p.premium_amount?.toLocaleString() || "—"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border} capitalize tracking-wide shadow-sm`}
                    >
                      {p.status}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm bg-muted/10 animate-in slide-in-from-top-2 fade-in duration-200">
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
                    />
                    <Detail
                      label="Sum Insured"
                      value={
                        p.sum_insured
                          ? `₹${p.sum_insured.toLocaleString()}`
                          : "—"
                      }
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}

"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  insurer?: string;
}

export default function DashboardPage() {
  const { customer } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

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
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Policy))
        );
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  const activePolicies = policies.filter((p) => p.status === "active");
  const expiringSoon = policies.filter((p) => {
    if (p.status !== "active") return false;
    const daysLeft = Math.ceil(
      (new Date(p.end_date).getTime() - Date.now()) / 86_400_000
    );
    return daysLeft >= 0 && daysLeft <= 30;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Welcome back, {customer?.name?.split(' ')[0] || 'Customer'}
        </h1>
        <p className="text-muted-foreground font-medium">
          Here&apos;s a summary of your insurance portfolio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stat-grid">
        <StatCard
          icon={FileText}
          label="Total Policies"
          value={policies.length}
          color="bg-primary/10 text-primary ring-1 ring-primary/20"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Active"
          value={activePolicies.length}
          color="bg-accent/20 text-accent-foreground ring-1 ring-accent/30"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring Soon"
          value={expiringSoon.length}
          color="bg-chart-4/20 text-chart-4 ring-1 ring-chart-4/30"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Expired / Others"
          value={policies.length - activePolicies.length}
          color="bg-muted text-muted-foreground ring-1 ring-border"
          loading={loading}
        />
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in duration-500">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            Policies Expiring Within 30 Days
          </h3>
          <div className="space-y-3">
            {expiringSoon.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-card rounded-xl p-4 shadow-sm border border-border/50 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    {p.policy_number}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground capitalize">{p.policy_type}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-chart-4 bg-chart-4/10 px-2.5 py-1 rounded-full border border-chart-4/20">
                    Expires {format(new Date(p.end_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Policies */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-semibold text-foreground tracking-tight">Recent Policies</h3>
          <Link
            href="/dashboard/policies"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View all <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm font-medium">Loading policies...</span>
          </div>
        ) : policies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No policies found</p>
            <p className="text-sm text-muted-foreground">Your policies will appear here once added.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {policies.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-all duration-200 group"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {p.policy_number}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-1.5">
                    {p.policy_type} {p.insurer ? <><span className="w-1 h-1 rounded-full bg-border"></span> {p.insurer}</> : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    ₹{p.premium_amount?.toLocaleString() || "—"}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {loading ? "—" : value}
          </p>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    active:    { bg: "bg-accent/15",      text: "text-accent-foreground", border: "border-accent/30" },
    expired:   { bg: "bg-destructive/10", text: "text-destructive",       border: "border-destructive/20" },
    cancelled: { bg: "bg-muted",          text: "text-muted-foreground",  border: "border-border" },
  };
  const c = config[status] || config.cancelled;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border} capitalize tracking-wide shadow-sm`}>
      {status}
    </span>
  );
}

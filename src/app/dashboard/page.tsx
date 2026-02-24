"use client";

import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import useSWR from "swr";

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

const fetchPolicies = async (customerId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "policies"),
      where("customer_id", "==", customerId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Policy));
};

export default function DashboardPage() {
  const { customer, loading: authLoading } = useAuth();

  const { data: policies, error, isLoading: dataLoading } = useSWR(
    customer?.customer_id ? ["policies", customer.customer_id] : null,
    ([, customerId]) => fetchPolicies(customerId as string),
    {
      revalidateOnFocus: true,
    }
  );

  const loading = authLoading || dataLoading;
  const activePolicies = policies?.filter((p) => p.status === "active") || [];
  const expiringSoon = policies?.filter((p) => {
    if (p.status !== "active") return false;
    const daysLeft = Math.ceil(
      (new Date(p.end_date).getTime() - Date.now()) / 86_400_000
    );
    return daysLeft >= 0 && daysLeft <= 30;
  }) || [];

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 sm:gap-4 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.9]">
          Welcome,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-destructive drop-shadow-sm">
            {customer?.name?.split(' ')[0] || 'Customer'}
          </span>
        </h1>
        <p className="text-muted-foreground font-bold text-sm sm:text-base uppercase tracking-widest max-w-2xl mt-2 border-l-4 border-primary pl-4">
          INSURANCE PORTFOLIO OVERVIEW
        </p>
      </div>

      {/* Stats Grid - Brutalist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={ShieldCheck}
          label="Total Policies"
          value={policies?.length || 0}
          colorClass="text-foreground bg-card"
          accentColor="var(--primary)"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Active Protection"
          value={activePolicies.length}
          colorClass="text-foreground bg-card"
          accentColor="#10b981"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring Soon"
          value={expiringSoon.length}
          colorClass="text-foreground bg-card"
          accentColor="#f59e0b"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Expired / Other"
          value={(policies?.length || 0) - activePolicies.length}
          colorClass="text-foreground bg-card"
          accentColor="var(--muted-foreground)"
          loading={loading}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 sm:p-6 bg-destructive text-destructive-foreground border-4 border-foreground shadow-[8px_8px_0_var(--foreground)] flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
          <span className="font-black text-sm sm:text-base uppercase tracking-wider">ERROR: Failed to load your policies. Please try refreshing.</span>
        </div>
      )}

      {/* Expiring Soon Alert - High Contrast Panel */}
      {expiringSoon.length > 0 && (
        <div className="relative overflow-hidden border-4 border-[#f59e0b] bg-[#fef3c7] dark:bg-[#451a03] p-6 sm:p-8 shadow-[8px_8px_0_#f59e0b] animate-in fade-in zoom-in-95 duration-500">
          <h3 className="text-sm sm:text-base font-black flex items-center gap-2 mb-6 uppercase tracking-[0.2em] text-[#b45309] dark:text-[#fcd34d]">
            <span className="w-2 h-2 bg-current rounded-full animate-ping mr-2" />
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            Action Required: Expiring Within 30 Days
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {expiringSoon.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden border-2 border-[#b45309] dark:border-[#fcd34d] bg-white/80 dark:bg-black/80 p-5 sm:p-6 transition-transform duration-300 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_0_#b45309]"
              >
                <div className="flex flex-col gap-1 z-10 focus:outline-none">
                  <p className="font-black text-foreground text-xl sm:text-2xl tracking-tighter">
                    {p.policy_number}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {p.policy_type}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 z-10 w-full sm:w-auto">
                  <div className="w-full text-center sm:text-right text-[10px] sm:text-xs font-black text-white bg-[#ea580c] px-4 py-2 border-2 border-transparent uppercase tracking-widest">
                    Expires {format(new Date(p.end_date), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Policies - Brutalist Container */}
      <div className="border-4 border-foreground bg-card shadow-[8px_8px_0_var(--foreground)]">
        <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-6 border-b-4 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40">
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase">Recent Policies</h3>
          <Link
            href="/dashboard/policies"
            className="w-full sm:w-auto text-center sm:text-left text-xs font-black text-background bg-foreground hover:bg-primary hover:text-primary-foreground px-6 py-3 uppercase tracking-widest transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            View Full Portfolio
          </Link>
        </div>

        {loading ? (
          <div className="p-12 sm:p-20 flex flex-col items-center justify-center text-muted-foreground gap-6">
            <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-foreground border-l-transparent rounded-full animate-spin" />
            <span className="text-sm font-black tracking-[0.2em] uppercase">Loading...</span>
          </div>
        ) : !policies || policies.length === 0 ? (
          <div className="p-12 sm:p-20 text-center flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-striped">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary flex items-center justify-center mb-4 shadow-[8px_8px_0_var(--foreground)] border-4 border-foreground relative z-10 animate-in zoom-in duration-700">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
            </div>
            <h4 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase relative z-10">No Active Policies</h4>
            <p className="text-muted-foreground font-bold text-sm sm:text-base max-w-md mx-auto uppercase tracking-wider relative z-10 bg-card p-4 border-2 border-border-strong">
              You don&apos;t have any insurance policies linked to this account yet. Contact your agent to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y-4 divide-border">
            {policies.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="group px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/50 transition-colors duration-300"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl sm:text-2xl font-black text-foreground tracking-tighter">
                      {p.policy_number}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                    {p.policy_type}
                    {p.insurer && (
                      <>
                        <span className="w-1.5 h-1.5 bg-foreground" />
                        <span className="text-foreground">{p.insurer}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Visual Separator for Mobile */}
                <div className="h-1 w-full bg-border md:hidden my-2" />

                <div className="flex flex-col md:items-end w-full md:w-auto bg-muted md:bg-transparent p-4 md:p-0 border-2 border-border-strong md:border-transparent">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Premium</span>
                  <span className="text-2xl sm:text-3xl font-black text-primary tracking-tighter flex items-baseline gap-1">
                    <span className="text-lg text-foreground">₹</span>{p.premium_amount?.toLocaleString() || "—"}
                  </span>
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
  colorClass,
  accentColor,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
  accentColor: string;
  loading: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden border-4 border-foreground p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 focus-within:ring-4 focus-within:ring-primary ${colorClass}`}
      style={{ boxShadow: `6px 6px 0 ${accentColor}` }}
      tabIndex={0}
    >
      <div className="relative z-10 flex flex-col gap-4">
        <div
          className="w-12 h-12 flex items-center justify-center border-2 border-foreground bg-background"
          style={{ boxShadow: `3px 3px 0 ${accentColor}` }}
        >
          <Icon className="h-6 w-6" style={{ color: accentColor }} />
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <p className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">
            {loading ? <span className="text-muted-foreground/30 animate-pulse">—</span> : value}
          </p>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mt-1 line-clamp-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-[#10b981]", text: "text-white", border: "border-foreground" },
    expired: { bg: "bg-destructive", text: "text-destructive-foreground", border: "border-foreground" },
    cancelled: { bg: "bg-muted", text: "text-muted-foreground", border: "border-foreground" },
  };
  const c = config[status] || config.cancelled;
  return (
    <span className={`px-3 py-1 text-[10px] font-black border-2 ${c.bg} ${c.text} ${c.border} uppercase tracking-[0.2em] shadow-[2px_2px_0_var(--foreground)]`}>
      {status}
    </span>
  );
}

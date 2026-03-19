"use client";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck, ArrowRight, XCircle, User, Phone, Mail } from "lucide-react";
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
  insurer_name?: string;
  assigned_to_name?: string;
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const fetchPolicies = async (customerId: string) => {
  const { data, error } = await supabase
    .from("policies")
    .select(`
      *,
      agent:users!assigned_to (
        id,
        name,
        email,
        phone
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Policy[];
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
  const expiredPolicies = policies?.filter((p) => p.status === "expired") || [];
  const expiringSoon = policies?.filter((p) => {
    if (p.status !== "active") return false;
    const daysLeft = Math.ceil(
      (new Date(p.end_date).getTime() - Date.now()) / 86_400_000
    );
    return daysLeft >= 0 && daysLeft <= 30;
  }) || [];

  // Get unique agents from all policies
  const uniqueAgents = policies?.reduce((acc, p) => {
    if (p.agent && !acc.find((a) => a.id === p.agent?.id)) {
      acc.push(p.agent);
    }
    return acc;
  }, [] as NonNullable<Policy["agent"]>[]) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Welcome, {customer?.name?.split(' ')[0] || 'Customer'}
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your insurance portfolio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShieldCheck}
          label="Total Policies"
          value={policies?.length || 0}
          loading={loading}
          iconColor="text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Protection"
          value={activePolicies.length}
          loading={loading}
          iconColor="text-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring Soon"
          value={expiringSoon.length}
          loading={loading}
          iconColor="text-amber-500"
        />
        <StatCard
          icon={XCircle}
          label="Expired"
          value={expiredPolicies.length}
          loading={loading}
          iconColor="text-red-500"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">ERROR: Failed to load your policies. Please try refreshing.</span>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-6 shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Action Required: Expiring Within 30 Days
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {expiringSoon.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-md border border-amber-500/30 bg-background p-4 shadow-sm"
              >
                <div>
                  <p className="font-mono text-lg font-bold text-foreground">
                    {p.policy_number}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {p.policy_type}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Expires {format(new Date(p.end_date), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Policies Alert */}
      {expiredPolicies.length > 0 && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-6 shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-red-700 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            Expired Policies ({expiredPolicies.length})
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {expiredPolicies.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-md border border-red-500/30 bg-background p-4 shadow-sm"
              >
                <div>
                  <p className="font-mono text-lg font-bold text-foreground">
                    {p.policy_number}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {p.policy_type}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-md bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                    Expired {format(new Date(p.end_date), "MMM dd, yyyy")}
                  </span>
                  {p.agent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact: {p.agent.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 mt-4">
            Contact your agent to renew these policies.
          </p>
        </div>
      )}

      {/* Your Agents Section */}
      {uniqueAgents.length > 0 && (
        <div className="rounded-md border border-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
            <User className="h-5 w-5 text-primary" />
            Your Insurance Advisors
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contact your agent for policy queries, renewals, or claims assistance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-md border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">Insurance Advisor</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-border">
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-4 w-4" />
                      {agent.phone}
                    </a>
                  )}
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    {agent.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Policies */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border bg-muted/40 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Recent Policies</h3>
            <p className="text-sm text-muted-foreground">Your most recently updated policies</p>
          </div>
          <Link
            href="/dashboard/policies"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-muted h-9 px-4 py-2"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : !policies || policies.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <FileText className="h-12 w-12 text-muted mb-4" />
            <p className="text-lg font-medium text-foreground">No Policies Yet</p>
            <p className="text-sm">You don't have any active policies linked to your account.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {policies.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-base font-bold text-foreground">
                      {p.policy_number}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="capitalize">{p.policy_type}</span>
                    {p.insurer_name && ` • ${p.insurer_name}`}
                  </p>
                  {p.agent && (
                    <p className="text-xs text-muted-foreground">
                      Agent: {p.agent.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Premium</p>
                  <p className="font-mono font-medium text-foreground">
                    ₹{p.premium_amount?.toLocaleString() || "—"}
                  </p>
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
  loading,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  iconColor: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-6 shadow-sm flex flex-col justify-between h-32 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight">
          {loading ? <div className="h-8 w-16 bg-muted rounded animate-pulse" /> : value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-green-500/20", text: "text-green-700 dark:text-green-400", border: "border-green-500/30" },
    expired: { bg: "bg-red-500/20", text: "text-red-700 dark:text-red-400", border: "border-red-500/30" },
    cancelled: { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" },
  };
  const c = config[status] || config.cancelled;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
}

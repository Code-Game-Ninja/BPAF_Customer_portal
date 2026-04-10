"use client";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
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
    .select(
      `
      *,
      agent:users!assigned_to (
        id,
        name,
        email,
        phone
      )
    `
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Policy[];
};

export default function DashboardPage() {
  const { customer, loading: authLoading } = useAuth();
  const [todayMs] = useState(() => Date.now());

  const { data: policies, error, isLoading: dataLoading } = useSWR(
    customer?.customer_id ? ["policies", customer.customer_id] : null,
    ([, customerId]) => fetchPolicies(customerId as string),
    { revalidateOnFocus: true }
  );

  const loading = authLoading || dataLoading;
  const activePolicies = policies?.filter((p) => p.status === "active") ?? [];
  const expiredPolicies = policies?.filter((p) => p.status === "expired") ?? [];
  const expiringSoon =
    policies?.filter((p) => {
      if (p.status !== "active") return false;
      const daysLeft = Math.ceil((new Date(p.end_date).getTime() - todayMs) / 86_400_000);
      return daysLeft >= 0 && daysLeft <= 30;
    }) ?? [];

  const uniqueAgents =
    policies?.reduce((acc, p) => {
      if (p.agent && !acc.find((a) => a.id === p.agent?.id)) {
        acc.push(p.agent);
      }
      return acc;
    }, [] as NonNullable<Policy["agent"]>[]) ?? [];

  const firstName = customer?.name?.split(" ")[0] ?? "Customer";

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_20px_45px_rgba(47,62,64,0.08)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#798478]">Portfolio Overview</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f3e40] md:text-4xl">Welcome back, {firstName}</h2>
            <p className="mt-3 max-w-2xl text-sm text-[#627579] md:text-base">
              Monitor active coverages, track renewals, and stay connected with your insurance advisor from one premium dashboard.
            </p>
          </div>
          <Link
            href="/dashboard/policies"
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#2f3e40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5d787a]"
          >
            Open Policies
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Total Policies"
          value={policies?.length ?? 0}
          loading={loading}
          tone="teal"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Active Protection"
          value={activePolicies.length}
          loading={loading}
          tone="green"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Expiring Soon"
          value={expiringSoon.length}
          loading={loading}
          tone="amber"
        />
        <MetricCard
          icon={XCircle}
          label="Expired"
          value={expiredPolicies.length}
          loading={loading}
          tone="rose"
        />
      </section>

      {error && (
        <section className="rounded-3xl border border-red-300/60 bg-red-100/60 p-4 text-sm font-semibold text-red-700">
          Failed to load your policy portfolio. Please refresh this page.
        </section>
      )}

      {expiringSoon.length > 0 && (
        <section className="rounded-[2rem] border border-amber-300/60 bg-amber-100/60 p-6 backdrop-blur">
          <h3 className="flex items-center gap-2 text-lg font-bold text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Renewals Due In 30 Days
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {expiringSoon.map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-amber-300/50 bg-white/85 p-4">
                <p className="font-mono text-sm font-bold text-[#2f3e40] md:text-base">{policy.policy_number}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f80]">
                  {policy.policy_type}
                </p>
                <p className="mt-3 inline-flex rounded-full bg-amber-200/70 px-3 py-1 text-xs font-semibold text-amber-800">
                  Expires {format(new Date(policy.end_date), "dd MMM yyyy")}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {uniqueAgents.length > 0 && (
        <section className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_14px_32px_rgba(47,62,64,0.06)] backdrop-blur">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#2f3e40]">
            <User className="h-5 w-5 text-[#5d787a]" />
            Your Insurance Advisors
          </h3>
          <p className="mt-2 text-sm text-[#6f7f80]">
            Reach out to your assigned advisors for renewals, claim support, and policy clarifications.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uniqueAgents.map((agent) => (
              <article key={agent.id} className="rounded-2xl border border-[#eadfce] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf0ef] text-[#5d787a]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2f3e40]">{agent.name}</p>
                    <p className="text-xs text-[#798478]">Insurance Advisor</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-[#f0e6d9] pt-3">
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 text-sm text-[#4d6a6d] transition-colors hover:text-[#2f3e40]"
                    >
                      <Phone className="h-4 w-4" />
                      {agent.phone}
                    </a>
                  )}
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex items-center gap-2 text-sm text-[#4d6a6d] transition-colors hover:text-[#2f3e40]"
                  >
                    <Mail className="h-4 w-4" />
                    {agent.email}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#eadfce] bg-white/90 shadow-[0_14px_32px_rgba(47,62,64,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-[#f0e6d9] bg-[#f7f2ea] p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h3 className="text-lg font-bold text-[#2f3e40]">Recent Policies</h3>
            <p className="text-sm text-[#798478]">Most recently created or updated policy records</p>
          </div>
          <Link
            href="/dashboard/policies"
            className="inline-flex items-center justify-center rounded-xl border border-[#d8c8b5] bg-white px-4 py-2 text-sm font-semibold text-[#4d6a6d] transition-colors hover:bg-[#f2ebe2]"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 w-full rounded-2xl bg-[#efe4d7] animate-pulse" />
            ))}
          </div>
        ) : !policies || policies.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <FileText className="h-10 w-10 text-[#94a1a1]" />
            <p className="mt-3 text-lg font-semibold text-[#2f3e40]">No policies linked yet</p>
            <p className="mt-1 text-sm text-[#798478]">Once policies are issued, your records will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0e6d9]">
            {policies.slice(0, 5).map((policy) => (
              <article key={policy.id} className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold text-[#2f3e40] md:text-base">{policy.policy_number}</p>
                    <PolicyStatusTag status={policy.status} />
                  </div>
                  <p className="text-sm text-[#6f7f80]">
                    <span className="capitalize">{policy.policy_type}</span>
                    {policy.insurer_name ? ` · ${policy.insurer_name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#798478]">Premium</p>
                  <p className="mt-1 font-semibold text-[#2f3e40]">{formatCurrency(policy.premium_amount)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  tone: "teal" | "green" | "amber" | "rose";
}) {
  const toneMap = {
    teal: "bg-[#eaf0ef] text-[#5d787a]",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <article className="rounded-[1.5rem] border border-[#eadfce] bg-white/90 p-5 shadow-[0_12px_28px_rgba(47,62,64,0.06)] backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#798478]">{label}</p>
        <div className={`rounded-xl p-2 ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-[#2f3e40]">
        {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded-lg bg-[#efe4d7]" /> : value}
      </p>
    </article>
  );
}

function PolicyStatusTag({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    expired: "bg-rose-100 text-rose-700 border-rose-200",
    cancelled: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusMap[status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {status}
    </span>
  );
}

function formatCurrency(value: number | undefined) {
  if (value === undefined || value === null) {
    return "INR 0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

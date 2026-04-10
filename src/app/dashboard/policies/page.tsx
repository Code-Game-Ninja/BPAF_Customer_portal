"use client";

import { useAuth } from "@/lib/auth-context";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  IndianRupee,
  Mail,
  Phone,
  Search,
  Shield,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  sum_insured?: number;
  insurer_name?: string;
  payment_frequency?: string;
  pdf_url?: string;
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const PAGE_SIZE = 20;

const STATUS_STYLE: Record<string, string> = {
  active: "border-green-200 bg-green-100 text-green-700",
  expired: "border-rose-200 bg-rose-100 text-rose-700",
  cancelled: "border-amber-200 bg-amber-100 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function PoliciesPage() {
  const { customer } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (!customer?.customer_id) return;

    (async () => {
      try {
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
          .eq("customer_id", customer.customer_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPolicies((data ?? []) as unknown as Policy[]);
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(policies.map((p) => p.policy_type).filter(Boolean));
    return Array.from(types).sort();
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    let result = [...policies];

    if (typeFilter !== "all") {
      result = result.filter((policy) => policy.policy_type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((policy) => policy.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (policy) =>
          policy.policy_number?.toLowerCase().includes(query) ||
          policy.policy_type?.toLowerCase().includes(query) ||
          policy.insurer_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [policies, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const paginatedPolicies = filteredPolicies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_14px_32px_rgba(47,62,64,0.06)] backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#798478]">Customer Policies</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-[#2f3e40]">Your Insurance Records</h2>
          <p className="text-sm font-medium text-[#627579]">
            {filteredPolicies.length} {filteredPolicies.length === 1 ? "policy" : "policies"}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#eadfce] bg-white/90 p-4 shadow-[0_12px_28px_rgba(47,62,64,0.06)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9898]" />
            <input
              type="text"
              placeholder="Search by policy number, type, or insurer"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] pl-10 pr-3 text-sm text-[#2f3e40] outline-none transition-colors placeholder:text-[#9aa6a6] focus:border-[#5d787a]"
            />
          </label>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9898]" />
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full min-w-[170px] appearance-none rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] pl-9 pr-9 text-sm text-[#2f3e40] outline-none transition-colors focus:border-[#5d787a]"
            >
              <option value="all">All Policy Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9898]" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full min-w-[150px] appearance-none rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] px-3 pr-9 text-sm text-[#2f3e40] outline-none transition-colors focus:border-[#5d787a]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9898]" />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 w-full animate-pulse rounded-2xl bg-[#efe4d7]" />
          ))}
        </div>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-[2rem] border border-[#eadfce] bg-white/90 shadow-[0_12px_28px_rgba(47,62,64,0.06)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f7f2ea] text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[#798478]">
                  <tr>
                    <th className="px-4 py-3">Policy</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Insurer</th>
                    <th className="px-4 py-3 text-right">Premium</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#798478]">
                        {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                          ? "No policies match your selected filters"
                          : "No policies found"}
                      </td>
                    </tr>
                  ) : (
                    paginatedPolicies.map((policy) => {
                      const isExpanded = expandedRow === policy.id;
                      return (
                        <Fragment key={policy.id}>
                          <tr key={`${policy.id}-summary`} className="border-t border-[#f1e7da]">
                            <td className="px-4 py-3.5 font-mono font-semibold text-[#2f3e40]">{policy.policy_number}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-full border border-[#e4d8c9] bg-[#fbf6ef] px-2.5 py-1 text-xs font-semibold capitalize text-[#4d6a6d]">
                                {policy.policy_type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-[#607172]">{policy.insurer_name || "-"}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-[#2f3e40]">{formatCurrency(policy.premium_amount)}</td>
                            <td className="px-4 py-3.5 text-[#4d6a6d]">{formatDate(policy.end_date)}</td>
                            <td className="px-4 py-3.5">
                              <StatusTag status={policy.status} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : policy.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7d9c8] bg-white text-[#607172] transition-colors hover:bg-[#f4ece1]"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={`${policy.id}-details`} className="border-t border-[#f1e7da] bg-[#fcf9f4]">
                              <td colSpan={7} className="px-4 py-5">
                                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                                  <DetailBlock title="Policy Details" icon={Shield}>
                                    <DetailRow icon={Calendar} label="Start Date" value={formatDate(policy.start_date)} />
                                    <DetailRow icon={Calendar} label="End Date" value={formatDate(policy.end_date)} />
                                    <DetailRow icon={IndianRupee} label="Sum Insured" value={formatCurrency(policy.sum_insured)} />
                                    <DetailRow icon={FileText} label="Frequency" value={capitalize(policy.payment_frequency || "Not Set")} />
                                  </DetailBlock>

                                  <DetailBlock title="Assigned Advisor" icon={User}>
                                    {policy.agent ? (
                                      <div className="space-y-3 rounded-xl border border-[#e7d9c8] bg-white p-3">
                                        <p className="text-sm font-semibold text-[#2f3e40]">{policy.agent.name}</p>
                                        <a
                                          href={`mailto:${policy.agent.email}`}
                                          className="flex items-center gap-2 text-sm text-[#4d6a6d] hover:text-[#2f3e40]"
                                        >
                                          <Mail className="h-4 w-4" />
                                          {policy.agent.email}
                                        </a>
                                        {policy.agent.phone && (
                                          <a
                                            href={`tel:${policy.agent.phone}`}
                                            className="flex items-center gap-2 text-sm text-[#4d6a6d] hover:text-[#2f3e40]"
                                          >
                                            <Phone className="h-4 w-4" />
                                            {policy.agent.phone}
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="rounded-xl border border-dashed border-[#dccdb9] bg-white/60 p-3 text-sm text-[#798478]">
                                        Advisor details are not available.
                                      </p>
                                    )}
                                  </DetailBlock>

                                  <DetailBlock title="Document Access" icon={FileText}>
                                    {policy.pdf_url ? (
                                      <a
                                        href={policy.pdf_url}
                                        download={`Policy_${policy.policy_number}.pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f3e40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5d787a]"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download Policy Copy
                                      </a>
                                    ) : (
                                      <p className="rounded-xl border border-dashed border-[#dccdb9] bg-white/60 p-3 text-sm text-[#798478]">
                                        No PDF has been uploaded for this policy.
                                      </p>
                                    )}
                                  </DetailBlock>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 md:hidden">
            {paginatedPolicies.length === 0 ? (
              <div className="rounded-2xl border border-[#eadfce] bg-white/90 p-6 text-center text-sm text-[#798478]">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "No policies match your selected filters"
                  : "No policies found"}
              </div>
            ) : (
              paginatedPolicies.map((policy) => {
                const isExpanded = expandedRow === policy.id;
                return (
                  <article key={policy.id} className="overflow-hidden rounded-2xl border border-[#eadfce] bg-white/90 shadow-[0_10px_24px_rgba(47,62,64,0.05)]">
                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : policy.id)}
                      className="w-full px-4 py-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-bold text-[#2f3e40]">{policy.policy_number}</p>
                          <p className="mt-1 text-sm text-[#607172]">{policy.insurer_name || "-"}</p>
                        </div>
                        <StatusTag status={policy.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6f7f80]">
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Shield className="h-3.5 w-3.5" />
                          {policy.policy_type}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {formatCurrency(policy.premium_amount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(policy.end_date)}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-[#f1e7da] bg-[#fcf9f4] px-4 py-4">
                        <DetailRow icon={Calendar} label="Start Date" value={formatDate(policy.start_date)} />
                        <DetailRow icon={IndianRupee} label="Sum Insured" value={formatCurrency(policy.sum_insured)} />
                        <DetailRow icon={FileText} label="Frequency" value={capitalize(policy.payment_frequency || "Not Set")} />

                        {policy.agent && (
                          <div className="space-y-2 rounded-xl border border-[#e3d6c6] bg-white p-3">
                            <p className="text-sm font-semibold text-[#2f3e40]">{policy.agent.name}</p>
                            <a href={`mailto:${policy.agent.email}`} className="flex items-center gap-2 text-sm text-[#4d6a6d]">
                              <Mail className="h-4 w-4" />
                              {policy.agent.email}
                            </a>
                            {policy.agent.phone && (
                              <a href={`tel:${policy.agent.phone}`} className="flex items-center gap-2 text-sm text-[#4d6a6d]">
                                <Phone className="h-4 w-4" />
                                {policy.agent.phone}
                              </a>
                            )}
                          </div>
                        )}

                        {policy.pdf_url && (
                          <a
                            href={policy.pdf_url}
                            download={`Policy_${policy.policy_number}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f3e40] px-4 py-2.5 text-sm font-semibold text-white"
                          >
                            <Download className="h-4 w-4" />
                            Download Policy Copy
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {totalPages > 1 && (
            <section className="flex items-center justify-between rounded-2xl border border-[#eadfce] bg-white/90 px-4 py-3 shadow-[0_8px_20px_rgba(47,62,64,0.04)]">
              <p className="text-xs font-semibold text-[#798478]">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredPolicies.length)} of {filteredPolicies.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3d6c6] bg-[#fdfaf5] text-[#607172] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-[#4d6a6d]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3d6c6] bg-[#fdfaf5] text-[#607172] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function DetailBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#2f3e40]">
        <Icon className="h-4 w-4 text-[#5d787a]" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#e8dbc9] bg-white p-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-[#6f7f80]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9898]">{label}</p>
        <p className="text-sm font-semibold text-[#2f3e40]">{value}</p>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLE[status] ?? STATUS_STYLE.archived}`}>
      {status}
    </span>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy");
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "INR 0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function capitalize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

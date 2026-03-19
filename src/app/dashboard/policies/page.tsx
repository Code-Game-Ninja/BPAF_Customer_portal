"use client";

import { useAuth } from "@/lib/auth-context";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  AlertCircle,
  Shield,
  Calendar,
  IndianRupee,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Download,
  Eye,
  User,
  Phone,
  Mail,
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
  customer_name?: string;
  pdf_url?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  // Agent details from joined users table
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
  expired: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
  cancelled: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  archived: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

function toDate(v: string | undefined): Date | null {
  if (!v) return null;
  return new Date(v);
}

function formatDate(v: string | undefined): string {
  const d = toDate(v);
  if (!d) return "—";
  return format(d, "dd MMM yyyy");
}

function formatCurrency(val: number | undefined) {
  if (val === undefined || val === null) return "—";
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

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
        // Fetch policies with agent details
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

  // Derived policy types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(policies.map(p => p.policy_type).filter(Boolean));
    return Array.from(types).sort();
  }, [policies]);

  const filtered = useMemo(() => {
    let result = [...policies];
    if (typeFilter !== "all") {
      result = result.filter((p) => p.policy_type === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.policy_number?.toLowerCase().includes(q) ||
          p.policy_type?.toLowerCase().includes(q) ||
          p.insurer_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [policies, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedPolicies = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-mono text-foreground tracking-tight">Policies</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} total {filtered.length === 1 ? 'policy' : 'policies'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border-2 border-border bg-card text-sm rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[130px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-2 border-2 border-border bg-card text-sm rounded-md appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative min-w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-2 border-2 border-border bg-card text-sm rounded-md appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-md skeleton" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border border-border bg-card text-card-foreground overflow-hidden shadow-sm">
            <div className="w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-left text-xs font-semibold">
                    <th className="h-10 px-4 align-middle">Policy #</th>
                    <th className="h-10 px-4 align-middle">Type</th>
                    <th className="h-10 px-4 align-middle">Insurer</th>
                    <th className="h-10 px-4 align-middle text-right">Premium</th>
                    <th className="h-10 px-4 align-middle">Expiry</th>
                    <th className="h-10 px-4 align-middle">Status</th>
                    <th className="h-10 px-4 align-middle"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                          ? "No policies match your filters"
                          : "No policies yet"}
                      </td>
                    </tr>
                  ) : (
                    paginatedPolicies.map((p) => {
                      const isExpanded = expandedRow === p.id;
                      return (
                        <React.Fragment key={p.id}>
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                            className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${isExpanded ? "bg-muted/10" : ""}`}
                          >
                            <td className="p-4 align-middle font-mono font-medium">{p.policy_number}</td>
                            <td className="p-4 align-middle">
                              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold bg-transparent capitalize">
                                {p.policy_type}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {p.insurer_name || "—"}
                            </td>
                            <td className="p-4 align-middle text-right font-mono font-medium">
                              {formatCurrency(p.premium_amount)}
                            </td>
                            <td className="p-4 align-middle">
                              {formatDate(p.end_date)}
                            </td>
                            <td className="p-4 align-middle">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.archived}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <button className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-border bg-muted/10">
                              <td colSpan={7} className="p-0">
                                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                  {/* Details */}
                                  <div className="space-y-4">
                                    <h4 className="text-sm flex items-center gap-2 font-bold mb-4">
                                      <Shield className="h-4 w-4 text-primary" />
                                      Policy Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <InfoRow icon={Calendar} label="Start Date" value={formatDate(p.start_date)} />
                                      <InfoRow icon={Calendar} label="End Date" value={formatDate(p.end_date)} />
                                      <InfoRow icon={IndianRupee} label="Sum Insured" value={formatCurrency(p.sum_insured)} />
                                      <InfoRow icon={Clock} label="Payment Frequency" value={p.payment_frequency || "—"} capitalize />
                                    </div>
                                  </div>

                                  {/* Your Agent */}
                                  <div className="space-y-4">
                                    <h4 className="text-sm flex items-center gap-2 font-bold mb-4">
                                      <User className="h-4 w-4 text-primary" />
                                      Your Agent
                                    </h4>
                                    {p.agent ? (
                                      <div className="space-y-3 rounded-md border border-border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-sm">{p.agent.name}</p>
                                            <p className="text-xs text-muted-foreground">Insurance Advisor</p>
                                          </div>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-border">
                                          {p.agent.phone && (
                                            <a href={`tel:${p.agent.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                              <Phone className="h-4 w-4" />
                                              {p.agent.phone}
                                            </a>
                                          )}
                                          <a href={`mailto:${p.agent.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                            <Mail className="h-4 w-4" />
                                            {p.agent.email}
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="rounded-md border border-border border-dashed p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Agent info not available</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Documents */}
                                  <div className="space-y-4">
                                    <h4 className="text-sm flex items-center gap-2 font-bold mb-4">
                                      <FileText className="h-4 w-4 text-primary" />
                                      Policy Document
                                    </h4>
                                    {p.pdf_url ? (
                                      <div className="flex items-center justify-between rounded-md border border-border bg-card p-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-5 w-5 text-primary" />
                                          <div>
                                            <p className="text-sm font-medium">Policy Copy</p>
                                            <p className="text-xs text-muted-foreground">PDF Document</p>
                                          </div>
                                        </div>
                                        <a
                                          href={p.pdf_url}
                                          download={`Policy_${p.policy_number}.pdf`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border hover:bg-muted h-9 px-3 gap-2"
                                        >
                                          <Download className="h-4 w-4" />
                                          <span className="sr-only sm:not-sr-only">Download</span>
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="rounded-md border border-border border-dashed p-4 text-center">
                                        <p className="text-sm text-muted-foreground">No document available</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3 stagger-list">
            {paginatedPolicies.length === 0 ? (
              <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "No policies match your filters"
                  : "No policies yet"}
              </div>
            ) : (
              paginatedPolicies.map((p) => {
                const isExpanded = expandedRow === p.id;
                return (
                  <div key={p.id} className={`rounded-md border transition-all ${isExpanded ? 'border-primary shadow-sm' : 'border-border bg-card shadow-sm hover:border-primary/50'}`}>
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-mono text-sm font-bold">{p.policy_number}</p>
                          <p className="text-sm text-muted-foreground">{p.insurer_name || "—"}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.archived}`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize"><Shield className="h-3 w-3" /> {p.policy_type}</span>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {formatCurrency(p.premium_amount)}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.end_date)}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/10 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="grid grid-cols-2 gap-4 my-4">
                          <InfoRow icon={Calendar} label="Start Date" value={formatDate(p.start_date)} />
                          <InfoRow icon={IndianRupee} label="Sum Insured" value={formatCurrency(p.sum_insured)} />
                          <div className="col-span-2">
                            <InfoRow icon={Clock} label="Payment Frequency" value={p.payment_frequency || "—"} capitalize />
                          </div>
                        </div>

                        {/* Agent Contact - Mobile */}
                        {p.agent && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Agent</h4>
                            <div className="rounded-md border border-border bg-card p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <p className="font-semibold text-sm">{p.agent.name}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                {p.agent.phone && (
                                  <a href={`tel:${p.agent.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground h-8 px-3">
                                    <Phone className="h-3.5 w-3.5" /> Call
                                  </a>
                                )}
                                <a href={`mailto:${p.agent.email}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium border border-border bg-card h-8 px-3">
                                  <Mail className="h-3.5 w-3.5" /> Email
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {p.pdf_url && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <a
                              href={p.pdf_url}
                              download={`Policy_${p.policy_number}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 gap-2 shadow-sm"
                            >
                              <Download className="h-4 w-4" /> Download Policy Copy
                            </a>
                          </div>
                        )}
                        {!p.pdf_url && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs text-center text-muted-foreground">No policy document available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}—
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none h-8 w-8 border border-border bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none h-8 w-8 border border-border bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, capitalize }: { icon: any, label: string, value: string, capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

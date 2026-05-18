"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Activity, 
  ShieldCheck,
  ChevronRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ClaimsPage() {
  const { customer } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchClaims() {
      if (!customer) return;
      try {
        const { data, error } = await supabase
          .from("claims")
          .select(`
            *,
            policies (
              id,
              policy_number,
              type
            )
          `)
          .eq("customer_id", customer.customer_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClaims(data || []);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, [customer]);

  const filteredClaims = claims.filter((claim) =>
    claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            {status}
          </span>
        );
      case "in_progress":
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Activity className="h-3 w-3" />
            {status.replace("_", " ")}
          </span>
        );
      case "pending":
      case "new":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
      case "rejected":
      case "denied":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5d787a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2f3e40]">My Claims</h2>
          <p className="mt-1 text-sm text-[#4d6a6d]">Track and manage your insurance claims.</p>
        </div>
        <Link
          href="/dashboard/claims/new"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5d787a] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5d787a]/20 transition-all hover:bg-[#4d6a6d] hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          File New Claim
        </Link>
      </div>

      <div className="rounded-3xl border border-[#e7d9c8] bg-white/70 p-6 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#798478]" />
            <input
              type="text"
              placeholder="Search claims by number, type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-[#e7d9c8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2f3e40] placeholder-[#798478] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
            />
          </div>
        </div>

        {filteredClaims.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClaims.map((claim) => (
              <Link
                key={claim.id}
                href={`/dashboard/claims/${claim.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e7d9c8] bg-white p-5 transition-all hover:border-[#5d787a]/30 hover:shadow-xl hover:shadow-[#5d787a]/5"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#5d787a]/5 transition-transform duration-500 group-hover:scale-150" />
                
                <div className="relative z-10 mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs font-semibold text-[#798478]">{claim.claim_number}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#2f3e40]">{claim.type}</h3>
                  {claim.policies && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#4d6a6d]">
                      <FileText className="h-3.5 w-3.5" />
                      Policy: {claim.policies.policy_number}
                    </p>
                  )}
                </div>

                <div className="relative z-10 mt-auto border-t border-[#f4efe7] pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#798478]">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(claim.date_of_incident || claim.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4efe7] text-[#5d787a] transition-colors group-hover:bg-[#5d787a] group-hover:text-white">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f4efe7] text-[#798478]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#2f3e40]">No claims found</h3>
            <p className="mt-2 text-sm text-[#4d6a6d]">
              {searchTerm ? "Try adjusting your search terms." : "You haven't filed any claims yet."}
            </p>
            {!searchTerm && (
              <Link
                href="/dashboard/claims/new"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5d787a] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#4d6a6d]"
              >
                <Plus className="h-4 w-4" />
                File Your First Claim
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

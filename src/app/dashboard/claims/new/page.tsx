"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  AlignLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function NewClaimPage() {
  const { customer } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    policy_id: "",
    type: "",
    date_of_incident: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    async function fetchPolicies() {
      if (!customer) return;
      try {
        const { data, error } = await supabase
          .from("policies")
          .select("id, policy_number, type")
          .eq("customer_id", customer.customer_id)
          .eq("status", "active");

        if (error) throw error;
        setPolicies(data || []);
        
        // Auto-select if only one policy
        if (data?.length === 1) {
          setFormData(prev => ({ ...prev, policy_id: data[0].id }));
        }
      } catch (err) {
        console.error("Error fetching policies:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setSubmitting(true);
      setError("");

      const { data, error: submitError } = await supabase
        .from("claims")
        .insert({
          customer_id: customer.customer_id,
          policy_id: formData.policy_id,
          type: formData.type,
          status: "pending",
          date_of_incident: formData.date_of_incident,
          location: formData.location,
          description: formData.description,
          source: "customer_portal",
        })
        .select()
        .single();

      if (submitError) throw submitError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/claims/${data.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting claim:", err);
      setError(err.message || "An error occurred while submitting your claim.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5d787a] border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#2f3e40]">Claim Submitted Successfully</h2>
          <p className="mt-2 text-[#4d6a6d]">
            We've received your claim and will begin reviewing it shortly. You will be redirected to the claim details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/claims"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7d9c8] bg-white text-[#4d6a6d] transition-colors hover:bg-[#f4efe7] hover:text-[#2f3e40]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2f3e40]">File a New Claim</h2>
          <p className="mt-1 text-sm text-[#4d6a6d]">Please provide details about the incident.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white/70 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
        <div className="border-b border-[#e7d9c8] bg-white/50 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#5d787a]">
            <ShieldAlert className="h-4 w-4" />
            Claim Details
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800 border border-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="policy_id" className="flex items-center gap-2 text-sm font-semibold text-[#2f3e40]">
                  <FileText className="h-4 w-4 text-[#798478]" />
                  Select Policy
                </label>
                <select
                  id="policy_id"
                  name="policy_id"
                  required
                  value={formData.policy_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm text-[#2f3e40] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
                >
                  <option value="" disabled>Choose a policy...</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.policy_number} - {p.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="flex items-center gap-2 text-sm font-semibold text-[#2f3e40]">
                  <ShieldAlert className="h-4 w-4 text-[#798478]" />
                  Claim Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm text-[#2f3e40] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
                >
                  <option value="" disabled>Select type of claim...</option>
                  <option value="Accident">Accident</option>
                  <option value="Theft">Theft</option>
                  <option value="Natural Disaster">Natural Disaster</option>
                  <option value="Property Damage">Property Damage</option>
                  <option value="Medical">Medical</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="date_of_incident" className="flex items-center gap-2 text-sm font-semibold text-[#2f3e40]">
                  <Calendar className="h-4 w-4 text-[#798478]" />
                  Date of Incident
                </label>
                <input
                  type="date"
                  id="date_of_incident"
                  name="date_of_incident"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.date_of_incident}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm text-[#2f3e40] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-[#2f3e40]">
                  <MapPin className="h-4 w-4 text-[#798478]" />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  placeholder="Where did this happen?"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm text-[#2f3e40] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-[#2f3e40]">
                <AlignLeft className="h-4 w-4 text-[#798478]" />
                Incident Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Please describe what happened in detail..."
                value={formData.description}
                onChange={handleChange}
                className="w-full resize-y rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm text-[#2f3e40] focus:border-[#5d787a] focus:outline-none focus:ring-2 focus:ring-[#5d787a]/20"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4 border-t border-[#e7d9c8] pt-6">
            <Link
              href="/dashboard/claims"
              className="rounded-2xl px-6 py-2.5 text-sm font-semibold text-[#4d6a6d] hover:bg-[#f4efe7]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || policies.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5d787a] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5d787a]/20 transition-all hover:bg-[#4d6a6d] hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#5d787a] disabled:hover:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Claim"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

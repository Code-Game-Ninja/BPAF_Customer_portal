"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  FileText, 
  Activity, 
  ShieldCheck,
  AlertCircle,
  Clock,
  MessageSquare,
  Upload,
  File,
  Loader2,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ClaimDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { customer } = useAuth();
  const [claim, setClaim] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    async function fetchClaim() {
      if (!customer) return;
      try {
        const { data, error } = await supabase
          .from("claims")
          .select(`
            *,
            policies (
              policy_number,
              type
            )
          `)
          .eq("id", resolvedParams.id)
          .eq("customer_id", customer.customer_id)
          .single();

        if (error) throw error;
        setClaim(data);

        // Fetch timeline
        const { data: timelineData } = await supabase
          .from("claim_timeline")
          .select("*")
          .eq("claim_id", resolvedParams.id)
          .order("created_at", { ascending: false });
        
        if (timelineData) setTimeline(timelineData);
      } catch (error) {
        console.error("Error fetching claim details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClaim();
  }, [customer, resolvedParams.id]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            {status}
          </span>
        );
      case "in_progress":
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-700">
            <Activity className="h-4 w-4" />
            {status.replace("_", " ")}
          </span>
        );
      case "pending":
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-700">
            <Clock className="h-4 w-4" />
            {status}
          </span>
        );
      case "rejected":
      case "denied":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 py-1.5 text-sm font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !claim) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }
    
    setUploading(true);
    setUploadError("");
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${claim.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload to Supabase Storage (bucket: claims)
      const { error: uploadError } = await supabase.storage
        .from('claims')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('claims')
        .getPublicUrl(filePath);

      const newDoc = {
        name: file.name,
        url: publicUrlData.publicUrl,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };

      // Update claim documents array
      const existingDocs = claim.documents || [];
      const updatedDocs = [...existingDocs, newDoc];

      const { error: updateError } = await supabase
        .from('claims')
        .update({ documents: updatedDocs })
        .eq('id', claim.id);

      if (updateError) throw updateError;

      setClaim({ ...claim, documents: updatedDocs });

      // Add to timeline
      await supabase.from("claim_timeline").insert({
        claim_id: claim.id,
        action: "document_uploaded",
        description: `Customer uploaded document: ${file.name}`,
        performed_by: customer?.customer_id,
        performed_by_name: customer?.name,
      });

      // Refresh timeline
      const { data: timelineData } = await supabase
        .from("claim_timeline")
        .select("*")
        .eq("claim_id", resolvedParams.id)
        .order("created_at", { ascending: false });
      
      if (timelineData) setTimeline(timelineData);

    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeDocument = async (docUrl: string) => {
    if (!claim || !confirm("Are you sure you want to remove this document?")) return;
    
    try {
      const updatedDocs = (claim.documents || []).filter((d: any) => d.url !== docUrl);
      
      const { error } = await supabase
        .from('claims')
        .update({ documents: updatedDocs })
        .eq('id', claim.id);
        
      if (error) throw error;
      setClaim({ ...claim, documents: updatedDocs });
    } catch (err) {
      console.error("Failed to remove document:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5d787a] border-t-transparent" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-[#2f3e40]">Claim Not Found</h3>
        <p className="mt-2 text-sm text-[#4d6a6d]">The claim you are looking for does not exist or you do not have permission to view it.</p>
        <Link
          href="/dashboard/claims"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#5d787a] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4d6a6d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Claims
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/claims"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7d9c8] bg-white text-[#4d6a6d] transition-colors hover:bg-[#f4efe7] hover:text-[#2f3e40]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-[#2f3e40]">Claim {claim.claim_number}</h2>
              {getStatusBadge(claim.status)}
            </div>
            <p className="mt-1 text-sm text-[#4d6a6d]">Submitted on {format(new Date(claim.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white/70 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
            <div className="border-b border-[#e7d9c8] bg-white/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d787a]">
                <ShieldAlert className="h-4 w-4" />
                Incident Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Date of Incident</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#2f3e40]">
                    <Calendar className="h-4 w-4 text-[#4d6a6d]" />
                    {claim.date_of_incident ? format(new Date(claim.date_of_incident), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Location</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#2f3e40]">
                    <MapPin className="h-4 w-4 text-[#4d6a6d]" />
                    {claim.location || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Description</p>
                <div className="mt-2 rounded-2xl bg-[#f9f7f2] p-4 text-sm leading-relaxed text-[#4d6a6d]">
                  {claim.description}
                </div>
              </div>
            </div>
          </div>
          
          {/* Updates Section */}
          <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white/70 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
            <div className="border-b border-[#e7d9c8] bg-white/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d787a]">
                <MessageSquare className="h-4 w-4" />
                Updates
              </h3>
            </div>
            <div className="p-6">
              {timeline && timeline.length > 0 ? (
                <div className="space-y-6">
                  {timeline.map((event, index) => (
                    <div key={event.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4efe7] text-[#5d787a]">
                          <Activity className="h-4 w-4" />
                        </div>
                        {index !== timeline.length - 1 && (
                          <div className="w-px flex-1 bg-[#e7d9c8] my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-semibold text-[#2f3e40]">
                          {event.description}
                        </p>
                        <p className="mt-1 text-xs text-[#798478]">
                          {format(new Date(event.created_at || event.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#e7d9c8] p-8 text-center">
                  <p className="text-sm text-[#798478]">No updates from the claims team yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white/70 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
            <div className="border-b border-[#e7d9c8] bg-white/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d787a]">
                <FileText className="h-4 w-4" />
                Policy Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Policy Number</p>
                <p className="mt-1 text-sm font-bold text-[#2f3e40]">{claim.policies?.policy_number}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Policy Type</p>
                <p className="mt-1 text-sm font-medium text-[#4d6a6d]">{claim.policies?.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#798478]">Claim Type</p>
                <p className="mt-1 inline-flex rounded-lg bg-[#f4efe7] px-2.5 py-1 text-xs font-semibold text-[#2f3e40]">
                  {claim.type}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="overflow-hidden rounded-3xl border border-[#e7d9c8] bg-white/70 shadow-xl shadow-[#2f3e40]/5 backdrop-blur-xl">
            <div className="border-b border-[#e7d9c8] bg-white/50 px-6 py-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d787a]">
                <File className="h-4 w-4" />
                Documents
              </h3>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[#f4efe7] px-3 py-1.5 text-xs font-semibold text-[#5d787a] hover:bg-[#e7d9c8] transition-colors">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <div className="p-6">
              {uploadError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {uploadError}
                </div>
              )}
              
              {claim.documents && claim.documents.length > 0 ? (
                <div className="space-y-3">
                  {claim.documents.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-[#e7d9c8] bg-white p-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block truncate text-sm font-medium text-[#2f3e40] hover:underline"
                          >
                            {doc.name}
                          </a>
                          <p className="text-xs text-[#798478]">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB • {format(new Date(doc.uploaded_at || new Date()), "MMM d")}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeDocument(doc.url)}
                        className="ml-2 rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#e7d9c8] p-6 text-center">
                  <p className="text-sm text-[#798478]">No documents uploaded.</p>
                  <p className="mt-1 text-xs text-[#798478]/70">Upload photos, police reports, or bills to support your claim.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

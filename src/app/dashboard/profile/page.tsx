"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { kycService, type KYCDocument } from "@/lib/kyc.service";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  uid?: string;
}

const KYC_LABEL: Record<string, string> = {
  aadhaar: "Aadhaar",
  pan: "PAN",
  gst: "GST",
  address_proof: "Address Proof",
  passport: "Passport",
  driving_license: "Driving License",
  voter_id: "Voter ID",
  bank_statement: "Bank Statement",
  company_registration: "Company Registration",
  other: "Other",
};

export default function ProfilePage() {
  const { customer, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "kyc">("info");

  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");

  useEffect(() => {
    if (!customer?.customer_id) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customer.customer_id)
          .single();

        if (data) setInfo(data as CustomerInfo);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  useEffect(() => {
    if (activeTab === "kyc" && customer?.customer_id && !kycDocs.length) {
      void loadKycDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customer?.customer_id]);

  const loadKycDocs = async () => {
    if (!customer?.customer_id) return;

    setLoadingKyc(true);
    try {
      const docs = await kycService.list(customer.customer_id);
      setKycDocs(docs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load KYC documents");
    } finally {
      setLoadingKyc(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer?.customer_id) return;

    if (!selectedFile || !docType) {
      toast.error("Please choose a document type and file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    try {
      await kycService.upload(customer.customer_id, selectedFile, docType, docNumber);
      toast.success("Document uploaded successfully.");
      setSelectedFile(null);
      setDocType("");
      setDocNumber("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadKycDocs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string, filePath: string) => {
    setLoadingKyc(true);
    try {
      await kycService.delete(docId, filePath);
      toast.success("Document removed.");
      await loadKycDocs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove document";
      toast.error(message);
      setLoadingKyc(false);
    }
  };

  const handleViewKYC = async (filePath: string) => {
    try {
      const url = await kycService.getSignedUrl(filePath);
      window.open(url, "_blank");
    } catch {
      toast.error("Could not open document preview.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_14px_32px_rgba(47,62,64,0.06)] backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#798478]">Account Center</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f3e40]">Profile and Security</h2>
        <p className="mt-2 text-sm text-[#627579]">
          Manage your contact information, password, and KYC documents from one secure page.
        </p>
      </section>

      <section className="inline-flex rounded-2xl border border-[#e6d8c6] bg-white/85 p-1 shadow-[0_10px_22px_rgba(47,62,64,0.05)]">
        <button
          onClick={() => setActiveTab("info")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "info" ? "bg-[#5d787a] text-white" : "text-[#5f7274] hover:bg-[#f3ece2]"
          }`}
        >
          Profile & Security
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "kyc" ? "bg-[#5d787a] text-white" : "text-[#5f7274] hover:bg-[#f3ece2]"
          }`}
        >
          KYC Documents
        </button>
      </section>

      {activeTab === "info" && (
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-white/90 shadow-[0_12px_28px_rgba(47,62,64,0.05)]">
            <div className="border-b border-[#efe3d2] bg-[#f7f2ea] px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2f3e40]">
                <User className="h-5 w-5 text-[#5d787a]" />
                Personal Information
              </h3>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                <div className="h-14 animate-pulse rounded-xl bg-[#efe4d7]" />
                <div className="h-14 animate-pulse rounded-xl bg-[#efe4d7]" />
                <div className="h-14 animate-pulse rounded-xl bg-[#efe4d7]" />
              </div>
            ) : (
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-4 rounded-2xl border border-[#e7d9c8] bg-[#fcf9f4] p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e7e6] text-xl font-bold text-[#2f3e40]">
                    {(info?.name || customer?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#2f3e40]">{info?.name || customer?.name || "Customer"}</p>
                    {info?.uid && (
                      <p className="mt-1 inline-flex rounded-full border border-[#e3d5c4] bg-white px-2.5 py-1 text-xs font-semibold text-[#6f7f80]">
                        ID: {info.uid}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow icon={Mail} label="Email" value={info?.email || customer?.email || "-"} />
                  <InfoRow icon={Phone} label="Phone" value={info?.phone || customer?.phone || "-"} />
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={MapPin}
                      label="Address"
                      value={[info?.address, info?.city, info?.state, info?.pincode].filter(Boolean).join(", ") || "-"}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-white/90 shadow-[0_12px_28px_rgba(47,62,64,0.05)]">
            <div className="border-b border-[#efe3d2] bg-[#f7f2ea] px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2f3e40]">
                <Lock className="h-5 w-5 text-[#5d787a]" />
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 p-5">
              <PasswordField
                label="Current Password"
                value={currentPw}
                onChange={setCurrentPw}
                visible={showCurrent}
                onToggleVisibility={() => setShowCurrent((prev) => !prev)}
              />

              <PasswordField
                label="New Password"
                value={newPw}
                onChange={setNewPw}
                visible={showNew}
                onToggleVisibility={() => setShowNew((prev) => !prev)}
              />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#718283]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(event) => setConfirmPw(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] px-3 text-sm text-[#2f3e40] outline-none transition-colors placeholder:text-[#9aa6a6] focus:border-[#5d787a]"
                />
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-xs font-semibold text-rose-600">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPw || !currentPw || !newPw || newPw !== confirmPw}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2f3e40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5d787a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPw ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="space-y-5">
          <section className="rounded-[1.75rem] border border-[#eadfce] bg-white/90 p-5 shadow-[0_12px_28px_rgba(47,62,64,0.05)]">
            <h3 className="text-lg font-bold text-[#2f3e40]">Upload New Document</h3>
            <p className="mt-1 text-sm text-[#627579]">
              Upload clear copies of your KYC records. Accepted formats: PDF, JPEG, PNG, WEBP (up to 10MB).
            </p>

            <form onSubmit={handleUpload} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#718283]">Document Type</label>
                <select
                  required
                  value={docType}
                  onChange={(event) => setDocType(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] px-3 text-sm text-[#2f3e40] outline-none transition-colors focus:border-[#5d787a]"
                >
                  <option value="" disabled>
                    Select document type...
                  </option>
                  {Object.entries(KYC_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#718283]">Document Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Example: 1234 5678 9012"
                  value={docNumber}
                  onChange={(event) => setDocNumber(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] px-3 text-sm text-[#2f3e40] outline-none transition-colors placeholder:text-[#9aa6a6] focus:border-[#5d787a]"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#718283]">Upload File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] p-2 text-sm text-[#627579] file:mr-3 file:rounded-lg file:border-0 file:bg-[#e4efee] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#4d6a6d]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2f3e40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5d787a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-white/90 shadow-[0_12px_28px_rgba(47,62,64,0.05)]">
            <div className="border-b border-[#efe3d2] bg-[#f7f2ea] px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2f3e40]">
                <Shield className="h-5 w-5 text-[#5d787a]" />
                Your Uploaded Documents
              </h3>
            </div>

            <div className="p-5">
              {loadingKyc ? (
                <div className="space-y-3">
                  <div className="h-14 animate-pulse rounded-xl bg-[#efe4d7]" />
                  <div className="h-14 animate-pulse rounded-xl bg-[#efe4d7]" />
                </div>
              ) : kycDocs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dccdb9] bg-[#fcf9f4] px-4 py-10 text-center">
                  <FileText className="mx-auto h-9 w-9 text-[#99a7a7]" />
                  <p className="mt-3 text-sm font-semibold text-[#627579]">No KYC documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kycDocs.map((doc) => (
                    <article
                      key={doc.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#e7d9c8] bg-[#fcf9f4] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dfecea] text-[#5d787a]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#2f3e40]">
                            {KYC_LABEL[doc.document_type] || doc.document_type}
                            {doc.document_number && (
                              <span className="ml-2 rounded bg-white px-1.5 py-0.5 font-mono text-xs font-medium text-[#6f7f80]">
                                #{doc.document_number}
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-[#798478]">
                            {doc.file_name} · Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <StatusBadge status={doc.status} />
                        <button
                          onClick={() => handleViewKYC(doc.file_path)}
                          title="View Document"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3d6c6] bg-white text-[#5f7274] transition-colors hover:bg-[#f4ece1]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        {doc.status === "pending" && (
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                            title="Delete Document"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#718283]">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className="h-11 w-full rounded-xl border border-[#e3d6c6] bg-[#fdfaf5] px-3 pr-10 text-sm text-[#2f3e40] outline-none transition-colors placeholder:text-[#9aa6a6] focus:border-[#5d787a]"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6f7f80] transition-colors hover:bg-[#efe5d8]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#e8dbc9] bg-white p-3">
      <Icon className="mt-0.5 h-4 w-4 text-[#6f7f80]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9898]">{label}</p>
        <p className="text-sm font-semibold text-[#2f3e40]">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-green-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Verified
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
      <Clock className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

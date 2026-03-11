"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toast } from "sonner";
import { User, Lock, MapPin, Phone, Mail, Eye, EyeOff } from "lucide-react";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  uid?: string; // C-NNNN display ID
}

export default function ProfilePage() {
  const { customer, changePassword } = useAuth();
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!customer?.customer_id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "customers", customer.customer_id));
        if (snap.exists()) {
          setInfo(snap.data() as CustomerInfo);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer?.customer_id]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const msg =
        err instanceof Error ? err.message : "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-mono text-foreground tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          View your information and manage your account.
        </p>
      </div>

      {/* Personal Info Card */}
      <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden transition-all duration-300">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Personal Information</h3>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted-foreground text-sm font-medium">Loading profile...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-5 pb-6 border-b border-border">
              <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-foreground text-2xl font-bold border border-border">
                {(info?.name || customer?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-foreground tracking-tight">
                  {info?.name || customer?.name}
                </p>
                {info?.uid && (
                  <p className="text-xs font-semibold text-muted-foreground bg-muted/50 border border-border px-2.5 py-0.5 rounded-full w-fit">ID: {info.uid}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email" value={info?.email || customer?.email || "—"} />
              <InfoRow icon={Phone} label="Phone" value={info?.phone || customer?.phone || "—"} />
              <div className="col-span-1 sm:col-span-2">
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={
                    [info?.address, info?.city, info?.state, info?.pincode]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden transition-all duration-300">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="currentPw" className="block text-sm font-medium text-foreground">
              Current Password
            </label>
            <div className="relative group">
              <input
                id="currentPw"
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                aria-label="Current Password"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="newPw" className="block text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="relative group">
              <input
                id="newPw"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={8}
                aria-label="New Password"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPw" className="block text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              aria-label="Confirm New Password"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-destructive font-medium mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPw || !currentPw || !newPw || newPw !== confirmPw}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {changingPw ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
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
    <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40 border border-border/50">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

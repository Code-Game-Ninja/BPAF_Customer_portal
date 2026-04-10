"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CustomerGatewayPage() {
  const router = useRouter();
  const { customer, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (customer) {
      router.replace("/dashboard");
      return;
    }

    const mainAppUrl = (process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    window.location.href = `${mainAppUrl}/login?portal=customer`;
  }, [customer, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f2] px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eae0cc] bg-white/90 p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.03)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5d787a] text-white">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#2f3e40]">Redirecting to secure login</h1>
        <p className="mt-2 text-sm font-medium text-[#798478]">
          You are being redirected to the unified BP & AF authentication hub.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[#5d787a]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-[0.14em]">Please wait</span>
        </div>
      </div>
    </div>
  );
}

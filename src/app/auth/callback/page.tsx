"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const SESSION_APPLY_TIMEOUT_MS = 4500;

export default function CustomerAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f9f7f2]">
          <Loader2 className="h-8 w-8 animate-spin text-[#5d787a]" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let active = true;

    const safeRedirect = (path: string) => {
      if (!active) return;
      // Hard navigation avoids waiting for App Router transition after auth handoff.
      window.location.replace(path);
    };

    async function applySession() {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const nextPathRaw = searchParams.get("next") || "/dashboard";
      const nextPath =
        nextPathRaw.startsWith("/") && !nextPathRaw.startsWith("//")
          ? nextPathRaw
          : "/dashboard";

      if (!accessToken || !refreshToken) {
        toast.error("Login handoff failed", {
          description: "Missing secure session tokens.",
        });
        safeRedirect("/");
        return;
      }

      const setSessionTask = supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const timeoutTask = new Promise<"timeout">((resolve) => {
        setTimeout(() => resolve("timeout"), SESSION_APPLY_TIMEOUT_MS);
      });

      const result = await Promise.race([setSessionTask, timeoutTask]);

      if (!active) return;

      if (result === "timeout") {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          safeRedirect(nextPath);
          return;
        }

        toast.error("Login handoff timed out", {
          description: "Please try login again.",
        });
        safeRedirect("/");
        return;
      }

      const { error } = result;

      if (error) {
        toast.error("Login handoff failed", {
          description: error.message,
        });
        safeRedirect("/");
        return;
      }

      safeRedirect(nextPath);
    }

    applySession();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f2] px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-[#eae0cc] bg-white/90 p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.03)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5d787a] text-white">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#2f3e40]">Securing your session</h1>
        <p className="mt-2 text-sm font-medium text-[#798478]">
          Verifying your credentials and preparing your customer workspace.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[#5d787a]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-[0.14em]">Please wait</span>
        </div>
      </div>
    </div>
  );
}

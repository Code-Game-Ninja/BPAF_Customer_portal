"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield, Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { signIn, customer, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && customer) {
      router.replace("/dashboard");
    }
  }, [loading, customer, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    try {
      const res = await fetch("/api/customer-auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("Password reset email sent. Check your inbox.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-8">
      {/* Decorative blobs */}
      <div className="login-blob-accent absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-25 pointer-events-none" />
      <div className="login-blob-primary absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full opacity-15 pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4 shadow-md">
            <Shield className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Customer Portal</h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">BP & AF Insurance Broker Pvt. Ltd.</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8 space-y-6 backdrop-blur-sm login-card-border overflow-hidden relative transition-shadow duration-300 hover:shadow-2xl"
        >
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter the credentials sent to your email</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring outline-none text-sm transition-all shadow-sm"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring outline-none text-sm transition-all shadow-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Forgot password */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Forgot your password?
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
          &copy; {new Date().getFullYear()} BP & AF Insurance Broker Pvt. Ltd.
        </p>
      </div>
    </div>
  );
}

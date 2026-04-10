"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shield,
  LayoutDashboard,
  FileText,
  RefreshCcw,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/policies", label: "My Policies", icon: FileText },
  { href: "/dashboard/renewals", label: "Renewals", icon: RefreshCcw },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const activeTitle = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Customer Portal";

  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/");
    }
  }, [loading, customer, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f2]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5d787a] border-t-transparent" />
      </div>
    );
  }

  if (!customer) return null;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.replace("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9f7f2] text-[#2f3e40]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#5d787a]/15 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#c9ada1]/25 blur-3xl" />
        <div className="absolute -bottom-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#dac7b7]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-[#e7d9c8] bg-white/70 px-6 py-8 backdrop-blur-xl lg:flex lg:flex-col">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5d787a] text-white shadow-[0_12px_30px_rgba(93,120,122,0.25)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-[#2f3e40]">BP & AF</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#798478]">Customer Portal</p>
            </div>
          </Link>

          <div className="mt-8 rounded-3xl border border-[#eadfce] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,62,64,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#798478]">Signed In As</p>
            <p className="mt-2 text-sm font-bold text-[#2f3e40]">{customer.name}</p>
            <p className="mt-1 truncate text-xs text-[#6f7f80]">{customer.email}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#5d787a] text-white shadow-[0_10px_20px_rgba(93,120,122,0.3)]"
                      : "text-[#4d6a6d] hover:bg-white/85 hover:text-[#2f3e40]"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#798478] group-hover:text-[#5d787a]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e7d9c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#4d6a6d] transition-colors hover:bg-white"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Use Light Mode" : "Use Dark Mode"}
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2f3e40] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5d787a]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#e7d9c8] bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7d9c8] bg-white text-[#4d6a6d] lg:hidden"
                  onClick={() => setMobileOpen((prev) => !prev)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#798478]">Policy Access</p>
                  <h1 className="text-lg font-bold tracking-tight text-[#2f3e40] sm:text-xl">{activeTitle}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7d9c8] bg-white text-[#4d6a6d]"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f3e40] text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {mobileOpen && (
              <div className="mt-4 space-y-2 rounded-2xl border border-[#e7d9c8] bg-white p-2 lg:hidden">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-[#5d787a] text-white"
                          : "text-[#4d6a6d] hover:bg-[#f4efe7]"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

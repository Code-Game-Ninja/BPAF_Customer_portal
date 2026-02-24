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
  Menu,
  X,
  Sun,
  Moon,
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

  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/");
    }
  }, [loading, customer, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Top Nav - Brutalist Box */}
      <header className="bg-card border-b-2 border-border-strong sticky top-0 z-50 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20 lg:h-24">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 border-2 border-transparent hover:border-border-strong bg-muted hover:bg-card text-foreground transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
            >
              <div className="relative w-5 h-5 flex flex-col justify-between overflow-hidden">
                <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0 translate-x-3' : ''}`} />
                <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
              </div>
            </button>
            <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary flex items-center justify-center border-2 border-primary group-hover:bg-background transition-colors">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="text-sm sm:text-base font-black text-foreground tracking-tighter uppercase">BP & AF Insurance</p>
                <div className="h-[2px] w-full bg-border-strong my-0.5 group-hover:bg-primary transition-colors" />
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Customer Portal</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-widest transition-all border-2 ${isActive
                      ? "bg-foreground text-background border-foreground shadow-[4px_4px_0_var(--ring)] translate-x-[-2px] translate-y-[-2px]"
                      : "bg-transparent text-muted-foreground border-transparent hover:border-border-strong hover:text-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 border-2 border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            <div className="hidden sm:flex flex-col items-end px-4 border-r-2 border-l-2 border-border py-1">
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                {customer.name}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {customer.email}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="group flex items-center gap-2 p-2 sm:px-4 sm:py-2.5 border-2 border-transparent text-sm font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all focus:outline-none focus:ring-2 focus:ring-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav - Brutalist Drawer */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${mobileOpen ? 'max-h-96 border-t-2 border-border-strong' : 'max-h-0'}`}
        >
          <nav className="bg-card flex flex-col divide-y-2 divide-border p-4 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 px-4 py-4 text-sm font-black uppercase tracking-[0.15em] transition-all border-2 ${isActive
                      ? "bg-foreground text-background border-foreground translate-x-1"
                      : "bg-muted/50 text-foreground border-transparent hover:border-border-strong hover:bg-card"
                    }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-background' : 'text-primary'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 animate-in slide-in-from-bottom-8 fade-in duration-700">
        {children}
      </main>
    </div>
  );
}

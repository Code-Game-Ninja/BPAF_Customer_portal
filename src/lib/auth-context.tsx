"use client";

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { type User, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export interface CustomerUser {
  uid: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  first_login: boolean;
}

interface AuthContextType {
  user: User | null;
  customer: CustomerUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, customer: null, loading: true,
  signIn: async () => {}, signOut: async () => {}, changePassword: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchCustomerProfile(session.user.id);
        } else {
          setUser(null);
          setCustomer(null);
        }
      } catch (err) {
        console.error("[auth] Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser && event === 'SIGNED_IN') {
        // We only fetch on SIGNED_IN. Session initialize covers the initial load.
        setLoading(true);
        await fetchCustomerProfile(currentUser.id);
        setLoading(false);
      } else if (!currentUser) {
        setCustomer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomerProfile = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_portal_users")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();
        
      if (error || !data) {
        setCustomer(null);
        await supabase.auth.signOut();
        return;
      }
      
      setCustomer({
        uid: authUserId,
        customer_id: data.customer_id,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        is_active: data.is_active ?? true,
        first_login: data.first_login ?? false,
      });
    } catch (err) {
      console.error("[auth] Failed to load customer profile:", err);
      setCustomer(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error("Please enter both email and password.");
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    if (authError || !authData.user) {
      const authCode = authError?.code;
      if (authCode === "email_not_confirmed") {
        throw new Error("Email is not confirmed. Please contact support.");
      }
      if (authCode === "invalid_credentials") {
        throw new Error("Invalid email or password.");
      }
      throw new Error(authError?.message || "Invalid login credentials.");
    }
    
    const { data, error } = await supabase
      .from("customer_portal_users")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single();
      
    if (error || !data) {
      await supabase.auth.signOut();
      throw new Error("This account is not registered as a customer portal user.");
    }
    
    if (!data.is_active) {
      await supabase.auth.signOut();
      throw new Error("Your account has been deactivated. Contact support.");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCustomer(null); 
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error("Not authenticated");
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, customer, loading, signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

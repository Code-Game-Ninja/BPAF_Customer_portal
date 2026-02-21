"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

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
  firebaseUser: User | null;
  customer: CustomerUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  customer: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  changePassword: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch customer portal profile from Firestore
        try {
          const snap = await getDoc(doc(db, "customer_portal_users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setCustomer({
              uid: user.uid,
              customer_id: data.customer_id,
              name: data.name,
              email: data.email,
              phone: data.phone || "",
              is_active: data.is_active ?? true,
              first_login: data.first_login ?? false,
            });
          } else {
            // Not a customer portal user — sign out
            setCustomer(null);
            await firebaseSignOut(auth);
          }
        } catch (err) {
          console.error("[auth] Failed to load customer profile:", err);
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Verify this is a customer
    const snap = await getDoc(doc(db, "customer_portal_users", cred.user.uid));
    if (!snap.exists()) {
      await firebaseSignOut(auth);
      throw new Error("This account is not registered as a customer portal user.");
    }
    if (!snap.data().is_active) {
      await firebaseSignOut(auth);
      throw new Error("Your account has been deactivated. Contact support.");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCustomer(null);
    setFirebaseUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser || !firebaseUser.email) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, customer, loading, signIn, signOut, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

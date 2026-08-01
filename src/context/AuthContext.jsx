import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, logout as firebaseLogout } from "../lib/firebase";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        };
        setUser(profile);
        await syncUserToSupabase(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await firebaseLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

async function syncUserToSupabase(profile) {
  try {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", profile.uid)
      .single();

    if (!data) {
      await supabase.from("users").insert({
        firebase_uid: profile.uid,
        email: profile.email,
        display_name: profile.displayName,
        avatar_url: profile.photoURL,
      });
    }
  } catch {
    // silent — offline or table not created yet
  }
}


import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stop = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return stop;
  }, []);

  const logout = () => signOut(auth);

  const refreshUser = async () => {
    const current = auth.currentUser;

    if (!current) return;

    await current.reload();

    // Refresh React state after Firebase profile changes.
    setUser({
      ...current,
      uid: current.uid,
      email: current.email,
      displayName: current.displayName,
      photoURL: current.photoURL,
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

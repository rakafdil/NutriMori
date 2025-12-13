"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { UserProfile } from "@/types";

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  reloadUserFromStorage: () => void;
  notifyUserStorageChange: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mergeUsers = (
  prev: UserProfile | null,
  next: Partial<UserProfile> | null
) => {
  if (!next) return null;
  if (!prev) return next as UserProfile;
  const merged = { ...prev } as any;
  Object.keys(next).forEach((k) => {
    const v = (next as any)[k];
    if (v !== null && v !== undefined) merged[k] = v;
  });
  return merged as UserProfile;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 1. LAZY INITIALIZATION: Baca localStorage LANGSUNG di sini
  const [user, setUserState] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nutrimori_user");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 2. Set isLoading false jika data user sudah ditemukan saat inisialisasi di atas
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutrimori_user");
      return !saved; // Jika ada data, tidak perlu loading lagi
    }
    return true;
  });

  const setUser = useCallback((u: UserProfile | null) => {
    setUserState(u);
  }, []);

  const reloadUserFromStorage = useCallback(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("nutrimori_user")
          : null;
      const parsed = raw ? JSON.parse(raw) : null;
      setUserState((prev) => mergeUsers(prev, parsed));
    } catch (e) {
      console.error("Failed to reload user from storage", e);
    }
  }, []);

  const notifyUserStorageChange = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nutrimori_user_changed"));
    }
  }, []);

  // Effect untuk memastikan state tersinkronisasi setelah mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("nutrimori_user", JSON.stringify(user));
    } else {
      // Opsional: Hapus jika user null, tapi hati-hati agar tidak menghapus saat refresh
      if (typeof window !== "undefined" && !isLoading) {
        // localStorage.removeItem("nutrimori_user");
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nutrimori_user") {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          setUserState((prev) => mergeUsers(prev, newUser));
        } catch (err) {
          console.error("Failed to parse storage event value", err);
        }
      }
    };

    const handleCustom = () => {
      try {
        const raw = localStorage.getItem("nutrimori_user");
        const newUser = raw ? JSON.parse(raw) : null;
        setUserState((prev) => mergeUsers(prev, newUser));
      } catch (err) {
        console.error("Failed to handle custom user change", err);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("nutrimori_user_changed", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nutrimori_user_changed", handleCustom);
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        reloadUserFromStorage,
        notifyUserStorageChange,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

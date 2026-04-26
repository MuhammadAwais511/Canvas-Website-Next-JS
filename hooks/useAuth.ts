"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredValue, setStoredValue, removeStoredValue } from "@/lib/local-storage";
import type { User } from "@/types/user";

const USERS_KEY = "canvasstudio_users";
const SESSION_KEY = "canvasstudio_session";

type AuthSession = {
  userId: string;
};

export default function useAuth() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = getStoredValue<AuthSession | null>(SESSION_KEY, null);
      const users = getStoredValue<User[]>(USERS_KEY, []);
      setUser(session ? users.find((u) => u.id === session.userId) ?? null : null);
      setReady(true);
    }, 1);
    return () => window.clearTimeout(timer);
  }, []);

  const register = (name: string, email: string, password: string) => {
    const users = getStoredValue<User[]>(USERS_KEY, []);
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email === normalizedEmail)) {
      return { success: false, message: "Email already exists" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: normalizedEmail,
      password,
    };

    const updated = [...users, newUser];

    setStoredValue(USERS_KEY, updated);
    setStoredValue(SESSION_KEY, { userId: newUser.id });

    setUser(newUser);
    return { success: true };
  };

  const login = (email: string, password: string) => {
    const users = getStoredValue<User[]>(USERS_KEY, []);
    const normalizedEmail = email.trim().toLowerCase();

    const found = users.find(
      (u) => u.email === normalizedEmail && u.password === password
    );

    if (!found) {
      return { success: false, message: "Invalid credentials" };
    }

    setStoredValue(SESSION_KEY, { userId: found.id });
    setUser(found);

    return { success: true };
  };

  const logout = () => {
    removeStoredValue(SESSION_KEY);
    setUser(null);
    router.push("/login");
  };

  return { user, login, register, logout, ready };
}
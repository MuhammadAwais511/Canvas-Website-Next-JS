"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import useAuth from "@/hooks/useAuth";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Canvas", href: "/canvas" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting to prevent hydration mismatch with theme
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 1);
    return () => window.clearTimeout(timer);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = window.setTimeout(() => setMenuOpen(false), 1);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  if (!ready) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 h-16 animate-pulse bg-slate-950" />
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      setMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return "🌙";
    return theme === "dark" ? "☀️" : "🌙";
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300 transition-all hover:text-cyan-200"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20 transition-all group-hover:scale-105 group-hover:bg-cyan-400/25">
              CS
            </span>
            <span className="hidden sm:inline">Canvas Studio</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-2xl bg-white/5 text-slate-200 transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>

            {/* Auth - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-gradient-to-r from-cyan-400/10 to-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-all hover:from-cyan-400/20 hover:to-cyan-500/20"
                  >
                    {user.name}
                  </Link>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:from-cyan-500 hover:to-cyan-600 hover:shadow-lg hover:shadow-cyan-500/25"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="md:hidden h-10 w-10 rounded-2xl bg-white/5 text-slate-200 transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300 md:hidden ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed right-0 top-16 z-40 h-[calc(100vh-4rem)] w-full max-w-sm transform bg-slate-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex-1 px-4 py-6">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 text-base font-medium transition-all ${
                    pathname === item.href
                      ? "bg-cyan-400/10 text-cyan-300"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              {user ? (
                <div className="space-y-2">
                  <div className="rounded-lg bg-white/5 px-4 py-3">
                    <p className="text-sm text-slate-400">Logged in as</p>
                    <p className="font-medium text-cyan-300">{user.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-red-500/10 px-4 py-3 text-left text-base font-medium text-red-400 transition-all hover:bg-red-500/20"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block rounded-lg border border-white/10 px-4 py-3 text-center text-base font-medium text-slate-300 transition-all hover:bg-white/5"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-3 text-center text-base font-semibold text-slate-950 transition-all hover:from-cyan-500 hover:to-cyan-600"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
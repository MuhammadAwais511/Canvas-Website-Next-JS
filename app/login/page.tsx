"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) {
      router.replace("/canvas");
    }
  }, [ready, user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const result = login(email, password);
    if (!result.success) {
      setError(result.message || "Invalid email or password.");
      return;
    }
    router.push("/canvas");
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="rounded-[32px] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
      >
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Sign in</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Welcome back to Canvas Studio.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Log in to continue your local drawing workflow and open your saved canvases.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          {error ? <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
          <label className="grid gap-2 text-sm text-slate-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400/80"
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400/80"
              placeholder="Enter your password"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          New to Canvas Studio?{' '}
          <Link href="/register" className="font-medium text-white hover:text-cyan-300">
            Create an account
          </Link>
          .
        </p>
      </motion.section>
    </div>
  );
}

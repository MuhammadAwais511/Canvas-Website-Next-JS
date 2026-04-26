"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CanvasWorkspace from "@/components/CanvasWorkspace";
import useAuth from "@/hooks/useAuth";

export default function CanvasPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready) {
    return <div className="min-h-[60vh] rounded-4xl bg-slate-900/70 p-10 text-slate-300">Loading your studio...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="space-y-8"
    >
      <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Creative workspace</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Your private Canvas Studio.</h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-300">
            Draw, erase, shape, save, and export — all from your browser with a premium illustration experience.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="rounded-4xl bg-slate-900/80 p-8 text-slate-300">Loading canvas...</div>}>
        <CanvasWorkspace />
      </Suspense>
    </motion.div>
  );
}

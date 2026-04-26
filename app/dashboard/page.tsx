"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useAuth from "@/hooks/useAuth";
import { fetchSavedCanvases, removeSavedCanvas, updateSavedCanvas } from "@/lib/canvas-storage";
import type { SavedCanvas } from "@/types/canvas";

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [savedList, setSavedList] = useState<SavedCanvas[]>([]);
  const [search, setSearch] = useState("");
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setSavedList(fetchSavedCanvases()), 1);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const filteredList = useMemo(() => {
    return savedList.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  }, [savedList, search]);

  const handleDelete = (id: string) => {
    const next = removeSavedCanvas(id);
    setSavedList(next);
  };

  const handleRename = (id: string) => {
    setActiveEdit(id);
    const item = savedList.find((canvas) => canvas.id === id);
    setTitleInput(item?.title ?? "");
  };

  const handleSaveRename = () => {
    if (!activeEdit) return;
    const next = updateSavedCanvas(activeEdit, { title: titleInput.trim() || "Untitled sketch" });
    setSavedList(next);
    setActiveEdit(null);
  };

  const openCanvas = (id: string) => {
    router.push(`/canvas?load=${id}`);
  };

  if (!ready) {
    return <div className="min-h-[60vh] rounded-[32px] bg-slate-900/70 p-10 text-slate-300">Loading your sketches...</div>;
  }

  if (!user) {
    return <div className="p-10 text-slate-300">Redirecting...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Saved sketches</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/canvas")}
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            New canvas
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Manage saved work</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Rename, delete, or open any of your stored canvas sketches.</p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search saved sketches"
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/80 sm:w-72"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/15 bg-slate-900/80 p-10 text-center text-slate-400">
            No saved canvases yet. Create a drawing and save it from the Canvas page.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredList.map((canvas) => (
              <div key={canvas.id} className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">{canvas.createdAt ? new Date(canvas.createdAt).toLocaleDateString() : "Saved sketch"}</p>
                    {activeEdit === canvas.id ? (
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={titleInput}
                          onChange={(event) => setTitleInput(event.target.value)}
                          className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400/80"
                        />
                        <button type="button" onClick={handleSaveRename} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="mt-3 text-xl font-semibold text-white">{canvas.title}</h3>
                    )}
                    <p className="mt-2 text-sm leading-6 text-slate-400">Updated {new Date(canvas.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openCanvas(canvas.id)}
                      className="rounded-full bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRename(canvas.id)}
                      className="rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700/80"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(canvas.id)}
                      className="rounded-full bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    title: "Draw and build fast",
    description: "Sketch with smooth brushes, eraser, and shape tools in a polished canvas workspace.",
  },
  {
    title: "Local storage only",
    description: "All user profiles, saved art, and sessions stay on your device with no external backend.",
  },
  {
    title: "Modern workflow",
    description: "Undo, redo, export PNG, and manage multiple saved canvases like a professional studio.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.16),_transparent_28%)]" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 ring-1 ring-cyan-300/20">
              Premium local canvas studio
            </span>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Create beautiful digital art in a modern browser studio.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Canvas Studio is a polished, fully local drawing app with auth, saved work, undo/redo, export, and theme persistence.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Start drawing
              </Link>
              <Link href="/canvas" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:border-cyan-300/40 hover:bg-white/10">
                Open canvas
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Fast tools</p>
                <p className="mt-3 text-lg font-semibold text-white">Brush, eraser, shapes</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Saved work</p>
                <p className="mt-3 text-lg font-semibold text-white">Dashboard with full edit flow</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">No external backend</p>
                <p className="mt-3 text-lg font-semibold text-white">LocalStorage auth and canvas storage</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Responsive UI</p>
                <p className="mt-3 text-lg font-semibold text-white">Touch friendly studio for desktop and tablet</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="about" className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-6 rounded-[32px] border border-white/10 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
        >
          <span className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">About Canvas Studio</span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">A modern, local-first drawing workspace.</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This app is built as a polished SaaS-style studio with authentication, saved sketches, and a premium interface — all powered by your browser.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950/70 p-5 ring-1 ring-white/10">
              <p className="text-sm text-slate-300">Local auth and session persistence</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-5 ring-1 ring-white/10">
              <p className="text-sm text-slate-300">Smooth motion, adaptive layout, refined spacing</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="grid gap-6"
        >
          {features.map((feature) => (
            <div key={feature.title} className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <p className="text-lg font-semibold text-white">{feature.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="contact" className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[32px] border border-white/10 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
        >
          <h2 className="text-3xl font-semibold text-white">Ready to start your next sketch?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Sign in or register to access the canvas studio instantly. All drawings are saved locally and can be exported as PNG.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Register now
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white transition hover:border-cyan-300/40 hover:bg-white/10">
              Login to continue
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-[32px] border border-white/10 bg-slate-950/70 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
        >
          <div className="grid gap-6">
            <div className="rounded-3xl bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Studio support</p>
              <p className="mt-3 text-lg text-white">No internet backend required.</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Experience</p>
              <p className="mt-3 text-lg text-white">Responsive, animated, and easy to use.</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Contact</p>
              <p className="mt-3 text-lg text-white">Write directly to support for feedback and questions.</p>
              <a
                href="mailto:hello@canvasstudio.app?subject=Canvas%20Studio%20Feedback"
                className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Email support
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-8 rounded-[32px] border border-white/10 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="space-y-4">
          <span className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Why Canvas Studio</span>
          <h2 className="text-3xl font-semibold text-white">Designed for creative work with clear, fast tools.</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Draw with precision, manage saved sketches, and export your best pieces without leaving the browser. Whether you are practicing concepts or refining polished artwork, Canvas Studio keeps it simple and local.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Fast workflow</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Tool presets, quick save, and instant PNG export.</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Local freedom</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">No remote database, no external tracking.</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Polished UX</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Responsive layout, clean spacing, and smooth motion.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

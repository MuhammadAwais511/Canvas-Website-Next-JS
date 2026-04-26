"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Support",
    heading: "No data leaves your device.",
    desc: "If you have feedback or want to improve the experience, simply update the app and refresh the page.",
  },
  {
    title: "Explore",
    heading: "Try the canvas tools.",
    desc: "Visit Canvas or Dashboard after logging in to see undo/redo, save management, and export workflows in action.",
  },
];

export default function ContactPage() {
  return (
    <div className="space-y-10">
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-[32px] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
      >
        <span className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Contact
        </span>

        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Let’s keep the studio polished.
        </h1>

        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Canvas Studio is a portfolio-ready design for a browser-first creative tool. Use the app for local sketches, save your work, and export clean PNG artwork with ease.
        </p>
      </motion.section>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-[28px] border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20 backdrop-blur-xl"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              {item.title}
            </p>

            <p className="mt-4 text-lg font-semibold text-white">
              {item.heading}
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Contact
        </p>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          For feedback, bug reports, or design ideas, send a message to the Canvas Studio support address.
        </p>

        <a
          href="mailto:yourrealemail@gmail.com"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Email support
        </a>
      </div>
    </div>
  );
}
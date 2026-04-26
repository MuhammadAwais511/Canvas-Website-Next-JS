"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const features = [
  {
    heading: "Secure local auth",
    description: "Register and login from your browser. Session state is stored in localStorage and no external service is required.",
    icon: "🔐",
    gradient: "from-cyan-400/20 to-blue-400/20",
  },
  {
    heading: "Saved sketches",
    description: "Create, rename, delete, and open multiple saved canvases from your dashboard.",
    icon: "💾",
    gradient: "from-purple-400/20 to-pink-400/20",
  },
  {
    heading: "Simple export",
    description: "Download finished drawings as PNG or resume work later without leaving the app.",
    icon: "📸",
    gradient: "from-green-400/20 to-emerald-400/20",
  },
  {
    heading: "Responsive studio",
    description: "Touch-friendly controls and adaptive layout for desktop, tablet, and mobile devices.",
    icon: "📱",
    gradient: "from-orange-400/20 to-red-400/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 1);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-10">
            <div className="h-96 animate-pulse rounded-[32px] bg-slate-900/50" />
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[28px] bg-slate-900/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-12"
        >
          {/* Hero Section */}
          <motion.section
            variants={itemVariants}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all hover:shadow-cyan-500/5 sm:p-12"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            
            <div className="relative">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-cyan-300/80"
              >
                <span className="h-px w-8 bg-cyan-400/50" />
                About
              </motion.span>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Why Canvas Studio exists.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 max-w-3xl space-y-4"
              >
                <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
                  Canvas Studio is designed to feel like a premium creative tool without requiring any 
                  server infrastructure. It is perfect for quick sketches, visual brainstorming, and 
                  local art journaling.
                </p>

                <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
                  Every feature is built around responsive interactions, polished motion, and a modern 
                  glassmorphism aesthetic so the interface feels intuitive and professional.
                </p>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            </div>
          </motion.section>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            className="grid gap-6 md:grid-cols-2"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.heading}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${feature.gradient} bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl`}
              >
                {/* Icon */}
                <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                
                <h2 className="text-xl font-semibold text-white">
                  {feature.heading}
                </h2>
                
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {feature.description}
                </p>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl transition-all duration-300 hover:shadow-cyan-500/10 sm:p-10"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to create your first canvas?
                </h2>
                <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
                  Register or login to begin a polished drawing workflow with local data persistence.
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 px-8 py-4 text-base font-semibold text-slate-950 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:from-cyan-500 hover:to-cyan-600"
                >
                  <span className="relative z-10">Get started</span>
                  <motion.span
                    className="absolute inset-0 z-0 bg-gradient-to-r from-cyan-500 to-cyan-600"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
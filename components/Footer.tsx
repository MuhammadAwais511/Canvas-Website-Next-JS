export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90 px-4 py-10 text-slate-400 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Canvas Studio. Built with Next.js, TypeScript, Tailwind, and localStorage.</p>
        <p className="text-slate-500">No backend, no database — all art stays in your browser.</p>
      </div>
    </footer>
  );
}

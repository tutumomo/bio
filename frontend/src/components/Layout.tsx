import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-3 max-w-[1600px] mx-auto">
          <span className="text-xl font-bold tracking-tighter text-[#002045]">
            Helix Bio
          </span>
        </div>
      </header>
      <main className="pt-20 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ bedCount }: { bedCount?: { occupied: number; total: number } }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg">AMSH ER</Link>
        <span className="text-slate-500">|</span>
        <Link href="/" className={`text-sm hover:text-white ${pathname === "/" ? "text-white" : "text-slate-400"}`}>Dashboard</Link>
        <Link href="/patients" className={`text-sm hover:text-white ${pathname === "/patients" ? "text-white" : "text-slate-400"}`}>Patient Log</Link>
        {(session?.user as any)?.role === "ADMIN" && (
          <Link href="/admin/doctors" className={`text-sm hover:text-white ${pathname === "/admin/doctors" ? "text-white" : "text-slate-400"}`}>Manage Doctors</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {bedCount && (
          <span className="bg-emerald-600 text-xs px-2 py-1 rounded-full">{bedCount.occupied}/{bedCount.total} beds occupied</span>
        )}
        <span className="text-sm text-slate-300">{session?.user?.name}</span>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-slate-400 hover:text-white">Sign out</button>
      </div>
    </nav>
  );
}

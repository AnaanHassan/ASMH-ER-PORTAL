"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar({ bedCount }: { bedCount?: { occupied: number; total: number } }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const linkClass = (path: string) =>
    `text-sm px-3 py-1.5 rounded transition-colors ${
      pathname === path
        ? "text-white font-medium border-b-2"
        : "text-white/70 hover:text-white"
    }`;

  const activeBorder = { borderColor: "#2EC4B6" };

  return (
    <nav className="text-white px-5 py-3 flex items-center justify-between" style={{ backgroundColor: "#1B4965" }}>
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="AMSH" width={32} height={32} className="object-contain" />
          <span className="font-bold text-lg tracking-tight">AMSH ER</span>
        </Link>
        <div className="w-px h-5 bg-white/20" />
        <Link href="/" className={linkClass("/")} style={pathname === "/" ? activeBorder : undefined}>Dashboard</Link>
        <Link href="/patients" className={linkClass("/patients")} style={pathname === "/patients" ? activeBorder : undefined}>Patient Log</Link>
        {(session?.user as any)?.role === "ADMIN" && (
          <Link href="/admin/doctors" className={linkClass("/admin/doctors")} style={pathname === "/admin/doctors" ? activeBorder : undefined}>Manage Doctors</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {bedCount && (
          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#2EC4B6", color: "#FFFFFF" }}>
            {bedCount.occupied}/{bedCount.total} beds
          </span>
        )}
        <span className="text-sm text-white/80">{session?.user?.name}</span>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-white/50 hover:text-white transition-colors">
          Sign out
        </button>
      </div>
    </nav>
  );
}

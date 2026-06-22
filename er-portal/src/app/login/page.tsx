"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.error) { setError("Invalid username or password"); setLoading(false); }
    else { router.push("/"); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F0F4F8" }}>
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo.png" alt="AMSH Logo" width={100} height={100} className="object-contain" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1A202C" }}>Dr. Abdul Samad Memorial Hospital</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Emergency & Trauma Department</p>
          <p className="text-xs font-semibold mt-3 tracking-wider uppercase" style={{ color: "#2EC4B6" }}>ER Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A202C" }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{ "--tw-ring-color": "#2EC4B6" } as React.CSSProperties}
              required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A202C" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{ "--tw-ring-color": "#2EC4B6" } as React.CSSProperties}
              required />
          </div>
          {error && <p className="text-sm font-medium" style={{ color: "#E74C3C" }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1B4965" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

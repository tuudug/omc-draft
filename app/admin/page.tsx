"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, List, LogOut } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAdmin();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-300">
              Manage tournament stages and matches
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/stages"
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 hover:scale-105 transition-transform duration-200 shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Create Stage
            </h2>
            <p className="text-gray-200 text-center">
              Set up tournament stages with map pools
            </p>
          </Link>

          <Link
            href="/admin/matches"
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-8 hover:scale-105 transition-transform duration-200 shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <List className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Create Match
            </h2>
            <p className="text-gray-200 text-center">
              Set up matches and generate draft links
            </p>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Trophy, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-pink-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            osu! Mongolia Cup 2025
          </h1>
          <p className="text-xl text-gray-300">Tournament Draft System</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Link
            href="/admin/login"
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 hover:scale-105 transition-transform duration-200 shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Admin Panel
            </h2>
            <p className="text-gray-200 text-center">
              Create stages and matches (password required)
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Tournament admins can create stages and matches here
          </p>
          <p className="text-gray-400 text-sm">
            Captains will receive unique links to conduct the draft phase
          </p>
        </div>
      </div>
    </div>
  );
}

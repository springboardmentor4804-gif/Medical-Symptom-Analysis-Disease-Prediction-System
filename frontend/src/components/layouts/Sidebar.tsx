"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  adminNavigation,
  doctorNavigation,
  patientNavigation,
} from "@/constants/navigation";

import { authStorage } from "@/lib/authStorage";

export default function Sidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = authStorage.getRole();

    if (userRole) {
      setRole(userRole);
    }
  }, []);

  let navigation = patientNavigation;

  if (role.toLowerCase() === "admin") {
    navigation = adminNavigation;
  } else if (role.toLowerCase() === "doctor") {
    navigation = doctorNavigation;
  }

  return (
    <aside className="flex h-screen w-72 flex-col bg-sky-900 text-white shadow-xl">
      {/* Logo */}
      <div className="border-b border-sky-800 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-wide">
          🩺 MedAssist AI
        </h1>

        <p className="mt-1 text-sm text-sky-200">
          Smart Healthcare Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "bg-white text-sky-900 font-semibold shadow-md"
                  : "text-sky-100 hover:bg-sky-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sky-800 p-4">
        <button
          onClick={() => {
            authStorage.clear();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sky-100 transition-all duration-200 hover:bg-red-600 hover:text-white"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
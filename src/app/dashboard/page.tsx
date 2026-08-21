/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { API_URL } from "@/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  User,
  History,
  Stethoscope,
  FileText,
  LogOut,
  Menu,
  X,
  Heart,
  TrendingUp,
  Search,
  Bell,
  Settings,
  Sparkles,
  Sun,
  Moon,
  HelpCircle,
  Users,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import DashboardSummary from "@/components/dashboard/patient-dashboard/DashboardSummary";
import DoctorDashboard from "@/components/dashboard/doctor-dashboard/DoctorDashboard";
import ProfileManagement from "@/components/dashboard/patient-dashboard/ProfileManagement";
import MedicalHistory from "@/components/dashboard/patient-dashboard/MedicalHistory";
import SymptomAnalysis from "@/components/dashboard/patient-dashboard/SymptomAnalysis";
import HealthReports from "@/components/dashboard/patient-dashboard/HealthReports";
import SystemPerformance from "@/components/dashboard/doctor-dashboard/SystemPerformance";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
  age?: number;
  sex?: string;
  phone?: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  chronicConditions?: string[];
  allergies?: string[];
  medications?: string[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  medicalHistory?: Array<{
    date: string;
    condition: string;
    notes: string;
    type: string;
    details?: any;
    approvalStatus?: "approved" | "disapproved";
    doctorNotes?: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch full profile info from backend
  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const fullData = await response.json();
        setUser(fullData);
      } else {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync profile with server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserStr = localStorage.getItem("user");
    if (!storedUserStr) {
      toast.error("Please login to access the dashboard.");
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;
      if (!token) {
        toast.error("Invalid session. Please login.");
        router.push("/login");
        return;
      }
      fetchProfile(token);
    } catch (e) {
      toast.error("Session error.");
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleToggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toast.success(`${isDark ? "Dark" : "Light"} mode enabled`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for "${searchQuery}"...`);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Successfully logged out.");
    router.push("/login");
  };

  const handleProfileUpdate = (updatedUser: UserData) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <Heart className="absolute h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-semibold text-muted-foreground animate-pulse">
          Loading health ecosystem...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const navigationItems =
    user.role === "doctor"
      ? [
          { id: "dashboard", name: "Patient Files", icon: Users },
          { id: "ai-diagnostics", name: "AI Diagnostics", icon: Brain },
          { id: "clinical-advisory", name: "Clinical Advisory", icon: ShieldCheck },
          { id: "history-timeline", name: "History Timeline", icon: History },
          { id: "profile", name: "Profile Management", icon: User },
          { id: "performance", name: "Health Insights", icon: TrendingUp },
        ]
      : [
          { id: "dashboard", name: "Dashboard", icon: Activity },
          { id: "profile", name: "Profile Management", icon: User },
          { id: "medical-history", name: "Medical History", icon: History },
          { id: "symptoms", name: "Symptom Analysis", icon: Stethoscope },
          { id: "reports", name: "Health Reports", icon: FileText },
          { id: "performance", name: "Health Insights", icon: TrendingUp },
        ];

  return (
    <div className="h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col md:flex-row text-foreground font-sans antialiased p-0 md:p-6 gap-6 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200/40 dark:border-slate-800/40 rounded-[28px] shrink-0 p-6 justify-between shadow-apple relative overflow-hidden group">
        <div className="space-y-8 z-10 relative">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Heart className="h-5 w-5 fill-white/10" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block text-slate-850 dark:text-white">
                MedAssist AI
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Health Companion
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.01]"
                      : "text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-transform ${isActive ? "scale-110" : ""}`}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-6 z-10 relative">
          {/* Promo Upgrade Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-850 dark:to-slate-800 rounded-2xl border border-blue-100/50 dark:border-slate-850 shadow-sm relative overflow-hidden group/promo">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover/promo:scale-125 transition-transform" />
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Sparkles className="h-4 w-4 fill-blue-500/10" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                Premium Access
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Unlock unlimited AI consults and real-time medical reports.
            </p>
            <Button
              onClick={() => toast.success("MedAssist Premium Trial activated!")}
              className="w-full h-8 text-[11px] font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all border-none cursor-pointer"
            >
              Upgrade Now
            </Button>
          </div>

          {/* User Card & Logout */}
          <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-850 dark:text-white font-bold text-sm border border-slate-200/50 dark:border-slate-700/50">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)
                  : "P"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-slate-850 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-5 text-xs font-semibold cursor-pointer border border-transparent hover:border-rose-100/50 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header / Sidebar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
            <Heart className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold text-lg text-slate-850 dark:text-white">MedAssist AI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 rounded-r-[28px]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                    <Heart className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-lg text-slate-850 dark:text-white">
                    MedAssist AI
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                          : "text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-105 dark:bg-slate-800 flex items-center justify-center text-slate-850 dark:text-white font-bold text-xs">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                    : "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-slate-850 dark:text-white">
                    {user.name}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-3 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-5 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Top Floating Navigation */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200/40 dark:border-slate-800/40 rounded-3xl shadow-apple">
          {/* Rounded search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search metrics, reports, analysis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/40 dark:border-slate-800 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-slate-350 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </form>

          {/* Widgets */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success("No new notifications.")}
              className="h-10 w-10 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors relative cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
            </button>
            <button
              onClick={handleToggleTheme}
              className="h-10 w-10 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <Sun className="h-4.5 w-4.5 block dark:hidden" />
              <Moon className="h-4.5 w-4.5 hidden dark:block" />
            </button>
            <button
              onClick={() => toast.info("Settings panel coming soon.")}
              className="h-10 w-10 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-850 mx-1" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)
                  : "P"}
              </div>
            </div>
          </div>
        </header>

        {/* Main page content layout with consistent structure */}
        <main className="flex-1 overflow-y-auto bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/20 rounded-[28px] p-6 md:p-8 shadow-apple flex flex-col gap-6">
          {/* Tab Components */}
          <div className="transition-all duration-300 flex-1">
            {(activeTab === "dashboard" ||
              activeTab === "ai-diagnostics" ||
              activeTab === "clinical-advisory" ||
              activeTab === "history-timeline" ||
              activeTab === "profile" ||
              activeTab === "performance") &&
            user.role === "doctor" ? (
              <DoctorDashboard
                user={user}
                activeTab={activeTab}
                selectedPatient={selectedPatient}
                setSelectedPatient={setSelectedPatient}
              />
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <DashboardSummary user={user} setActiveTab={setActiveTab} />
                )}
                {activeTab === "profile" && (
                  <ProfileManagement user={user} onUpdate={handleProfileUpdate} />
                )}
                {activeTab === "medical-history" && (
                  <MedicalHistory user={user} onUpdate={handleProfileUpdate} />
                )}
                {activeTab === "symptoms" && (
                  <SymptomAnalysis user={user} onUpdate={handleProfileUpdate} />
                )}
                {activeTab === "reports" && <HealthReports user={user} />}
                {activeTab === "performance" && <SystemPerformance />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

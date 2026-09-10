import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Activity, 
  Stethoscope, 
  User, 
  Calendar, 
  History, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenLogin, onOpenRegister, onNavigateHome }) {
  const { currentUser, isDoctor, isPatient, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const patientTabs = [
    { id: 'checker', label: 'Symptom Checker & AI Diagnosis', icon: Activity },
    { id: 'history', label: 'Clinical History', icon: History },
    { id: 'booking', label: 'Book Specialist', icon: Calendar },
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'profile', label: 'Patient Profile', icon: User }
  ];

  const doctorTabs = [
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'patients', label: 'Assigned Patients & Triage', icon: Users },
    { id: 'appointments', label: 'Appointment Requests', icon: Calendar },
    { id: 'profile', label: 'Provider Profile', icon: Stethoscope }
  ];

  const tabs = isDoctor ? doctorTabs : patientTabs;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - clicks to home */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left focus:outline-none group"
            title="MedAssist AI Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-brand-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  MedAssist <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI</span>
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isDoctor
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isDoctor ? 'Provider Portal' : 'Patient Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Clinical Symptom Analysis & Predictive Triage
              </p>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDoctor ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="hidden md:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
                      {isDoctor ? (currentUser.specialization || 'Physician') : 'Patient MRN-Verified'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <ShieldCheck className="w-3 h-3" />
                        JWT Authenticated Session
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Account Profile & Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {currentUser && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-700"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  Account Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-50 text-xs font-bold text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

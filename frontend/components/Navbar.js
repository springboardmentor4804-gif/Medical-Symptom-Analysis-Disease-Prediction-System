'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Navbar() {
  const { token, role, logout } = useAuth();
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const renderNavLink = (path, label) => {
    const active = isActive(path);
    return (
      <Link
        key={path}
        href={path}
        className="relative text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200"
      >
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-xs"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className={`relative z-10 font-semibold ${active ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-2xl px-4 sm:px-8 py-3 transition-all duration-300 shadow-[0_4px_25px_rgba(15,23,42,0.06)]"
      style={{
        backgroundColor: 'var(--navbar-bg)',
        borderColor: 'var(--navbar-border)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20"
          >
            M
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-emerald-700 dark:text-emerald-400">MedAssist</span>
              <span className="text-slate-500 dark:text-slate-400 ml-1 text-xs font-bold uppercase tracking-widest">AI</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase hidden sm:block">Clinical Intelligence</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {token ? (
            <>
              {role === 'patient' && (
                <>
                  {renderNavLink('/dashboard', 'Dashboard')}
                  {renderNavLink('/dashboard/symptoms', 'Submit Symptoms')}
                  {renderNavLink('/dashboard/prediction', 'AI Assessment')}
                  {renderNavLink('/dashboard/history', 'History Log')}
                  {renderNavLink('/dashboard/profile', 'Profile')}
                </>
              )}
              {role === 'admin' && renderNavLink('/admin', 'Admin Dashboard')}
              {role === 'doctor' && renderNavLink('/doctor', 'Doctor Portal')}
              {role === 'clinic' && renderNavLink('/clinic', 'Clinic Portal')}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/login"
                  className="text-sm font-semibold px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all duration-200"
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2 rounded-full shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
                >
                  Register
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center gap-3">
          {token && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 capitalize shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {role}
            </span>
          )}

          {mounted && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200 shadow-xs"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.button>
          )}

          {token && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="hidden sm:inline-flex text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3.5 py-2 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200"
            >
              Sign Out
            </motion.button>
          )}

          {/* Mobile Menu Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2"
          >
            {token ? (
              <>
                {role === 'patient' && (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/symptoms" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      Submit Symptoms
                    </Link>
                    <Link href="/dashboard/prediction" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      AI Assessment
                    </Link>
                    <Link href="/dashboard/history" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      History Log
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      Profile
                    </Link>
                  </>
                )}
                {role === 'admin' && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    Admin Dashboard
                  </Link>
                )}
                {role === 'doctor' && (
                  <Link href="/doctor" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    Doctor Portal
                  </Link>
                )}
                {role === 'clinic' && (
                  <Link href="/clinic" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    Clinic Portal
                  </Link>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 capitalize">
                    Role: {role}
                  </span>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3.5 py-1.5 rounded-full"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm font-semibold px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-full shadow-md">
                  Register
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

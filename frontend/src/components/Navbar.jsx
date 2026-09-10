import React from 'react';
import { Activity, LogOut, User, Stethoscope, ShieldCheck, UserCheck, Key, RefreshCw } from 'lucide-react';
import { db } from '../services/db';

export default function Navbar({ currentUser, onLogout, onSwitchAccount }) {
  const handleQuickSwitch = (username) => {
    const user = db.loginUser(username, 'password123');
    if (user) {
      window.location.reload();
    }
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} className="pulse-icon" />
          </div>
          <div>
            <span className="brand-title">Medi<span className="text-highlight">AI</span></span>
            <span className="brand-subtitle">AI Medical Assistance & Telehealth</span>
          </div>
        </div>

        {/* Quick Role Switcher Bar */}
        {currentUser && (
          <div className="quick-role-switcher flex-gap align-items-center">
            <span className="text-xs text-muted font-bold">Quick View:</span>
            
            <button
              type="button"
              onClick={() => handleQuickSwitch('alex_patient')}
              className={`btn-xs ${currentUser.role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
              title="Switch to Patient Dashboard"
            >
              <UserCheck size={13} /> Patient View
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('dr_sarah')}
              className={`btn-xs ${currentUser.role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
              title="Switch to Doctor Dashboard (Dr. Sarah)"
            >
              <Stethoscope size={13} /> Doctor View
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('admin')}
              className={`btn-xs ${currentUser.role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              title="Switch to Admin Dashboard"
            >
              <ShieldCheck size={13} /> Admin View
            </button>
          </div>
        )}

        {/* User Info & Actions */}
        {currentUser && (
          <div className="user-profile-nav">
            <div className="user-info">
              <span className="user-name">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              <div className="badge-group">
                <span className={`role-badge ${currentUser.role}`}>
                  {currentUser.role === 'doctor' ? <Stethoscope size={12} /> : <ShieldCheck size={12} />}
                  {currentUser.role === 'doctor' ? `Dr. ${currentUser.specialty || 'General'}` : currentUser.role}
                </span>
                <span className="username-tag">@{currentUser.username}</span>
              </div>
            </div>

            <button onClick={onLogout} className="btn-danger btn-sm" title="Log Out">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

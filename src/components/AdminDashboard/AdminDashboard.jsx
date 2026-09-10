import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT, API_BASE } from '../../services/db';
import AnalyticsDashboard from './AnalyticsDashboard';
import { ShieldCheck, Users, Stethoscope, CheckCircle2, Clock, Eye, EyeOff, Trash2, Key, Mail, Calendar, UserCheck, AlertTriangle, FileText, Pill, ChevronDown, ChevronUp, Download, Printer } from 'lucide-react';


export default function AdminDashboard({ currentUser }) {
  const [stats, setStats] = useState({
    patientCount: 0,
    doctorCount: 0,
    reviewedCount: 0,
    pendingCount: 0
  });

  const [allUsers, setAllUsers] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'patient' | 'doctor' | 'admin'
  const [selectedReportCase, setSelectedReportCase] = useState(null);
  const [msg, setMsg] = useState('');

  const refreshAdminData = async () => {
    // 1. INSTANT PASS (0ms): Load local data immediately
    setStats(db.getAdminStats());
    setAllUsers(db.getUsers());
    setAllCases(db.getCases());

    // 2. BACKGROUND ASYNC PASS: Non-blocking sync with backend API
    try {
      const [apiUsers, apiStats] = await Promise.all([
        fetch(`${API_BASE}/users`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/admin/stats`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (Array.isArray(apiUsers) && apiUsers.length > 0) {
        const localUsers = db.getUsers();
        const mergedMap = {};
        localUsers.forEach(u => { const k = (u.username || '').toLowerCase() || u.id || u._id; if (k) mergedMap[k] = u; });
        apiUsers.forEach(u => { const k = (u.username || '').toLowerCase() || u.id || u._id; if (k) mergedMap[k] = { ...mergedMap[k], ...u }; });
        const merged = Object.values(mergedMap);
        setAllUsers(merged);
      }

      if (apiStats) {
        setStats(prev => ({
          ...prev,
          ...apiStats
        }));
      }
    } catch (err) {
      console.warn('Notice loading background admin stats:', err);
    }
  };

  useEffect(() => {
    refreshAdminData();

    const handleSync = () => {
      refreshAdminData();
    };

    window.addEventListener(CASES_UPDATED_EVENT, handleSync);
    window.addEventListener('casesUpdated', handleSync);
    window.addEventListener('usersUpdated', handleSync);
    window.addEventListener('medi_ai_users_updated', handleSync);
    return () => {
      window.removeEventListener(CASES_UPDATED_EVENT, handleSync);
      window.removeEventListener('casesUpdated', handleSync);
      window.removeEventListener('usersUpdated', handleSync);
      window.removeEventListener('medi_ai_users_updated', handleSync);
    };
  }, []);

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleDeleteUser = (userId, username) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own active Admin account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user @${username}?`)) {
      db.deleteUser(userId);
      setMsg(`User @${username} deleted successfully.`);
      setTimeout(() => setMsg(''), 3000);
      refreshAdminData();
    }
  };

  const filteredUsers = allUsers.filter(u => {
    if (userRoleFilter === 'all') return true;
    return u.role === userRoleFilter;
  });

  // Get reviewed cases with their doctor suggestions
  const reviewedCases = allCases.filter(c => c.status === 'Reviewed').map(c => {
    const suggs = db.getCaseSuggestions(c.id);
    return {
      caseInfo: c,
      suggestion: suggs.length > 0 ? suggs[0] : null
    };
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return '#f43f5e';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <div className="admin-dashboard-container fade-in">
      {/* Admin Header */}
      <div className="card glass-panel admin-hero-card margin-bottom">
        <div className="admin-hero-header">
          <div className="admin-avatar">
            <ShieldCheck size={32} color="#06b6d4" />
          </div>
          <div>
            <h2>MediAI System Administration</h2>
            <p className="card-subtitle">
              System Metrics, Doctor Consultation Prescriptions & User Credential Audit Directory
            </p>
          </div>
        </div>
      </div>

      {msg && <div className="alert-banner alert-success">{msg}</div>}

      {/* --- REAL ANALYTICS DASHBOARD SECTION --- */}
      <AnalyticsDashboard />

      {/* --- SECTION 1: STATS OVERVIEW METRICS CARDS --- */}

      <div className="admin-stats-grid margin-bottom">
        {/* 1. Number of Patients */}
        <div className="admin-stat-card cyan">
          <div className="stat-card-icon">
            <Users size={24} color="#06b6d4" />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Number of Patients</span>
            <h3 className="stat-card-value">{stats.patientCount}</h3>
            <span className="stat-card-sub">Registered Patients</span>
          </div>
        </div>

        {/* 2. Number of Doctors */}
        <div className="admin-stat-card purple">
          <div className="stat-card-icon">
            <Stethoscope size={24} color="#a855f7" />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Number of Doctors</span>
            <h3 className="stat-card-value">{stats.doctorCount}</h3>
            <span className="stat-card-sub">Licensed Specialists</span>
          </div>
        </div>

        {/* 3. Number of Cases Reviewed */}
        <div className="admin-stat-card green">
          <div className="stat-card-icon">
            <CheckCircle2 size={24} color="#10b981" />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Cases Reviewed</span>
            <h3 className="stat-card-value">{stats.reviewedCount}</h3>
            <span className="stat-card-sub">Prescribed & Resolved</span>
          </div>
        </div>

        {/* 4. Number of Cases Pending */}
        <div className="admin-stat-card gold">
          <div className="stat-card-icon">
            <Clock size={24} color="#eab308" />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Cases Pending</span>
            <h3 className="stat-card-value">{stats.pendingCount}</h3>
            <span className="stat-card-sub">Awaiting Evaluation</span>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: REVIEWED PATIENT CONSULTATION REPORTS & PRESCRIPTIONS --- */}
      <div className="card glass-panel margin-bottom">
        <div className="card-header border-bottom flex-between">
          <div>
            <h3><FileText className="icon-header glow-icon" color="#10b981" /> Reviewed Patient Prescriptions & Report Cards</h3>
            <p className="card-subtitle">Complete clinical audit of doctor prescriptions and patient diagnostic report cards</p>
          </div>
          <span className="status-pill reviewed">{reviewedCases.length} Reviewed Reports</span>
        </div>

        {reviewedCases.length === 0 ? (
          <div className="empty-cases text-center padding-y-lg">
            <FileText size={40} className="icon-faded text-muted" />
            <h4 className="margin-top-xs">No Reviewed Patient Prescriptions Yet</h4>
            <p className="text-muted text-xs margin-top-xs">
              When doctors review patient cases and submit prescription notes, their report cards will appear here.
            </p>
          </div>
        ) : (
          <div className="reviewed-reports-grid margin-top padding-xs">
            {reviewedCases.map(({ caseInfo: c, suggestion: s }) => {
              const isSelected = selectedReportCase === c.id;
              return (
                <div key={c.id} className="history-card glass-panel margin-bottom-sm padding-sm border-glass border-radius-md">
                  <div className="flex-between border-bottom padding-bottom-xs">
                    <div>
                      <h4 className="text-highlight">#{c.id} - {c.patientName}</h4>
                      <span className="text-muted text-xs">
                        {c.patientAge} yrs, {c.patientGender} • Submitted {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="status-pill reviewed margin-right-xs">Reviewed</span>
                      <button
                        type="button"
                        onClick={() => setSelectedReportCase(isSelected ? null : c.id)}
                        className="btn-secondary btn-sm"
                      >
                        <FileText size={14} color="#06b6d4" />
                        <span>{isSelected ? 'Hide Report Card' : 'View Report Card'}</span>
                        {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Row */}
                  <div className="margin-top-xs flex-wrap flex-gap text-xs">
                    <div><strong>Predicted Disease:</strong> {c.predictedCondition}</div>
                    <div><strong>Risk Level:</strong> <span className={`risk-pill ${c.riskLevel.toLowerCase()}`}>{c.riskScore}% ({c.riskLevel})</span></div>
                    <div><strong>Assigned Doctor:</strong> {s ? `Dr. ${s.doctorName} (${s.doctorSpecialty})` : `Dr. ${c.specialty}`}</div>
                  </div>

                  {/* Expanded Report Card */}
                  {isSelected && (
                    <div className="expanded-report-card margin-top padding-sm border-glass border-radius-md background-dark slide-down">
                      <div className="report-header border-bottom padding-bottom-xs flex-between">
                        <div>
                          <h4 style={{ color: '#06b6d4' }}>🩺 Official Patient Diagnostic & Doctor Report Card</h4>
                          <p className="text-xs text-muted">MediAI Telehealth System Case Audit Document</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="btn-primary btn-sm no-print"
                        >
                          <Printer size={14} /> Print Report
                        </button>
                      </div>

                      <div className="report-body margin-top-xs">
                        {/* 1. Bio & Symptoms */}
                        <div className="grid-2-col margin-bottom-xs">
                          <div>
                            <span className="label-tiny">Patient Details:</span>
                            <p className="text-sm"><strong>{c.patientName}</strong> ({c.patientAge} yrs, {c.patientGender})</p>
                          </div>
                          <div>
                            <span className="label-tiny">Reported Symptoms:</span>
                            <p className="text-sm">{c.symptoms?.join(', ') || 'General Symptoms'}</p>
                          </div>
                        </div>

                        {/* 2. AI Prediction & Risk */}
                        <div className="grid-2-col margin-bottom-xs border-top padding-top-xs">
                          <div>
                            <span className="label-tiny">AI Predicted Condition:</span>
                            <p className="text-sm text-highlight"><strong>{c.predictedCondition}</strong></p>
                          </div>
                          <div>
                            <span className="label-tiny">Risk Level Index:</span>
                            <p className="text-sm">
                              <strong style={{ color: getRiskColor(c.riskLevel) }}>
                                {c.riskScore}% ({c.riskLevel} Risk, {c.severity || 'Moderate'} Severity)
                              </strong>
                            </p>
                          </div>
                        </div>

                        {/* 3. Doctor Impression & Prescriptions */}
                        {s ? (
                          <div className="doctor-notes-section border-top padding-top-xs">
                            <span className="label-tiny" style={{ color: '#06b6d4' }}>
                              Doctor Clinical Impression (Dr. {s.doctorName} - {s.doctorSpecialty}):
                            </span>
                            <p className="text-sm padding-xs background-glass border-radius-sm margin-top-xs">
                              {s.notes}
                            </p>

                            <span className="label-tiny margin-top-xs" style={{ color: '#10b981' }}>
                              <Pill size={14} /> Prescribed Medication & Treatment Plan:
                            </span>
                            <p className="text-sm padding-xs highlight-prescription border-radius-sm margin-top-xs" style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }}>
                              {s.prescription}
                            </p>

                            {s.followUp && (
                              <p className="text-xs text-muted margin-top-xs">
                                <strong>Follow-up Advice:</strong> {s.followUp}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted border-top padding-top-xs">
                            Prescription notes pending review by Dr. {c.specialty}.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- SECTION 3: USER LOGIN DETAILS & CREDENTIAL DIRECTORY --- */}
      <div className="card glass-panel margin-bottom">
        <div className="card-header border-bottom">
          <div>
            <h3><Key className="icon-header" /> User Login & Account Directory</h3>
            <p className="card-subtitle">Complete registry of login credentials for all registered Patients, Doctors, and Administrators</p>
          </div>

          <div className="filter-pill-group">
            <button
              className={`filter-pill ${userRoleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('all')}
            >
              All Users ({allUsers.length})
            </button>
            <button
              className={`filter-pill ${userRoleFilter === 'patient' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('patient')}
            >
              Patients ({stats.patientCount})
            </button>
            <button
              className={`filter-pill ${userRoleFilter === 'doctor' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('doctor')}
            >
              Doctors ({stats.doctorCount})
            </button>
            <button
              className={`filter-pill ${userRoleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('admin')}
            >
              Admins
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-directory-table">
            <thead>
              <tr>
                <th>User / Full Name</th>
                <th>Role & Specialty</th>
                <th>Username (Login)</th>
                <th>Password</th>
                <th>Email Address</th>
                <th>Registration Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const showPass = visiblePasswords[user.id];
                return (
                  <tr key={user.id} className="user-row">
                    <td>
                      <div className="user-name-cell">
                        <strong>{user.firstName} {user.lastName}</strong>
                        <span className="user-id-tag">ID: {user.id}</span>
                      </div>
                    </td>

                    <td>
                      <div className="role-cell">
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'doctor' ? `Dr. ${user.specialty || 'General'}` : user.role.toUpperCase()}
                        </span>
                        {user.role === 'doctor' && user.experienceYears && (
                          <span className="doctor-cred-sub">
                            {user.experienceYears} yrs exp • {user.qualifications}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <code className="username-code">@{user.username}</code>
                    </td>

                    <td>
                      <div className="password-cell">
                        <span className="password-text">
                          {showPass ? user.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="btn-icon-toggle"
                          title={showPass ? 'Hide password' : 'Show password'}
                        >
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      <span className="email-text">{user.email}</span>
                    </td>

                    <td>
                      <span className="date-text">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td>
                      {user.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="btn-danger btn-sm"
                          title="Delete Account"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SECTION 4: RECENT NETWORK CASES AUDIT --- */}
      <div className="card glass-panel">
        <div className="card-header border-bottom">
          <div>
            <h3><AlertTriangle className="icon-header" /> System Cases Audit Trail</h3>
            <p className="card-subtitle">Real-time status of all submitted patient cases across the clinical network</p>
          </div>
          <span className="counter-pill">{allCases.length} Cases Total</span>
        </div>

        {allCases.length === 0 ? (
          <div className="empty-cases text-center padding-y-lg">
            <p className="text-muted">No cases currently submitted in the system.</p>
          </div>
        ) : (
          <div className="table-responsive margin-top-xs">
            <table className="admin-directory-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Patient Name</th>
                  <th>Assigned Specialty</th>
                  <th>Predicted Disease Condition</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {allCases.map(c => (
                  <tr key={c.id}>
                    <td><code>#{c.id}</code></td>
                    <td><strong>{c.patientName}</strong></td>
                    <td><span className="specialty-badge">{c.specialty}</span></td>
                    <td>{c.predictedCondition}</td>
                    <td>
                      <span className={`risk-pill ${c.riskLevel.toLowerCase()}`}>
                        {c.riskScore}% ({c.riskLevel})
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api } from '../../lib/api';
import { AdminAnalyticsView } from '../../components/RoleAnalyticsCharts';


// ─── Icon helpers ────────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  patients: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  doctors: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z',
  clinics: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  close: 'M6 18L18 6M6 6l12 12',
  plus: 'M12 4v16m8-8H4',
  check: 'M5 13l4 4L19 7',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  stethoscope: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

// ─── Reusable components ─────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, loading }) {
  const colors = {
    emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    blue: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
    violet: 'from-violet-500/10 to-purple-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400',
    amber: 'from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{value ?? '—'}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm`}>
          <Icon d={ICONS[icon]} className={`w-5 h-5`} />
        </div>
      </div>
    </div>
  );
}

function Alert({ type, message, onDismiss }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400',
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400',
  };
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${styles[type]}`}>
      <Icon d={type === 'error' ? ICONS.warning : ICONS.check} className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
          <Icon d={ICONS.close} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm"
      />
    </div>
  );
}

function DeleteConfirmModal({ item, itemType, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40">
            <Icon d={ICONS.trash} className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Delete {itemType}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">{item}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Detail Modal ────────────────────────────────────────────────────
function PatientDetailModal({ patient, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/patients/${patient.id}/detail`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [patient.id]);

  const statusColors = {
    'Solved': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    'Pending Review': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'Under Observation': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {patient.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{patient.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{patient.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Icon d={ICONS.close} className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
            </div>
          ) : detail ? (
            <>
              {/* Patient Info */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Age', value: detail.age },
                  { label: 'Gender', value: detail.gender },
                  { label: 'Status', value: detail.case_status || 'Pending Review' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Medical History */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon d={ICONS.heart} className="w-3.5 h-3.5" /> Medical History
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 leading-relaxed">
                  {detail.medical_history || <span className="text-slate-400 italic">No history recorded</span>}
                </p>
              </div>

              {/* Latest Diagnosis */}
              {(detail.latest_diagnosis || detail.latest_prescription) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon d={ICONS.stethoscope} className="w-3.5 h-3.5" /> Latest Doctor Assessment
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 py-3 space-y-2">
                    {detail.latest_diagnosis && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Diagnosis: </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{detail.latest_diagnosis}</span>
                      </div>
                    )}
                    {detail.latest_prescription && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Prescription: </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{detail.latest_prescription}</span>
                      </div>
                    )}
                    {detail.case_status && (
                      <span className={`inline-flex mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[detail.case_status] || statusColors['Pending Review']}`}>
                        {detail.case_status}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon d={ICONS.info} className="w-3.5 h-3.5" /> Reported Symptoms ({detail.symptoms?.length || 0})
                </h4>
                {detail.symptoms?.length > 0 ? (
                  <ul className="space-y-2">
                    {detail.symptoms.map(s => (
                      <li key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 py-2.5">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{s.symptom_name}</span>
                        <span className="text-xs text-slate-400">{s.submitted_at}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No symptoms logged yet</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-10">Could not load patient details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────
function OverviewTab({ stats, statsLoading }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    api.get('/admin/patients')
      .then(setPatients)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const genderStyle = {
    Male: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    Female: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="patients" label="Total Patients" value={stats?.total_patients} color="emerald" loading={statsLoading} />
        <StatCard icon="doctors" label="Total Doctors" value={stats?.total_doctors} color="blue" loading={statsLoading} />
        <StatCard icon="clinics" label="Total Clinics" value={stats?.total_clinics} color="violet" loading={statsLoading} />
        <StatCard icon="pending" label="Pending Reviews" value={stats?.pending_reviews} color="amber" loading={statsLoading} />
      </div>

      {/* Patient Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">All Patients</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click a row to view full details</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all w-52"
              />
            </div>
            <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              {filtered.length} / {patients.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-500">
            <Icon d={ICONS.patients} className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-medium">{search ? 'No patients match your search.' : 'No patients registered yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Age</th>
                  <th className="px-6 py-3.5">Gender</th>
                  <th className="px-6 py-3.5">Medical History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.email}</td>
                    <td className="px-6 py-4">{p.age}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${genderStyle[p.gender] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {p.medical_history || <span className="italic text-slate-400 dark:text-slate-600">None recorded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPatient && (
        <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  );
}

// ─── Tab: Doctors ────────────────────────────────────────────────────────────
function DoctorsTab({ onStatsRefresh }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    api.get('/admin/doctors')
      .then(setDoctors)
      .catch(() => setFeedback({ type: 'error', message: 'Failed to load doctors.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleCreate = async e => {
    e.preventDefault();
    setFormLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      await api.post('/admin/doctors', form);
      setForm({ name: '', email: '', password: '', specialty: '' });
      setFeedback({ type: 'success', message: `Doctor "${form.name}" created successfully.` });
      fetchDoctors();
      onStatsRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create doctor.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/doctors/${deleteTarget.id}`);
      setFeedback({ type: 'success', message: `Doctor "${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      fetchDoctors();
      onStatsRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete doctor.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* Create Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Icon d={ICONS.plus} className="w-4 h-4 text-emerald-500" /> Create Doctor Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Provision a new doctor login</p>
        </div>

        {feedback.message && (
          <Alert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback({ type: '', message: '' })} />
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <InputField label="Full Name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Alex Carter" required />
          <InputField label="Email" name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="doctor@example.com" required />
          <InputField label="Password" name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" required />
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Specialty <span className="font-normal text-slate-400 normal-case">(optional)</span></label>
            <select
              value={form.specialty}
              onChange={e => setForm({ ...form, specialty: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm"
            >
              <option value="">Select specialty...</option>
              {['General Practitioner', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Pediatrician', 'Orthopedic', 'Gynecologist', 'Oncologist', 'Psychiatrist', 'Radiologist'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={formLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {formLoading ? 'Creating...' : 'Create Doctor'}
          </button>
        </form>
      </div>

      {/* Doctor List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">All Doctors</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{doctors.length} registered</p>
          </div>
          <div className="relative">
            <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Icon d={ICONS.doctors} className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm">{search ? 'No doctors match your search.' : 'No doctor accounts yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Specialty</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {d.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{d.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{d.email}</td>
                    <td className="px-6 py-4">
                      {d.specialty ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {d.specialty}
                        </span>
                      ) : <span className="text-slate-400 italic text-xs">General</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete doctor"
                      >
                        <Icon d={ICONS.trash} className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget.name || deleteTarget.email}
          itemType="Doctor"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

// ─── Tab: Clinics ────────────────────────────────────────────────────────────
function ClinicsTab({ onStatsRefresh }) {
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [clinicForm, setClinicForm] = useState({ clinic_name: '', address: '', email: '', password: '' });
  const [clinicLoading, setClinicLoading] = useState(false);

  const [assignForm, setAssignForm] = useState({ clinic_id: '', doctor_id: '' });
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/admin/clinics'), api.get('/admin/doctors')])
      .then(([c, d]) => { setClinics(c); setDoctors(d); })
      .catch(() => setFeedback({ type: 'error', message: 'Failed to load data.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateClinic = async e => {
    e.preventDefault();
    setClinicLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const created = await api.post('/admin/clinics', clinicForm);
      setClinicForm({ clinic_name: '', address: '', email: '', password: '' });
      setAssignForm(f => ({ ...f, clinic_id: String(created.id) }));
      setFeedback({ type: 'success', message: `Clinic "${created.clinic_name}" created. ID: ${created.id}` });
      fetchData();
      onStatsRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create clinic.' });
    } finally {
      setClinicLoading(false);
    }
  };

  const handleAssign = async e => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      const res = await api.post(`/admin/clinics/${assignForm.clinic_id}/doctors`, {
        doctor_id: parseInt(assignForm.doctor_id, 10)
      });
      setFeedback({ type: 'success', message: res.message || 'Doctor assigned successfully.' });
      setAssignForm(f => ({ ...f, doctor_id: '' }));
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign doctor.' });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/clinics/${deleteTarget.id}`);
      setFeedback({ type: 'success', message: `Clinic "${deleteTarget.clinic_name}" deleted.` });
      setDeleteTarget(null);
      fetchData();
      onStatsRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete clinic.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = clinics.filter(c =>
    c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Clinic */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon d={ICONS.plus} className="w-4 h-4 text-emerald-500" /> Create Clinic
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Provision a new clinic account</p>
          </div>
          {feedback.message && (
            <Alert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback({ type: '', message: '' })} />
          )}
          <form onSubmit={handleCreateClinic} className="space-y-4">
            <InputField label="Clinic Name" name="clinic_name" value={clinicForm.clinic_name} onChange={e => setClinicForm({ ...clinicForm, clinic_name: e.target.value })} placeholder="Northside Health Center" required />
            <InputField label="Address" name="address" value={clinicForm.address} onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })} placeholder="123 Main Street" required />
            <InputField label="Login Email" name="email" type="email" value={clinicForm.email} onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })} placeholder="clinic@example.com" required />
            <InputField label="Password" name="password" type="password" value={clinicForm.password} onChange={e => setClinicForm({ ...clinicForm, password: e.target.value })} placeholder="Min. 6 characters" required />
            <button type="submit" disabled={clinicLoading} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-sm">
              {clinicLoading ? 'Creating Clinic...' : 'Create Clinic'}
            </button>
          </form>
        </div>

        {/* Assign Doctor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon d={ICONS.stethoscope} className="w-4 h-4 text-violet-500" /> Assign Doctor to Clinic
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Link a doctor to a specific clinic</p>
          </div>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Clinic</label>
              <select
                required
                value={assignForm.clinic_id}
                onChange={e => setAssignForm({ ...assignForm, clinic_id: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all text-sm"
              >
                <option value="">Choose a clinic...</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.clinic_name} (ID: {c.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Doctor</label>
              <select
                required
                value={assignForm.doctor_id}
                onChange={e => setAssignForm({ ...assignForm, doctor_id: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all text-sm"
              >
                <option value="">Choose a doctor...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name || d.email}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={assignLoading || !assignForm.clinic_id || !assignForm.doctor_id} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-violet-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-sm">
              {assignLoading ? 'Assigning...' : 'Assign Doctor'}
            </button>
          </form>
        </div>
      </div>

      {/* Clinic List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">All Clinics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{clinics.length} registered</p>
          </div>
          <div className="relative">
            <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clinics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Icon d={ICONS.clinics} className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm">{search ? 'No clinics match your search.' : 'No clinics created yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5">Clinic Name</th>
                  <th className="px-6 py-3.5">Address</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Doctors</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {c.clinic_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{c.clinic_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{c.address}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{c.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.doctor_count > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {c.doctor_count} {c.doctor_count === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete clinic"
                      >
                        <Icon d={ICONS.trash} className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget.clinic_name}
          itemType="Clinic"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsKey, setStatsKey] = useState(0);

  const refreshStats = useCallback(() => setStatsKey(k => k + 1), []);

  useEffect(() => {
    setStatsLoading(true);
    api.get('/admin/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [statsKey]);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: ICONS.patients },
    { id: 'doctors', label: 'Doctors', icon: ICONS.doctors },
    { id: 'clinics', label: 'Clinics', icon: ICONS.clinics },
    { id: 'analytics', label: 'Analytics', icon: ICONS.heart },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex-1 px-4 sm:px-6 py-8 relative overflow-hidden min-h-screen">
        {/* Ambient gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin Control Panel
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">MedAssist AI Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage patients, doctors, clinics, and platform analytics from one place</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon d={tab.icon} className="w-4 h-4" />
                {tab.label}
                {tab.id === 'doctors' && stats?.total_doctors != null && (
                  <span className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">{stats.total_doctors}</span>
                )}
                {tab.id === 'clinics' && stats?.total_clinics != null && (
                  <span className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold">{stats.total_clinics}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && <OverviewTab stats={stats} statsLoading={statsLoading} />}
            {activeTab === 'doctors' && <DoctorsTab onStatsRefresh={refreshStats} />}
            {activeTab === 'clinics' && <ClinicsTab onStatsRefresh={refreshStats} />}
            {activeTab === 'analytics' && <AdminAnalyticsView />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'
import ConfirmationModal from '../../components/ConfirmationModal'
import LoadingOverlay from '../../components/LoadingOverlay'
import ActionsMenu from '../../components/ActionsMenu'

export default function PatientList({ dashboardData }){
  const navigate = useNavigate()
  const patients = dashboardData?.patients ?? []
  const [query, setQuery] = useState('')
  const [gender, setGender] = useState('')
  const [risk, setRisk] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profilePatient, setProfilePatient] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [gridView, setGridView] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)

  function toggleSelect(id){
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible(){
    const ids = pageItems.map(p => p.patient_id || p.id)
    setSelected(new Set(ids))
  }

  function clearSelection(){ setSelected(new Set()) }

  function exportSelected(){
    const list = patients.filter(p => selected.has(p.patient_id || p.id))
    if (!list || list.length === 0){ setConfirmAction(null); setConfirmOpen(true); return }
    const cols = ['patient_id','name','dob','gender','phone','blood_group','risk_level','status']
    const csv = [cols.join(',')].concat(list.map(p=>cols.map(c=>`"${(p[c]??'').toString().replace(/"/g,'""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patients-selected-export.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function messageSelected(){
    const list = patients.filter(p => selected.has(p.patient_id || p.id))
    if (!list || list.length===0){ setConfirmAction(null); setConfirmOpen(true); return }
    setLoading(true)
    // placeholder: simulate sending
    setTimeout(()=>{ setLoading(false); alert(`Message sent to ${list.length} patients (simulated).`) }, 800)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = patients.slice()
    if (q) {
      list = list.filter(p => (
        (p.name || '').toLowerCase().includes(q) ||
        (p.patient_id || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
      ))
    }
    if (gender) list = list.filter(p => (p.gender||'').toLowerCase() === gender)
    if (risk) list = list.filter(p => ((p.risk_level||'').toLowerCase() === risk))
    if (status) list = list.filter(p => ((p.status||'').toLowerCase() === status))
    return list
  }, [patients, query, gender, risk, status])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize)

  function toAge(dob) {
    if (!dob) return '—'
    try {
      const diff = new Date().getFullYear() - new Date(dob).getFullYear()
      return diff
    } catch { return '—' }
  }

  function formatDate(value){
    if (!value) return '—'
    try{
      const d = new Date(value)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth()+1).padStart(2,'0')
      const dd = String(d.getDate()).padStart(2,'0')
      return `${yyyy}-${mm}-${dd}`
    }catch{ return '—' }
  }

  function openProfile(patient) {
    if (!patient) return
    setProfilePatient(patient)
    setProfileOpen(true)
  }

  function exportFiltered(){
    const list = filtered
    if (!list || list.length===0){ setConfirmAction(null); setConfirmOpen(true); return }
    const cols = ['patient_id','name','dob','gender','phone','blood_group','risk_level','status']
    const csv = [cols.join(',')].concat(list.map(p=>cols.map(c=>`"${(p[c]??'').toString().replace(/"/g,'""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patients-export.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="provider-page">
      <div className="provider-hero">
        <div className="hero-left">
          <span className="eyebrow">Care team workspace</span>
          <h1>Patient Management</h1>
          <p className="muted">Review patient status, risk signals, and clinical history from one focused workspace.</p>
        </div>
        <div className="hero-actions compact">
          <div className="hero-controls">
            <input className="input small" placeholder="Search patients" value={query} onChange={(e)=>{setQuery(e.target.value); setPage(1)}} aria-label="Search patients" />
            <button className="btn ghost" onClick={() => { setLoading(true); window.location.reload() }} aria-label="Refresh">Refresh</button>
            <button className="btn" onClick={() => { exportFiltered() }} aria-label="Export filtered">Export</button>
          </div>
        </div>
      </div>

      <div className="page-grid">
        <aside className="left-column">
          <div className="summary-grid vertical">
            <button className="summary-card" onClick={() => { setQuery(''); setGender(''); setRisk(''); setStatus(''); setPage(1) }} aria-label="All patients">
              <div className="card-head"><div className="card-icon">👥</div><div>
                <div className="card-title">Total Patients</div>
                <div className="card-value">{patients.length}</div>
              </div></div>
            </button>
            <button className="summary-card" onClick={() => { setStatus('active'); setPage(1) }} aria-label="Active patients">
              <div className="card-head"><div className="card-icon">✅</div><div>
                <div className="card-title">Active Patients</div>
                <div className="card-value">{patients.filter(p => (p.status||'').toLowerCase() === 'active').length}</div>
              </div></div>
            </button>
            <button className="summary-card" onClick={() => { setRisk('high'); setPage(1) }} aria-label="High risk patients">
              <div className="card-head"><div className="card-icon">⚠️</div><div>
                <div className="card-title">High-Risk Patients</div>
                <div className="card-value">{patients.filter(p => (p.risk_level||'').toLowerCase() === 'high').length}</div>
              </div></div>
            </button>
            <button className="summary-card" onClick={() => { setQuery(''); setPage(1) }} aria-label="New this month">
              <div className="card-head"><div className="card-icon">🆕</div><div>
                <div className="card-title">New This Month</div>
                <div className="card-value">{patients.filter(p => {
                  const created = p.created_at || p.registered_at || p.joined_at
                  if (!created) return false
                  try { const d = new Date(created); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() } catch { return false }
                }).length}</div>
              </div></div>
            </button>

            <div className="filters-toggle">
              <button className="btn ghost" onClick={() => setFiltersOpen(s => !s)} aria-expanded={filtersOpen}>{filtersOpen ? 'Hide Filters' : 'Show Filters'}</button>
            </div>
          </div>

          <div className={`filter-panel ${filtersOpen ? 'open' : 'collapsed'}`}>
            <div className="filter-row">
              <label>Gender</label>
              <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1) }}>
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="filter-row">
              <label>Risk Level</label>
              <select value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1) }}>
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="filter-row">
              <label>Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

        </aside>

        <main className="right-column">

      <div className="card table-card">
        <div className="card-body">
          <div className="patient-list-heading">
            <div>
              <span className="eyebrow">Patient list</span>
              <h2>{total} {total === 1 ? 'patient' : 'patients'} found</h2>
              <p className="muted">Select a patient to open their profile or clinical workspace.</p>
            </div>
            <div className="view-switch" role="group" aria-label="Patient list view">
              <button className={`btn ${!gridView ? 'active' : 'ghost'}`} type="button" onClick={() => setGridView(false)}>Table</button>
              <button className={`btn ${gridView ? 'active' : 'ghost'}`} type="button" onClick={() => setGridView(true)}>Cards</button>
            </div>
          </div>
          <div className="bulk-toolbar" role="toolbar" aria-label="Bulk actions">
            <div className="bulk-left">
              <button className="btn ghost" onClick={selectAllVisible}>Select Visible</button>
              <button className="btn ghost" onClick={clearSelection}>Clear</button>
              <span className="muted">{selected.size} selected</span>
            </div>
            <div className="bulk-right">
              <button className="btn" onClick={messageSelected} disabled={selected.size===0}>Message</button>
              <button className="btn" onClick={exportSelected} disabled={selected.size===0}>Export</button>
            </div>
          </div>

          {gridView ? (
            <div className="card-grid" role="list">
              {pageItems.length===0 && <div className="empty">No patients match your search/filters.</div>}
              {pageItems.map(p => {
                const id = p.patient_id || p.id
                return (
                  <div key={id} className="patient-card" role="listitem">
                    <div className="card-row top">
                      <label className="card-select"><input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)} aria-label={`Select ${p.name}`}/> </label>
                      <div className="card-avatar">{p.avatar_url ? <img src={p.avatar_url} alt="avatar" /> : <div className="avatar-circle">{(p.name||'').split(' ').map(s=>s[0]).join('').slice(0,2)}</div>}</div>
                      <div className="card-info">
                        <div className="card-name">{p.name || '—'}</div>
                        <div className="muted small">{p.patient_id || '—'}</div>
                      </div>
                    </div>
                    <div className="card-row">
                      <div><strong>Age:</strong> {toAge(p.dob)}</div>
                      <div><strong>Risk:</strong> <span className={`badge risk-${(p.risk_level||'unknown').toLowerCase()}`}>{p.risk_level || 'Unknown'}</span></div>
                    </div>
                    <div className="card-row actions">
                      <button className="btn" onClick={() => openProfile(p)}>View Profile</button>
                      <button className="btn ghost" onClick={() => navigate(`/dashboard/provider/history?patient_id=${encodeURIComponent(p.patient_id)}`)}>History</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="table-wrap">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Latest Disease</th>
                  <th>Risk</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr><td colSpan={7} className="empty">No patients match your search/filters.</td></tr>
                )}
                      {pageItems.map((p) => (
                        <tr key={p.patient_id || p.id} className="row-hover">
                          <td className="patient-cell">
                            <div className="patient-inline">
                              {p.avatar_url ? <img src={p.avatar_url} alt="avatar" className="avatar"/> : <div className="avatar-circle">{(p.name||'').split(' ').map(s=>s[0]).join('').slice(0,2)}</div>}
                              <div className="patient-meta">
                                <div className="patient-name">{p.name || '—'}</div>
                                <div className="muted small">{p.patient_id || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{toAge(p.dob)}</td>
                          <td>{p.latest_prediction || '—'}</td>
                          <td><span className={`badge risk-${(p.risk_level||'unknown').toLowerCase()}`}>{p.risk_level || 'Unknown'}</span></td>
                          <td>{p.last_visit ? formatDate(p.last_visit) : '—'}</td>
                          <td><span className={`badge status-${(p.status||'unknown').toLowerCase()}`}>{p.status || 'Unknown'}</span></td>
                          <td className="cell-actions">
                            <ActionsMenu actions={[
                              { label: 'View Profile', onClick: () => openProfile(p) },
                              { label: 'Medical History', onClick: () => navigate(`/dashboard/provider/history?patient_id=${encodeURIComponent(p.patient_id)}`) },
                              { label: 'Symptoms', onClick: () => navigate(`/dashboard/provider/symptoms?patient_id=${encodeURIComponent(p.patient_id)}`) },
                              { label: 'Disease Prediction', onClick: () => navigate(`/dashboard/provider/prediction?patient_id=${encodeURIComponent(p.patient_id)}`) },
                              { label: 'Risk Assessment', onClick: () => navigate(`/dashboard/provider/risk?patient_id=${encodeURIComponent(p.patient_id)}`) },
                              { label: 'Reports', onClick: () => navigate(`/dashboard/provider/reports?patient_id=${encodeURIComponent(p.patient_id)}`) },
                              { label: 'Recommendations', onClick: () => navigate(`/dashboard/provider/recommendations?patient_id=${encodeURIComponent(p.patient_id)}`) },
                            ]} />
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
            )}

          <div className="table-footer">
            <div className="pagination">
              <button className="btn ghost" onClick={() => setPage(1)} disabled={page===1}>First</button>
              <button className="btn ghost" onClick={() => setPage(s => Math.max(1, s-1))} disabled={page===1}>Prev</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn ghost" onClick={() => setPage(s => Math.min(totalPages, s+1))} disabled={page===totalPages}>Next</button>
              <button className="btn ghost" onClick={() => setPage(totalPages)} disabled={page===totalPages}>Last</button>
            </div>
            <div className="results-count muted">Showing {(pageItems.length)} of {total} results</div>
          </div>
        </div>
      </div>
      </main>
      </div>
      <Modal open={profileOpen} title={`Patient: ${profilePatient?.name || ''}`} onClose={() => setProfileOpen(false)} fullScreen={true} >
        <div className="profile-full">
          <div className="profile-grid">
            <div className="profile-left card">
              <div className="card-body">
                <div className="profile-avatar">{profilePatient?.avatar_url ? <img src={profilePatient.avatar_url} alt="avatar" /> : <div className="avatar-circle">{(profilePatient?.name||'').split(' ').map(s=>s[0]).join('').slice(0,2)}</div>}</div>
                <h3>{profilePatient?.name}</h3>
                <div className="muted">ID: {profilePatient?.patient_id}</div>
                <div><strong>Phone:</strong> {profilePatient?.phone || '—'}</div>
                <div><strong>Email:</strong> {profilePatient?.email || '—'}</div>
                <div><strong>Blood Group:</strong> {profilePatient?.blood_group || '—'}</div>
                <div><strong>Risk Level:</strong> <span className={`badge risk-${(profilePatient?.risk_level||'unknown').toLowerCase()}`}>{profilePatient?.risk_level || 'Unknown'}</span></div>
              </div>
            </div>
            <div className="profile-right card">
              <div className="card-body">
                <h4>Medical Summary</h4>
                <p className="muted small">Latest prediction: {profilePatient?.latest_prediction || '—'}</p>
                <div className="profile-section">
                  <strong>Last Visit:</strong> {profilePatient?.last_visit || '—'}
                </div>
                <div className="profile-section">
                  <strong>Known Conditions:</strong>
                  <ul>
                    {(profilePatient?.conditions || []).length > 0 ? (profilePatient.conditions.map((c,i)=>(<li key={i}>{c}</li>))) : <li>—</li>}
                  </ul>
                </div>
                <div className="profile-actions">
                  <button className="btn" onClick={() => navigate(`/dashboard/provider/history?patient_id=${encodeURIComponent(profilePatient?.patient_id)}`)}>Open Full History</button>
                  <button className="btn ghost" onClick={() => navigate(`/dashboard/provider/prediction?patient_id=${encodeURIComponent(profilePatient?.patient_id)}`)}>Run Prediction</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal open={confirmOpen} title={confirmAction ? 'Confirm Action' : 'No Selection'} message={confirmAction ? 'Are you sure?' : 'No patients selected.'} onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); if (confirmAction) confirmAction() }} />
      <LoadingOverlay show={loading} label="Processing..." />
    </div>
  )
}

import React, {useState} from 'react'
import { NavLink } from 'react-router-dom'

function Icon({name}){
  const icons = {
    dashboard: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" fill="currentColor"/></svg>),
    profile: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" fill="currentColor"/></svg>),
    history: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 3a9 9 0 100 18 9 9 0 000-18zm1 10H8V9h1v3h5v1z" fill="currentColor"/></svg>),
    patienthistory: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a9 9 0 100 18 9 9 0 000-18zm-1 14h2v-2h-2v2zm0-4h2V6h-2v6z" fill="currentColor"/></svg>),
    patientlist: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v2H4zm0 5h12v2H4zm0 5h8v2H4z" fill="currentColor"/></svg>),
    symptomentry: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l4 8-4 4-4-4 4-8zM6 20h12v2H6v-2z" fill="currentColor"/></svg>),
    symptomanalysis: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 2h2v10h-2zm-4 6h2v6H7zm8 2h2v4h-2zm6-8v18H1V2h20zm-2 2H3v14h18V4z" fill="currentColor"/></svg>),
    diseaseprediction: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" fill="currentColor"/></svg>),
    riskassessment: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-6h2v6zm0 4h-2v-2h2v2z" fill="currentColor"/></svg>),
    reports: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="currentColor"/></svg>),
    analytics: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18V3H3zm5 13H6v-6h2v6zm4 0h-2V8h2v8zm4 0h-2v-4h2v4z" fill="currentColor"/></svg>),
    recommendations: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21l-8-4V7l8-4 8 4v10l-8 4z" fill="currentColor"/></svg>),
    settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19.4 12.9a7.9 7.9 0 000-1.8l2.1-1.6-2-3.5-2.5.7a8 8 0 00-1.5-.9l-.4-2.6H9.9l-.4 2.6a8 8 0 00-1.5.9L5.5 6l-2 3.5 2.1 1.6a7.9 7.9 0 000 1.8L3.5 16.5l2 3.5 2.5-.7c.5.4 1 .7 1.5.9l.4 2.6h4.2l.4-2.6c.5-.2 1-.5 1.5-.9l2.5.7 2-3.5-2.1-1.6zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z" fill="currentColor"/></svg>),
    home: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" fill="currentColor"/></svg>),
  }
  return icons[name] || (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>)
}

function getIconName(label){
  return label.toLowerCase().replace(/[^a-z]/g, '')
}

function Item({ to, label }){
  return (
    <NavLink to={to} className={({isActive}) => isActive ? 'sb-item active' : 'sb-item'}>
      <span className="sb-icon"><Icon name={getIconName(label)} /></span>
      <span className="sb-label">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ menu=[] }){
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="logo"> <strong>Med</strong>Assist</div>
        </div>
        <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">{collapsed ? '»' : '«'}</button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-group">
          {menu.slice(0,5).map((m) => (
            <Item key={m.to} to={m.to} label={m.label} />
          ))}
        </div>
        <div className="nav-group muted">
          {menu.slice(5).map((m) => (
            <Item key={m.to} to={m.to} label={m.label} />
          ))}
        </div>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/" className="sb-item">Home</NavLink>
      </div>
    </aside>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Activity, FileText, User, AlertTriangle, BarChart3, Users as UsersIcon, LogOut, Shield, FilePlus, Pill, Stethoscope, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from './med/Logo'
import { Button } from './med/Button'
import { Badge } from './med/Badge'

const ORG_ADMIN_NAV = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/triage', label: 'Triage Queue', icon: AlertTriangle },
  { to: '/patient-history', label: 'Patient History', icon: Clock },
  { to: '/create-report', label: 'Create Report', icon: FilePlus },
  { to: '/users', label: 'User Management', icon: UsersIcon },
]

const NAV_BY_ROLE = {
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/checker', label: 'Symptom Checker', icon: Activity },
    { to: '/risk-assessment', label: 'Risk Assessment', icon: Shield },
    { to: '/my-reports', label: 'My Reports', icon: FileText },
    { to: '/provider-reports', label: 'Provider Reports', icon: FileText },
    { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/history', label: 'Complete History', icon: Clock },
    { to: '/profile', label: 'My Profile', icon: User },
  ],
  nurse: [
    { to: '/triage', label: 'Triage Queue', icon: AlertTriangle },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/patient-history', label: 'Patient History', icon: Clock },
    { to: '/create-report', label: 'Create Report', icon: FilePlus },
  ],
  provider: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/triage', label: 'Triage Queue', icon: AlertTriangle },
    { to: '/patient-history', label: 'Patient History', icon: Clock },
    { to: '/create-report', label: 'Create Report', icon: FilePlus },
    { to: '/create-prescription', label: 'Create Prescription', icon: FilePlus },
    { to: '/practice-details', label: 'Practice Details', icon: Stethoscope },
  ],
  clinic_admin: ORG_ADMIN_NAV,
  hospital_admin: ORG_ADMIN_NAV,
  telemedicine_admin: ORG_ADMIN_NAV,
  org_admin: ORG_ADMIN_NAV,
  admin: ORG_ADMIN_NAV,
}

const ROLE_LABEL = {
  patient: 'Patient',
  nurse: 'Nurse',
  provider: 'Provider',
  clinic_admin: 'Clinic Admin',
  hospital_admin: 'Hospital Admin',
  telemedicine_admin: 'Telemedicine Admin',
  org_admin: 'Org Admin',
  admin: 'Admin',
}

export default function Layout() {
  const { role, email, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV_BY_ROLE[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 px-6 py-5">
          <Logo size="md" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <Badge tone="primary">{ROLE_LABEL[role] || role}</Badge>
          <p className="truncate text-sm text-slate-600" title={email}>{email}</p>
          <Button variant="secondary" onClick={handleLogout} className="w-full" size="sm">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 w-full overflow-y-auto bg-mesh">
        <div className="w-full h-full px-6 py-8 lg:px-10 xl:px-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

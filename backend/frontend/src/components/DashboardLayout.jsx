import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({ menu, title, children, user }){
  return (
    <div className="dashboard-shell">
      <Sidebar menu={menu} />
      <div className="dashboard-main">
        <div className="dashboard-topbar container">
          <Header user={user ?? {}} />
          <div className="page-title">
            <h2>{title}</h2>
          </div>
        </div>
        <div className="container dashboard-content">
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  )
}

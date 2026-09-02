import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import Success from './pages/Success'
import Landing from './pages/Landing'
import Logout from './pages/Logout'

export default function App(){
  const location = useLocation()
  
  // Hide public header on authenticated dashboard routes
  const isDashboard = location.pathname.startsWith('/dashboard/patient') || location.pathname.startsWith('/dashboard/provider')

  return (
    <div>
      {!isDashboard && (
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <Link to="/" className="logo">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="6" fill="#0b79ff"/><path d="M8 12a4 4 0 014-4v8a4 4 0 01-4-4z" fill="#fff"/></svg>
                <span>MedAssist AI</span>
              </Link>
            </div>
            <nav className="main-nav">
              <Link to="/">Home</Link>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <Link to="/login" className="login">Login</Link>
              <Link to="/register" className="register">Register</Link>
            </nav>
          </div>
        </header>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/patient/*" element={<PatientDashboard />} />
          <Route path="/dashboard/provider/*" element={<ProviderDashboard />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </main>
    </div>
  )
}

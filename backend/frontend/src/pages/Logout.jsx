import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeToken } from '../api/client'

export default function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    removeToken()
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div className="container auth-page">
      <div className="auth-card">
        <h1>Logging out...</h1>
      </div>
    </div>
  )
}

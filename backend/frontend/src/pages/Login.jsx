import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { setToken, login } from '../api/client'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const message = location.state?.message

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.target)
    const data = Object.fromEntries(form.entries())
    try {
      const json = await login(data)
      setToken(json.token)
      const destination = json.user.role === 'patient' ? '/dashboard/patient' : '/dashboard/provider'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        {message && <div className="status success">{message}</div>}
        {error && <div className="status error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email Address
            <input name="email" type="email" placeholder="jane@example.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Enter your password" />
          </label>
          <button
            type="submit"
            className="btn primary wide auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

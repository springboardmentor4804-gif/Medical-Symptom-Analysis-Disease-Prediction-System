import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../api/client'

const strengthLabels = ['Very weak', 'Weak', 'Okay', 'Strong', 'Excellent']

function PasswordStrength({ value }) {
  const score = useMemo(() => {
    if (!value) return 0
    let s = 0
    if (value.length >= 8) s++
    if (/[A-Z]/.test(value)) s++
    if (/[0-9]/.test(value)) s++
    if (/[^A-Za-z0-9]/.test(value)) s++
    return s
  }, [value])

  return (
    <div className={`pw-strength pw-${score}`}>
      <span>{strengthLabels[score]}</span>
      <div className="strength-meter">
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className={index <= score ? 'active' : ''} />
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const form = new FormData(event.target)
    const data = Object.fromEntries(form.entries())
    data.role = role === 'healthcare' ? 'doctor' : 'patient'

    // remove helper-only fields
    delete data.confirm_password
    delete data.role_select

    // normalize optional values and validate numeric fields
    const normalizeNumber = (key, type = 'float') => {
      if (data[key] === undefined) return true
      if (data[key] === '') {
        delete data[key]
        return true
      }
      const parsed = type === 'int' ? parseInt(data[key], 10) : parseFloat(data[key])
      if (Number.isNaN(parsed)) {
        setError(`${key.replace(/_/g, ' ')} must be a valid ${type === 'int' ? 'integer' : 'number'}.`)
        return false
      }
      data[key] = parsed
      return true
    }

    if (!normalizeNumber('height', 'float')) return setLoading(false)
    if (!normalizeNumber('weight', 'float')) return setLoading(false)
    if (!normalizeNumber('age', 'int')) return setLoading(false)
    if (!normalizeNumber('years_experience', 'int')) return setLoading(false)

    if (!data.full_name?.trim()) return setError('Full name is required.')
    if (!data.email?.trim() || !validateEmail(data.email)) return setError('A valid email address is required.')
    if (!data.password || data.password.length < 8) return setError('Password must be at least 8 characters.')
    if (data.password !== form.get('confirm_password')) return setError('Passwords must match.')

    const truncateToNBytes = (str, n) => {
      const enc = new TextEncoder()
      if (enc.encode(str).length <= n) return str
      let out = ''
      for (const ch of str) {
        const candidate = out + ch
        if (enc.encode(candidate).length > n) break
        out = candidate
      }
      return out
    }

    data.password = truncateToNBytes(data.password, 72)

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `HTTP ${response.status}`)
      }
      setSuccess('Registration completed successfully. Redirecting to login...')
      window.setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful. Please log in.' } })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container register-page">
      <div className="register-card">
        <div className="hero-panel">
          <div>
            <span className="eyebrow">Create your account</span>
            <h1>Unified registration for patients and providers</h1>
            <p>Complete one modern form with role-aware fields and secure signup.</p>
          </div>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Full Name
              <input name="full_name" type="text" placeholder="Jane Doe" />
            </label>
            <label>
              Email Address
              <input name="email" type="email" placeholder="jane@example.com" />
            </label>
          </div>

          <div className="field-grid">
            <label>
              Password
              <input name="password" type="password" placeholder="Create a password" onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label>
              Confirm Password
              <input name="confirm_password" type="password" placeholder="Repeat password" />
            </label>
          </div>
          <PasswordStrength value={password} />

          <div className="field-grid">
            <label>
              Phone Number
              <input name="phone" type="tel" placeholder="(555) 123-4567" />
            </label>
            <label>
              Date of Birth
              <input name="dob" type="date" />
            </label>
          </div>

          <div className="field-grid">
            <label>
              Gender
              <select name="gender" defaultValue="">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Role
              <select name="role_select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="patient">Patient</option>
                <option value="healthcare">Healthcare Provider</option>
              </select>
            </label>
          </div>

          <div className={`role-details ${role !== 'patient' ? 'hidden' : ''}`}>
            <h3>Patient Details</h3>
            <div className="field-grid">
              <label>
                Blood Group
                <input name="blood_group" type="text" placeholder="A+" />
              </label>
              <label>
                Height (cm)
                <input name="height" type="number" step="0.1" placeholder="170" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                Weight (kg)
                <input name="weight" type="number" step="0.1" placeholder="68" />
              </label>
              <label>
                Age
                <input name="age" type="number" placeholder="34" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                Emergency Contact
                <input name="emergency_contact" type="tel" placeholder="(555) 789-0123" />
              </label>
              <label>
                Existing Medical Conditions
                <input name="existing_conditions" type="text" placeholder="Diabetes, asthma" />
              </label>
            </div>
            <label>
              Allergies
              <input name="allergies" type="text" placeholder="Peanuts, penicillin" />
            </label>
          </div>

          <div className={`role-details ${role !== 'healthcare' ? 'hidden' : ''}`}>
            <h3>Provider Details</h3>
            <div className="field-grid">
              <label>
                Hospital / Clinic Name
                <input name="hospital_name" type="text" placeholder="Mercy Health Clinic" />
              </label>
              <label>
                Specialization
                <input name="specialization" type="text" placeholder="Cardiology" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                Medical License Number
                <input name="license_number" type="text" placeholder="MD-123456" />
              </label>
              <label>
                Years of Experience
                <input name="years_experience" type="number" placeholder="10" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                Qualification
                <input name="qualification" type="text" placeholder="MD, MBBS" />
              </label>
              <label>
                Department
                <input name="department" type="text" placeholder="Emergency Medicine" />
              </label>
            </div>
          </div>

          {(error || success) && (
            <div className={`status ${success ? 'success' : 'error'}`}>{error || success}</div>
          )}

          <button
            type="submit"
            className="btn primary wide auth-submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}

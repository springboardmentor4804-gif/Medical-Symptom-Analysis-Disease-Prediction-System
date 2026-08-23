import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Stethoscope } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { Logo } from '../components/med/Logo'
import { Button } from '../components/med/Button'
import { Card } from '../components/med/Card'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/signup', { email, password, role })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(errorMessage(err, 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'patient', icon: User, label: 'Patient', desc: 'Access symptom checker and health dashboard' },
    { value: 'provider', icon: Stethoscope, label: 'Healthcare Provider', desc: 'Access analytics and triage queue' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-700 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" className="text-white" />
        </div>

        <Card hoverLift={false} className="p-8">
          <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-slate-600">Get started in seconds</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required className="input pl-10" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password" required minLength={8} className="input pl-10" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"
                />
              </div>
            </div>
            <div>
              <label className="label">Select your role</label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      type="button" key={r.value} onClick={() => setRole(r.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        role === r.value
                          ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105'
                          : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mb-2 ${role === r.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <p className={`font-semibold text-sm ${role === r.value ? 'text-indigo-700' : 'text-slate-700'}`}>{r.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Account created! Redirecting to login…
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

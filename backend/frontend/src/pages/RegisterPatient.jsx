import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import { API_BASE } from '../api/client'

export default function RegisterPatient(){
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
    data.role = 'patient'
    if (!data.password || data.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try{
      // Ensure password is no more than 72 bytes (bcrypt limit).
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
      const truncated = truncateToNBytes(data.password, 72)
      if (truncated.length !== data.password.length) {
        setError('Password was truncated to 72 bytes for compatibility')
      }
      data.password = truncated

      const res = await fetch(`${API_BASE}/register`,{ 
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }
      const json = await res.json()
      navigate('/success', {state: {message: 'Registration successful', token: json.confirmation_token}})
    }catch(err){
      setError(err.message)
    }finally{setLoading(false)}
  }

  return (
    <div className="card">
      <h2>Patient Registration</h2>
      <form onSubmit={handleSubmit}>
        <label>Full name<input name="full_name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        <label>Phone<input name="phone" /></label>
        <div style={{marginTop:12}}>
          <button disabled={loading}>{loading? 'Registering...':'Register as Patient'}</button>
        </div>
      </form>
      {error && <div className="status">{error}</div>}
    </div>
  )
}

import React from 'react'
import {useLocation} from 'react-router-dom'

export default function Success(){
  const loc = useLocation()
  const state = loc.state || {}
  return (
    <div className="card">
      <h2>{state.message || 'Success'}</h2>
      {state.token && <div><strong>Confirmation token (test use):</strong>
        <pre style={{whiteSpace:'break-spaces'}}>{state.token}</pre>
      </div>}
      <div style={{marginTop:12}}>Open your email to confirm (or call GET /confirm?token=...)</div>
    </div>
  )
}

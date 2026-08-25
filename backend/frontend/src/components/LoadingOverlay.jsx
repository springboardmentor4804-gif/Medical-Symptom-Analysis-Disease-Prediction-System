import React from 'react'

export default function LoadingOverlay({ show, label='Loading...' }){
  if (!show) return null
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <div className="loading-label">{label}</div>
    </div>
  )
}

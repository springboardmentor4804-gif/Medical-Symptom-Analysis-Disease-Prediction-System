import React from 'react'

export default function Modal({ open, title, children, onClose, fullScreen=false }){
  if (!open) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div className={`modal ${fullScreen ? 'modal-full' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn icon" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

import React from 'react'
import Modal from './Modal'

export default function ConfirmationModal({ open, title='Confirm', message, onCancel, onConfirm, confirmLabel='Confirm' }){
  return (
    <Modal open={open} title={title} onClose={onCancel} fullScreen={false}>
      <div className="confirm-body">
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}

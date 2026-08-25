import React, { useState, useRef, useEffect } from 'react'

export default function ActionsMenu({ actions = [], ariaLabel = 'Actions' }){
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(()=>{
    function onDoc(e){ if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  },[])

  return (
    <div className="actions-menu" ref={ref}>
      <button className="btn icon" aria-haspopup="true" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen(s => !s)}>⋯</button>
      {open && (
        <ul className="actions-list" role="menu">
          {actions.map((a, i) => (
            <li key={i} role="menuitem">
              <button onClick={() => { setOpen(false); a.onClick && a.onClick() }}>{a.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import React from 'react'

function Icon({type}){
  const map = {
    'Profile Status': '👤',
    'Symptoms Submitted': '🤒',
    'Disease Predictions': '🧾',
    'Risk Assessments': '⚠️',
    'Reports': '📄',
    'Recommendations': '💊',
  }
  return <div className="card-icon">{map[type] || '📌'}</div>
}

function Card({title, value, children}){
  const numeric = typeof value === 'number'
  return (
    <div className="card overview-card modern">
      <div className="card-body">
        <div className="card-head">
          <Icon type={title} />
          <div>
            <div className="card-title">{title}</div>
            <div className="card-value">{numeric ? value : value}</div>
          </div>
        </div>
        {numeric && (
          <div className="progress">
            <div className="progress-bar" style={{width: `${Math.min(100, value)}%`}} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default function OverviewCards({items=[]}){
  return (
    <div className="overview-grid">
      {items.map((it,idx)=> <Card key={idx} title={it.title} value={it.value}>{it.children}</Card>)}
    </div>
  )
}

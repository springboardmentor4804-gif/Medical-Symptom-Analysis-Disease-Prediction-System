import React from 'react'

export default function ActivityList({items=[]}){
  return (
    <div className="card activity-card">
      <div className="card-body">
        <div className="card-title">Recent Activity</div>
        <ul className="activity-list">
          {items.length === 0 && <li className="empty">No recent activity</li>}
          {items.map((it, i) => (
            <li key={i} className="activity-item">
              <div className="act-text">{it.text}</div>
              <div className="act-meta">{it.meta}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

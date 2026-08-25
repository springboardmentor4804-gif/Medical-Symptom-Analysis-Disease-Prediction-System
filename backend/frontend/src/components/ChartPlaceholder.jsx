import React from 'react'

export default function ChartPlaceholder({title='Chart', height=180}){
  return (
    <div className="card chart-card" style={{height}}>
      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="chart-placeholder">Chart area (placeholder)</div>
      </div>
    </div>
  )
}

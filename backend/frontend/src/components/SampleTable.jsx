import React from 'react'

export default function SampleTable({columns=[], rows=[]}){
  return (
    <div className="card table-card">
      <div className="card-body">
        <table className="sample-table">
          <thead>
            <tr>{columns.map((c,i)=> <th key={i}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length===0 && (
              <tr><td colSpan={columns.length} className="empty">No data</td></tr>
            )}
            {rows.map((r,ri)=> (
              <tr key={ri}>{columns.map((c,ci)=> <td key={ci}>{r[c] ?? ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

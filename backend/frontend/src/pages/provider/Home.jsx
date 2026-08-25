import React from 'react'
import OverviewCards from '../../components/OverviewCards'
import SampleTable from '../../components/SampleTable'

export default function ProviderHome({ dashboardData }){
  const patients = dashboardData?.patients ?? []
  const risks = dashboardData?.risks ?? []
  const predictions = dashboardData?.predictions ?? []
  const reports = dashboardData?.reports ?? []
  const recommendations = dashboardData?.recommendations ?? []

  const scores = risks.map((item) => item.score || 0)
  const averageRisk = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : 'N/A'

  const cards = [
    { title: 'Total Patients', value: patients.length },
    { title: 'Total Predictions', value: predictions.length },
    { title: 'Risk Assessments', value: risks.length },
    { title: 'Reports', value: reports.length },
    { title: 'Recommendations', value: recommendations.length },
    { title: 'Average Risk', value: averageRisk },
  ]

  return (
    <div className="provider-home">
      <OverviewCards items={cards} />

      <div className="card">
        <div className="card-body">
          <div className="card-title">Patient Snapshot</div>
          <SampleTable
            columns={["Name", "Status", "Last Visit"]}
            rows={patients.map((patient) => ({ Name: patient.name, Status: patient.status, "Last Visit": patient.last_visit || '–' }))}
          />
        </div>
      </div>
    </div>
  )
}

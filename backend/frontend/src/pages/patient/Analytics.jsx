import React from 'react'
import OverviewCards from '../../components/OverviewCards'
import SampleTable from '../../components/SampleTable'

export default function Analytics({ dashboardData }){
  const medicalHistory = dashboardData?.medical_history ?? []
  const symptoms = dashboardData?.symptoms ?? []
  const predictions = dashboardData?.predictions ?? []
  const risk = dashboardData?.risk
  const reports = dashboardData?.reports ?? []
  const recommendations = dashboardData?.recommendations ?? []

  const cards = [
    { title: 'History records', value: medicalHistory.length },
    { title: 'Symptoms tracked', value: symptoms.length },
    { title: 'Predictions made', value: predictions.length },
    { title: 'Risk status', value: risk?.risk_level || 'None' },
    { title: 'Reports', value: reports.length },
    { title: 'Recommendations', value: recommendations.length },
  ]

  const recentActivity = [
    ...symptoms.slice(0, 3).map((item) => ({ Date: item.entered_date, Event: item.symptom_name, Type: 'Symptom' })),
    ...predictions.slice(0, 3).map((item) => ({ Date: item.prediction_date, Event: item.predicted_disease, Type: 'Prediction' })),
    ...reports.slice(0, 3).map((item) => ({ Date: item.generated_at, Event: item.report_name, Type: 'Report' })),
  ].sort((a, b) => new Date(b.Date) - new Date(a.Date))

  return (
    <div className="analytics-page">
      <OverviewCards items={cards} />
      <div className="card">
        <div className="card-body">
          <div className="card-title">Recent Activity</div>
          <SampleTable
            columns={["Date","Type","Event"]}
            rows={recentActivity.map((item) => ({ Date: item.Date, Type: item.Type, Event: item.Event }))}
          />
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { FileText, Download, Calendar, User, Pill } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { api, errorMessage } from '../lib/api'

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = () => {
    setLoading(true)
    api.get('/prescriptions/my-prescriptions')
      .then((res) => {
        setPrescriptions(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, 'Failed to load prescriptions'))
        setLoading(false)
      })
  }

  const handleDownload = async (prescriptionId) => {
    setDownloading(prescriptionId)
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Prescription_${prescriptionId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert(errorMessage(err, 'Failed to download prescription'))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading prescriptions…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Prescriptions</h1>
        <p className="mt-1 text-sm text-slate-600">
          View and download your digital prescriptions
        </p>
      </header>

      {prescriptions.length === 0 ? (
        <Card hoverLift={false} className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Prescriptions Yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Your healthcare provider will issue prescriptions here when needed.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Prescriptions List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">All Prescriptions ({prescriptions.length})</h2>
            
            {prescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                className={`cursor-pointer transition ${
                  selectedPrescription?.id === prescription.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedPrescription(prescription)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="h-4 w-4 text-indigo-600" />
                      <p className="font-semibold text-slate-900">
                        Prescription #{prescription.id}
                      </p>
                    </div>
                    
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{prescription.provider_name}, {prescription.provider_qualifications}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{prescription.clinic_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Issued: {new Date(prescription.date_issued).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill className="h-3 w-3" />
                        <span>{prescription.medications.length} medicine{prescription.medications.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(prescription.id)
                    }}
                    disabled={downloading === prescription.id}
                  >
                    <Download className="h-3 w-3" />
                    {downloading === prescription.id ? 'Downloading...' : 'PDF'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Prescription Details */}
          <div className="sticky top-6">
            {selectedPrescription ? (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle icon={<FileText className="h-5 w-5" />}>
                    Prescription Details
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(selectedPrescription.id)}
                    disabled={downloading === selectedPrescription.id}
                  >
                    <Download className="h-3 w-3" />
                    {downloading === selectedPrescription.id ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>

                {/* Prescription Document Style */}
                <div className="rounded-lg border-2 border-slate-300 bg-white p-6">
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-400 pb-4 mb-4">
                    <p className="font-bold text-xl text-slate-900">{selectedPrescription.clinic_name}</p>
                    <p className="text-xs text-slate-600 mt-1">Professional Medical Services</p>
                  </div>

                  {/* Doctor Info */}
                  <div className="mb-4">
                    <p className="font-semibold text-sm text-slate-900">
                      Dr. {selectedPrescription.provider_name}, {selectedPrescription.provider_qualifications}
                    </p>
                    <p className="text-xs text-slate-600">
                      Date Issued: {new Date(selectedPrescription.date_issued).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Patient Info */}
                  <div className="mb-4 text-sm bg-slate-50 rounded p-3">
                    <p><strong>Patient:</strong> {selectedPrescription.patient_name}</p>
                    <p><strong>Age/Sex:</strong> {selectedPrescription.patient_age} years / {selectedPrescription.patient_sex.charAt(0).toUpperCase() + selectedPrescription.patient_sex.slice(1)}</p>
                  </div>

                  {/* Rx Symbol */}
                  <p className="text-4xl text-indigo-600 mb-3">℞</p>

                  {/* Medications */}
                  <div className="space-y-4 mb-6">
                    {selectedPrescription.medications.map((med, index) => (
                      <div key={index} className="border-l-4 border-indigo-300 pl-3 py-2">
                        <p className="font-bold text-sm text-slate-900">
                          {index + 1}. {med.drug_name}
                          {med.brand_name && <span className="font-normal text-slate-600"> ({med.brand_name})</span>}
                        </p>
                        <div className="text-xs text-slate-700 mt-1 space-y-0.5">
                          <p><strong>Strength:</strong> {med.strength} • <strong>Form:</strong> {med.dosage_form}</p>
                          <p><strong>Frequency:</strong> {med.frequency} • <strong>Route:</strong> {med.route}</p>
                          <p><strong>Duration:</strong> {med.duration}</p>
                          {med.instructions && (
                            <p className="italic text-slate-600 mt-1">
                              <strong>Instructions:</strong> {med.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Additional Notes */}
                  {selectedPrescription.additional_notes && (
                    <div className="mb-4 text-sm bg-amber-50 rounded p-3 border border-amber-200">
                      <p className="font-semibold text-amber-900 mb-1">Additional Notes:</p>
                      <p className="text-amber-800">{selectedPrescription.additional_notes}</p>
                    </div>
                  )}

                  {/* Signature Area */}
                  <div className="border-t-2 border-slate-300 pt-4 mt-6">
                    <p className="text-sm font-serif italic text-indigo-700">
                      {selectedPrescription.provider_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Digitally Signed</p>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <strong>Note:</strong> This is a legally valid digital prescription. Present this document at any registered pharmacy. 
                      Do not self-medicate or share this prescription with others.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card hoverLift={false} className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm text-slate-600">
                  Select a prescription to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

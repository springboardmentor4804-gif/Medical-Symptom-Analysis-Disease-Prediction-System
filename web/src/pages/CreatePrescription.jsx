import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Trash2, Eye, AlertTriangle, Send, User, Pill, Sparkles } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { api, errorMessage } from '../lib/api'

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other']
const ROUTES = ['Oral', 'Topical', 'Injection', 'Inhalation', 'Other']
const FREQUENCY_PRESETS = ['1-0-0', '0-1-0', '0-0-1', '1-0-1', '1-1-1', '0-1-1', 'Twice daily', 'Thrice daily', 'Once daily', 'As needed']

export default function CreatePrescription() {
  const navigate = useNavigate()
  const [profileComplete, setProfileComplete] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [medications, setMedications] = useState([{
    drug_name: '',
    brand_name: '',
    dosage_form: 'Tablet',
    strength: '',
    frequency: '',
    route: 'Oral',
    duration: '',
    instructions: '',
  }])
  const [patientInfo, setPatientInfo] = useState({
    patient_name: '',
    patient_age: '',
    patient_sex: 'male',
    patient_address: '',
  })
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  // Cascade recommendations for the selected patient's latest assessment.
  const [suggestions, setSuggestions] = useState(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    checkProviderProfile()
    fetchAllUsers()
  }, [])

  const checkProviderProfile = () => {
    api.get('/provider-profile')
      .then((res) => {
        if (res.data.exists) {
          const profile = res.data.profile
          const isComplete = profile.full_name && profile.qualifications && 
                           profile.registration_number && profile.clinic_name && 
                           profile.clinic_address && profile.clinic_contact
          setProfileComplete(isComplete)
        } else {
          setProfileComplete(false)
        }
        setCheckingProfile(false)
      })
      .catch(() => {
        setProfileComplete(false)
        setCheckingProfile(false)
      })
  }

  const fetchAllUsers = () => {
    api.get('/all-assessments')
      .then((res) => {
        const uniqueUsers = {}
        res.data.forEach((assessment) => {
          if (!uniqueUsers[assessment.user_id] && assessment.patient_role === 'patient') {
            uniqueUsers[assessment.user_id] = {
              user_id: assessment.user_id,
              email: assessment.patient_email,
            }
          }
        })
        setAllUsers(Object.values(uniqueUsers))
      })
      .catch((err) => console.error('Failed to load users:', err))
  }

  const addMedication = () => {
    setMedications([...medications, {
      drug_name: '',
      brand_name: '',
      dosage_form: 'Tablet',
      strength: '',
      frequency: '',
      route: 'Oral',
      duration: '',
      instructions: '',
    }])
  }

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index, field, value) => {
    const updated = [...medications]
    if (field === 'drug_name') {
      updated[index][field] = value.toUpperCase() // Auto-uppercase drug names
    } else {
      updated[index][field] = value
    }
    setMedications(updated)
  }

  /* Pull the treatment cascade for whatever this patient was last assessed
     with, so the prescriber can start from it instead of retyping. The SOURCE
     label travels with the drugs and is rendered below - hospital
     co-prescription and patient satisfaction ratings are not interchangeable
     grounds for writing a prescription. */
  const fetchSuggestions = (userId) => {
    if (!userId) { setSuggestions(null); return }
    setLoadingSuggestions(true)
    api.get('/treatment-suggestions', { params: { patient_id: userId } })
      .then((res) => setSuggestions(res.data))
      .catch(() => setSuggestions(null))
      .finally(() => setLoadingSuggestions(false))
  }

  /* Fill the first empty medication row, or append one. Only the drug name is
     copied: strength, frequency, route and duration are the prescriber's
     judgement and the models have no opinion on them. */
  const useSuggestion = (drug) => {
    setMedications((rows) => {
      const next = rows.map((r) => ({ ...r }))
      const slot = next.findIndex((r) => !r.drug_name)
      const blank = {
        drug_name: '', brand_name: '', dosage_form: 'Tablet', strength: '',
        frequency: '', route: 'Oral', duration: '', instructions: '',
      }
      if (slot === -1) next.push({ ...blank, drug_name: drug.toUpperCase() })
      else next[slot].drug_name = drug.toUpperCase()
      return next
    })
  }

  const handlePatientSelect = (userId) => {
    setSelectedPatient(userId)
    fetchSuggestions(userId)
    // In a real app, fetch patient profile here
    // For now, just reset the form
    setPatientInfo({
      patient_name: '',
      patient_age: '',
      patient_sex: 'male',
      patient_address: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate medications
    const validMedications = medications.filter(med => 
      med.drug_name && med.strength && med.frequency && med.duration
    )

    if (validMedications.length === 0) {
      setError('Please add at least one complete medication')
      return
    }

    setLoading(true)
    try {
      await api.post('/prescriptions', {
        patient_id: parseInt(selectedPatient),
        patient_name: patientInfo.patient_name,
        patient_age: parseInt(patientInfo.patient_age),
        patient_sex: patientInfo.patient_sex,
        patient_address: patientInfo.patient_address,
        medications: validMedications,
        additional_notes: additionalNotes,
      })

      setSuccess('Prescription issued successfully! The patient can now view and download it.')
      setTimeout(() => navigate('/analytics'), 2000)
    } catch (err) {
      setError(errorMessage(err, 'Failed to create prescription'))
    } finally {
      setLoading(false)
    }
  }

  if (checkingProfile) {
    return <p className="text-sm text-slate-400">Checking profile…</p>
  }

  if (!profileComplete) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Create Prescription</h1>
        </header>

        <Card className="p-12 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Profile Incomplete</h3>
          <p className="mt-2 text-sm text-slate-600">
            You need to complete your practice details before issuing prescriptions.
          </p>
          <Button onClick={() => navigate('/practice-details')} className="mt-6">
            Complete Profile
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Create Prescription</h1>
        <p className="mt-1 text-sm text-slate-600">
          Issue a legally compliant digital prescription
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardTitle icon={<User className="h-5 w-5" />}>Select Patient</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Choose a patient...</option>
                {allUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Patient Details */}
        {selectedPatient && (
          <Card>
            <CardTitle>Patient Details</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientInfo.patient_name}
                  onChange={(e) => setPatientInfo({...patientInfo, patient_name: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={patientInfo.patient_age}
                  onChange={(e) => setPatientInfo({...patientInfo, patient_age: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  min="0"
                  max="150"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Biological Sex <span className="text-rose-500">*</span>
                </label>
                <select
                  value={patientInfo.patient_sex}
                  onChange={(e) => setPatientInfo({...patientInfo, patient_sex: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={patientInfo.patient_address}
                  onChange={(e) => setPatientInfo({...patientInfo, patient_address: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Medications */}
        {selectedPatient && (
          <Card>
            <CardTitle icon={<Sparkles className="h-5 w-5" />}>
              Suggested from this patient's last assessment
            </CardTitle>

            {loadingSuggestions && (
              <p className="text-sm text-slate-500">Loading recommendations...</p>
            )}

            {!loadingSuggestions && (!suggestions || !suggestions.drugs?.length) && (
              <p className="text-sm text-slate-500">
                {suggestions?.reason
                  || suggestions?.evidence?.caveat
                  || 'No treatment data is available for this patient.'}
              </p>
            )}

            {!loadingSuggestions && suggestions?.drugs?.length > 0 && (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${
                    suggestions.layer === 'mimic'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-violet-100 text-violet-800 border-violet-300'}`}>
                    {suggestions.layer === 'mimic'
                      ? 'Real hospital prescriptions'
                      : 'Patient-reported experience'}
                  </span>
                  {suggestions.disease && (
                    <span className="text-slate-500">
                      assessed as <span className="font-medium text-slate-700">{suggestions.disease}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {suggestions.drugs.map((d, i) => (
                    <button
                      key={`${d.drug}-${i}`}
                      type="button"
                      onClick={() => useSuggestion(d.drug)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50"
                      title={d.drug_class ? `Class: ${d.drug_class}` : 'Add to prescription'}
                    >
                      <Pill className="h-3 w-3 text-slate-400" />
                      {d.drug}
                      <Plus className="h-3 w-3 text-indigo-500" />
                    </button>
                  ))}
                </div>

                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  {suggestions.evidence?.caveat} {suggestions.prescribing_note}
                </p>
              </>
            )}
          </Card>
        )}

        {selectedPatient && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle icon={<FileText className="h-5 w-5" />}>Medications (℞)</CardTitle>
              <Button type="button" size="sm" onClick={addMedication}>
                <Plus className="h-3 w-3" />
                Add Medicine
              </Button>
            </div>

              <div className="space-y-6">
                {medications.map((med, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-4 relative">
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="absolute top-2 right-2 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <p className="text-sm font-medium text-slate-700 mb-3">Medicine #{index + 1}</p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Drug Name (Generic/INN) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.drug_name}
                          onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                          placeholder="PARACETAMOL"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
                          required
                        />
                        <p className="mt-1 text-xs text-slate-500">Generic name in CAPITALS</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Brand Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={med.brand_name}
                          onChange={(e) => updateMedication(index, 'brand_name', e.target.value)}
                          placeholder="Crocin"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Form <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={med.dosage_form}
                          onChange={(e) => updateMedication(index, 'dosage_form', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          required
                        >
                          {DOSAGE_FORMS.map(form => (
                            <option key={form} value={form}>{form}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Strength <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.strength}
                          onChange={(e) => updateMedication(index, 'strength', e.target.value)}
                          placeholder="500mg"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Frequency <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="1-0-1"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          list={`frequency-list-${index}`}
                          required
                        />
                        <datalist id={`frequency-list-${index}`}>
                          {FREQUENCY_PRESETS.map(freq => (
                            <option key={freq} value={freq} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Route <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={med.route}
                          onChange={(e) => updateMedication(index, 'route', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          required
                        >
                          {ROUTES.map(route => (
                            <option key={route} value={route}>{route}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Duration/Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="5 days / 10 tablets"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Instructions
                        </label>
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                          placeholder="Take after food"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Additional Notes */}
        {selectedPatient && (
          <Card>
            <CardTitle>Additional Notes</CardTitle>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional instructions or notes for the patient..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Card>
        )}

        {/* Live Preview */}
        {selectedPatient && showPreview && (
          <Card>
            <CardTitle icon={<Eye className="h-4 w-4" />}>Live Preview</CardTitle>
            <div className="rounded-lg border-2 border-slate-200 bg-white p-6 text-sm">
              <div className="text-center border-b-2 border-slate-300 pb-4 mb-4">
                <p className="font-bold text-lg">Clinic Name</p>
                <p className="text-xs text-slate-600">Address • Contact</p>
              </div>

              <p className="text-xs text-slate-600 mb-2">
                Dr. Name, Qualifications | Reg. No.: XXXXX
              </p>
              <p className="text-xs text-slate-600 mb-4">
                Date: {new Date().toLocaleDateString()}
              </p>

              <div className="mb-4 text-xs">
                <p><strong>Patient:</strong> {patientInfo.patient_name || '—'}</p>
                <p><strong>Age/Sex:</strong> {patientInfo.patient_age || '—'} / {patientInfo.patient_sex}</p>
              </div>

              <p className="text-2xl text-indigo-600 mb-2">℞</p>

              <div className="space-y-3 mb-4">
                {medications.filter(m => m.drug_name).map((med, i) => (
                  <div key={i} className="text-xs border-l-2 border-indigo-200 pl-2">
                    <p className="font-bold">{med.drug_name} {med.brand_name && `(${med.brand_name})`}</p>
                    <p className="text-slate-600">
                      {med.strength} • {med.dosage_form} • {med.frequency} • {med.route}
                    </p>
                    <p className="text-slate-600">Duration: {med.duration}</p>
                    {med.instructions && <p className="italic text-slate-500">{med.instructions}</p>}
                  </div>
                ))}
              </div>

              {additionalNotes && (
                <div className="text-xs mb-4">
                  <p className="font-semibold">Notes:</p>
                  <p className="text-slate-600">{additionalNotes}</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 mt-4">
                <p className="text-xs italic text-slate-500">
                  [Digital Signature]
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Submit */}
        {selectedPatient && (
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4" />
              {loading ? 'Issuing...' : 'Sign & Issue Prescription'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}

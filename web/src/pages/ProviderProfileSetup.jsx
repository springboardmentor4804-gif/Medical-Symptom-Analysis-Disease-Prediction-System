import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Building, FileText, Phone, MapPin, Award, CreditCard, CheckCircle } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { api, errorMessage } from '../lib/api'

export default function ProviderProfileSetup() {
  const navigate = useNavigate()
  const [profileExists, setProfileExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    full_name: '',
    qualifications: '',
    registration_number: '',
    clinic_name: '',
    clinic_address: '',
    clinic_contact: '',
    signature_type: 'typed',
    signature_image: '',
    stamp_image: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = () => {
    setLoading(true)
    api.get('/provider-profile')
      .then((res) => {
        if (res.data.exists) {
          setProfileExists(true)
          setFormData(res.data.profile)
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, 'Failed to load profile'))
        setLoading(false)
      })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await api.post('/provider-profile', formData)
      setSuccess(profileExists ? 'Profile updated successfully!' : 'Profile created successfully!')
      setProfileExists(true)
      setTimeout(() => navigate('/create-prescription'), 1500)
    } catch (err) {
      setError(errorMessage(err, 'Failed to save profile'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  if (loading) return <p className="text-sm text-slate-400">Loading profile…</p>

  const isComplete = formData.full_name && formData.qualifications && 
                     formData.registration_number && formData.clinic_name && 
                     formData.clinic_address && formData.clinic_contact

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Practice Details</h1>
        <p className="mt-1 text-sm text-slate-600">
          {profileExists ? 'Update your professional information' : 'Complete your profile to issue prescriptions'}
        </p>
      </header>

      {!isComplete && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Profile Incomplete</p>
              <p className="text-xs text-amber-700 mt-1">
                Complete all required fields before issuing prescriptions. This information will appear on all prescriptions you create.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardTitle icon={<User className="h-5 w-5" />}>Personal Information</CardTitle>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Dr. John Smith"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Qualifications <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.qualifications}
                onChange={(e) => handleChange('qualifications', e.target.value)}
                placeholder="MBBS, MD (Medicine)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Comma-separated list of your medical qualifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Medical Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                placeholder="NMC/State Medical Council Registration No."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </Card>

        {/* Clinic Information */}
        <Card>
          <CardTitle icon={<Building className="h-5 w-5" />}>Clinic/Hospital Information</CardTitle>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Clinic/Hospital Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => handleChange('clinic_name', e.target.value)}
                placeholder="City General Hospital"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.clinic_address}
                onChange={(e) => handleChange('clinic_address', e.target.value)}
                placeholder="123 Main Street, City, State, PIN Code"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.clinic_contact}
                onChange={(e) => handleChange('clinic_contact', e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </Card>

        {/* Signature Options */}
        <Card>
          <CardTitle icon={<Award className="h-5 w-5" />}>Signature & Stamp</CardTitle>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Signature Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signature_type"
                    value="typed"
                    checked={formData.signature_type === 'typed'}
                    onChange={(e) => handleChange('signature_type', e.target.value)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Typed/Digital Signature</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signature_type"
                    value="uploaded"
                    checked={formData.signature_type === 'uploaded'}
                    onChange={(e) => handleChange('signature_type', e.target.value)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Upload Signature Image</span>
                </label>
              </div>
            </div>

            {formData.signature_type === 'typed' && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                <p className="text-sm text-indigo-900 mb-2">Preview:</p>
                <p className="text-2xl font-serif italic text-indigo-700">
                  {formData.full_name || 'Your Name'}
                </p>
                <p className="text-xs text-indigo-600 mt-1">This will appear as your signature</p>
              </div>
            )}

            {formData.signature_type === 'uploaded' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Signature Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.signature_image}
                  onChange={(e) => handleChange('signature_image', e.target.value)}
                  placeholder="https://example.com/signature.png or base64 data"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Upload your signature image to a service or paste base64 data
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Clinic Stamp Image URL (Optional)
              </label>
              <input
                type="text"
                value={formData.stamp_image}
                onChange={(e) => handleChange('stamp_image', e.target.value)}
                placeholder="https://example.com/stamp.png or base64 data"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional: Add your official clinic stamp to prescriptions
              </p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !isComplete}
          >
            {saving ? 'Saving...' : profileExists ? 'Update Profile' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { Stethoscope, Building2, Award, Phone, MapPin, ShieldCheck, Save, KeyRound } from 'lucide-react';

export default function DoctorProfile() {
  const { currentUser, updateProfile, validatePhone, token } = useAuth();
  const { addToast } = useMedical();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    specialization: currentUser?.specialization || 'General Physician',
    hospital: currentUser?.hospital || 'Clinical Medical Center',
    licenseNumber: currentUser?.licenseNumber || 'MCI-REG-VALID',
    experienceYears: currentUser?.experienceYears || 5,
    location: currentUser?.location || ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        specialization: currentUser.specialization || 'General Physician',
        hospital: currentUser.hospital || 'Clinical Medical Center',
        licenseNumber: currentUser.licenseNumber || 'MCI-REG-VALID',
        experienceYears: currentUser.experienceYears || 5,
        location: currentUser.location || ''
      });
    }
  }, [currentUser]);

  const [phoneError, setPhoneError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      setPhoneError('Phone must be 10 digits starting with 6, 7, 8, or 9.');
      addToast('error', 'Invalid phone number format.');
      return;
    }
    setPhoneError('');
    try {
      await updateProfile(formData);
      addToast('success', 'Provider profile & clinical credentials updated in MongoDB Atlas.');
    } catch (err) {
      addToast('error', err.message || 'Failed updating provider credentials.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Medical Provider Practice Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Accreditation details, hospital affiliations, medical council licensing, and verified physician directory listing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/20">
              <Stethoscope className="w-10 h-10" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{formData.name || 'Doctor'}</h3>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">{formData.specialization}</p>
            <span className="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Healthcare Provider
            </span>
          </div>
        </div>

        {/* Right editable form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name & Titles
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Specialization
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 digits starting with 6-9)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    phoneError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {phoneError && <p className="text-[10px] text-rose-600 mt-1">{phoneError}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Hospital / Clinical Institution
                </label>
                <input
                  type="text"
                  required
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Council License ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Experience (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Provider Credentials</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

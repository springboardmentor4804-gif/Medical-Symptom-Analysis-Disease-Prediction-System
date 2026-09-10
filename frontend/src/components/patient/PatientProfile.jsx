import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { User, Phone, MapPin, Calendar, Heart, ShieldCheck, Save, KeyRound } from 'lucide-react';

export default function PatientProfile() {
  const { currentUser, updateProfile, validatePhone, token } = useAuth();
  const { addToast } = useMedical();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    age: currentUser?.age || '',
    gender: currentUser?.gender || 'Female',
    location: currentUser?.location || '',
    bloodGroup: currentUser?.bloodGroup || 'O+',
    allergies: currentUser?.allergies || 'None',
    emergencyContact: currentUser?.emergencyContact || ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        age: currentUser.age || '',
        gender: currentUser.gender || 'Female',
        location: currentUser.location || '',
        bloodGroup: currentUser.bloodGroup || 'O+',
        allergies: currentUser.allergies || 'None',
        emergencyContact: currentUser.emergencyContact || ''
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
      addToast('success', 'Profile and medical attributes updated in MongoDB Atlas successfully.');
    } catch (err) {
      addToast('error', err.message || 'Failed saving profile updates.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Patient Profile & Clinical Attributes
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal identifiers, emergency contacts, and vital medical history parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card / Verified Session summary */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <h3 className="text-base font-bold text-slate-900">{formData.name || 'Patient'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
            <span className="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Active Patient
            </span>
          </div>
        </div>

        {/* Editable Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10-digits, starts with 6-9)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    phoneError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
                {phoneError && <p className="text-[10px] text-rose-600 mt-1">{phoneError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biological Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Phone Number
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="+91 9845099887"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

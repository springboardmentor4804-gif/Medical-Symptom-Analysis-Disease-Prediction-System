import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('medassist_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse saved session:', e);
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('medassist_token') || null;
  });

  // Re-hydrate full profile from MongoDB Atlas on mount if authenticated
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const savedToken = localStorage.getItem('medassist_token');
      if (!savedToken) return;
      try {
        const freshProfile = await api.getMe();
        if (freshProfile && freshProfile.email) {
          const merged = {
            id: freshProfile.email,
            name: freshProfile.full_name || freshProfile.name || freshProfile.email,
            email: freshProfile.email,
            role: freshProfile.role,
            phone: freshProfile.phone || '',
            age: freshProfile.age || null,
            gender: freshProfile.gender || '',
            location: freshProfile.location || '',
            specialization: freshProfile.specialization || '',
            bloodGroup: freshProfile.bloodGroup || '',
            allergies: freshProfile.allergies || '',
            emergencyContact: freshProfile.emergencyContact || '',
            hospital: freshProfile.hospital || '',
            licenseNumber: freshProfile.licenseNumber || '',
            experienceYears: freshProfile.experienceYears || null,
            token: savedToken
          };
          setCurrentUser(merged);
          localStorage.setItem('medassist_user', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Could not re-sync profile with MongoDB Atlas:', err);
      }
    };

    fetchLatestProfile();
  }, []);

  // Strict Phone Validation: 10 digits starting with 6, 7, 8, or 9
  const validatePhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = String(phone).replace(/[\s\-+()]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  // Strict Password Validation
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength) return 'Password must be at least 8 characters long';
    if (!hasUpper) return 'Password must include at least one uppercase letter (A-Z)';
    if (!hasLower) return 'Password must include at least one lowercase letter (a-z)';
    if (!hasNumber) return 'Password must include at least one number (0-9)';
    if (!hasSpecial) return 'Password must include at least one special character (!@#$%^&*)';

    return null; // Valid
  };

  /**
   * Real database login: queries MongoDB Atlas via FastAPI
   */
  const login = async (email, password, role) => {
    const res = await api.login(email.trim().toLowerCase(), password, role);
    const userObj = {
      id: res.email || email,
      name: res.full_name || email,
      email: res.email || email,
      role: res.role || role,
      phone: res.phone || '',
      age: res.age || null,
      gender: res.gender || '',
      location: res.location || '',
      specialization: res.specialization || '',
      bloodGroup: res.bloodGroup || '',
      allergies: res.allergies || '',
      emergencyContact: res.emergencyContact || '',
      hospital: res.hospital || '',
      licenseNumber: res.licenseNumber || '',
      experienceYears: res.experienceYears || null,
      token: res.access_token
    };

    localStorage.setItem('medassist_token', res.access_token);
    localStorage.setItem('medassist_user', JSON.stringify(userObj));
    setToken(res.access_token);
    setCurrentUser(userObj);
    return { success: true, user: userObj };
  };

  /**
   * Real database registration: strictly validates fields,
   * stores new credentials and profile attributes into MongoDB Atlas
   */
  const register = async (registrationData) => {
    const { name, email, phone, password, role, age, gender, location, specialization } = registrationData;

    // Strict validation checks
    if (!name || name.trim().length < 3) {
      throw new Error('Please enter a valid full name (minimum 3 characters)');
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    const cleanPhone = phone ? String(phone).replace(/[\s\-+()]/g, '') : '';
    if (!validatePhone(cleanPhone)) {
      throw new Error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9');
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new Error(passwordError);
    }
    if (!age || age < 1 || age > 120) {
      throw new Error('Please enter a valid age between 1 and 120');
    }
    if (role === 'doctor' && !specialization) {
      throw new Error('Medical specialization is required for healthcare providers');
    }

    // Call FastAPI backend to insert into MongoDB Atlas (patients or doctors collection)
    const signupRes = await api.signup({
      email: email.trim().toLowerCase(),
      password,
      role: role.toLowerCase(),
      full_name: name.trim(),
      phone: cleanPhone,
      age: Number(age),
      gender: gender || 'Other',
      location: (location || 'Bangalore, India').trim(),
      specialization: role === 'doctor' ? specialization : 'General Physician'
    });

    return signupRes;
  };

  const logout = () => {
    localStorage.removeItem('medassist_user');
    localStorage.removeItem('medassist_token');
    setCurrentUser(null);
    setToken(null);
  };

  /**
   * Update profile and persist changes to MongoDB Atlas
   */
  const updateProfile = async (updatedFields) => {
    try {
      const res = await api.updateProfile(updatedFields);
      const serverUser = res.user || {};
      const updated = {
        ...currentUser,
        ...updatedFields,
        ...serverUser,
        name: serverUser.full_name || updatedFields.name || currentUser?.name
      };
      setCurrentUser(updated);
      localStorage.setItem('medassist_user', JSON.stringify(updated));
      return updated;
    } catch (err) {
      const updated = { ...currentUser, ...updatedFields };
      setCurrentUser(updated);
      localStorage.setItem('medassist_user', JSON.stringify(updated));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isDoctor: currentUser?.role === 'doctor',
        isPatient: currentUser?.role === 'patient',
        login,
        register,
        logout,
        updateProfile,
        validatePhone,
        validatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


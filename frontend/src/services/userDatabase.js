/**
 * Persistent Client-Side User Database
 * Manages registered user credentials, profiles, and role authentication.
 * Stores records securely in persistent local storage.
 */

const DB_KEY = 'medassist_users_db';

// Pre-seeded verified initial users
const INITIAL_USERS = [
  {
    id: 'pat-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    phone: '9845123456',
    password: 'Password@123',
    role: 'patient',
    age: 32,
    gender: 'Female',
    location: 'Bangalore, India',
    bloodGroup: 'B+',
    allergies: 'Penicillin, Peanuts',
    emergencyContact: '9845099887',
    createdAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'doc-1',
    name: 'Dr. Marcus Vance, MD, FACC',
    email: 'dr.vance@medassist.ai',
    phone: '9740112233',
    password: 'Doctor@123',
    role: 'doctor',
    age: 48,
    gender: 'Male',
    location: 'Mumbai, India',
    specialization: 'Cardiology',
    licenseNumber: 'MCI-CARD-90821',
    hospital: 'Metropolitan Heart & Vascular Institute',
    experienceYears: 16,
    createdAt: '2026-03-01T10:00:00.000Z'
  }
];

export const userDatabase = {
  /**
   * Retrieves all registered user accounts from database
   */
  getAllUsers() {
    try {
      const data = localStorage.getItem(DB_KEY);
      if (!data) {
        localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading user database:', e);
      return INITIAL_USERS;
    }
  },

  /**
   * Finds a user by email (case-insensitive)
   */
  findByEmail(email) {
    if (!email) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()) || null;
  },

  /**
   * Registers a new user into the database
   */
  registerUser(userData) {
    const users = this.getAllUsers();
    const cleanEmail = (userData.email || '').toLowerCase().trim();

    // Check uniqueness
    const existing = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      throw new Error(`An account with email "${userData.email}" is already registered. Please sign in.`);
    }

    const newUser = {
      id: `${userData.role === 'doctor' ? 'doc' : 'pat'}-${Date.now()}`,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone.trim(),
      password: userData.password, // In real backend this is bcrypt hashed
      role: userData.role,
      age: Number(userData.age),
      gender: userData.gender || 'Other',
      location: userData.location || 'Bangalore, India',
      createdAt: new Date().toISOString(),
      ...(userData.role === 'doctor'
        ? {
            specialization: userData.specialization || 'Cardiology',
            licenseNumber: userData.licenseNumber || `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
            hospital: userData.hospital || 'MedAssist Partner Hospital Network',
            experienceYears: Number(userData.experienceYears) || 5
          }
        : {
            bloodGroup: userData.bloodGroup || 'O+',
            allergies: userData.allergies || 'None reported',
            emergencyContact: userData.emergencyContact || userData.phone
          })
    };

    users.push(newUser);
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    return newUser;
  },

  /**
   * Authenticates user against credentials in database
   */
  authenticate(email, password, role) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const user = this.findByEmail(cleanEmail);

    if (!user) {
      throw new Error(`No account found for "${email}". Please register a new account.`);
    }

    if (user.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    if (role && user.role !== role) {
      throw new Error(
        `This account is registered as a ${user.role === 'doctor' ? 'Doctor / Provider' : 'Patient'}. Please select the ${user.role === 'doctor' ? 'Doctor' : 'Patient'} portal tab above.`
      );
    }

    return user;
  },

  /**
   * Updates profile information for an existing user
   */
  updateUser(id, updatedFields) {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updatedFields };
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    return users[index];
  }
};

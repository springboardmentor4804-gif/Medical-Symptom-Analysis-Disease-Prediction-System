import { useState, useEffect } from "react";
import { createPatientProfile, getPatientProfile, updatePatientProfile } from "../../services/patientService";
import "../../styles/Patient.css";
import { Link, useNavigate } from "react-router-dom";

function Profile() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        date_of_birth: "",
        gender: "",
        phone: "",
        blood_group: "",
        height_cm: "",
        weight_kg: "",
        emergency_contact_name: "",
        emergency_contact_phone: ""
    });

    const [profileExists, setProfileExists] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const profile = await getPatientProfile();

                setFormData({
                    date_of_birth: profile.date_of_birth || "",
                    gender: profile.gender || "",
                    phone: profile.phone || "",
                    blood_group: profile.blood_group || "",
                    height_cm: profile.height_cm || "",
                    weight_kg: profile.weight_kg || "",
                    emergency_contact_name: profile.emergency_contact_name || "",
                    emergency_contact_phone: profile.emergency_contact_phone || ""
                });
            
                setProfileExists(true);

            } catch (error) {

                console.log("Profile not found");
                setProfileExists(false);
            }

        };

        fetchProfile();

    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };



    
    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const profileData = {
                ...formData,
                height_cm: Number(formData.height_cm),
                weight_kg: Number(formData.weight_kg)
            };

            if (profileExists) {
                await updatePatientProfile(profileData);
                alert("Profile updated successfully!");
            } else {

                    await createPatientProfile(profileData);

                    alert("Profile created successfully!");

                    setProfileExists(true);

                    setIsEditing(false);

                }

            setIsEditing(false);

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Failed to Save Profile"
            );

        }

    };

    return (

    <div className="login-container profile-page">

        <div className="login-card profile-card">

            <Link
                to="/patient/dashboard"
                className="back-button"
            >
                ← Back to Dashboard
            </Link>

            <h1>🏥 MedAssist AI</h1>

            {
                profileExists && !isEditing ? (

                    <>

                        <h2>Patient Profile</h2>

                        <p><strong>Date of Birth:</strong> {formData.date_of_birth}</p>

                        <p><strong>Gender:</strong> {formData.gender}</p>

                        <p><strong>Phone:</strong> {formData.phone}</p>

                        <p><strong>Blood Group:</strong> {formData.blood_group}</p>

                        <p><strong>Height:</strong> {formData.height_cm} cm</p>

                        <p><strong>Weight:</strong> {formData.weight_kg} kg</p>

                        <p>
                            <strong>Emergency Contact:</strong>{" "}
                            {formData.emergency_contact_name}
                        </p>

                        <p>
                            <strong>Emergency Contact Phone:</strong>{" "}
                            {formData.emergency_contact_phone}
                        </p>

                        <br />

                        <button
                            className="primary-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Update Profile
                        </button>

                    </>

                ) : (

                    <>

                        <h2>
                            {profileExists
                                ? "Update Profile"
                                : "Complete Your Profile"}
                        </h2>

                        <p>Please provide your medical information.</p>

                        <form onSubmit={handleSubmit}>

                            <div className="form-group">
                                <label>Date of Birth</label>

                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Gender</label>

                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter Phone Number"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Group</label>

                                <select
                                    name="blood_group"
                                    value={formData.blood_group}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Blood Group</option>
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

                            <div className="form-group">
                                <label>Height (cm)</label>

                                <input
                                    type="number"
                                    name="height_cm"
                                    value={formData.height_cm}
                                    onChange={handleChange}
                                    placeholder="Enter Height"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Weight (kg)</label>

                                <input
                                    type="number"
                                    name="weight_kg"
                                    value={formData.weight_kg}
                                    onChange={handleChange}
                                    placeholder="Enter Weight"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Emergency Contact Name</label>

                                <input
                                    type="text"
                                    name="emergency_contact_name"
                                    value={formData.emergency_contact_name}
                                    onChange={handleChange}
                                    placeholder="Enter Emergency Contact Name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Emergency Contact Phone</label>

                                <input
                                    type="text"
                                    name="emergency_contact_phone"
                                    value={formData.emergency_contact_phone}
                                    onChange={handleChange}
                                    placeholder="Enter Emergency Contact Phone"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="primary-btn"
                            >
                                {
                                    profileExists
                                        ? "Save Changes"
                                        : "Save Profile"
                                }
                            </button>

                        </form>

                    </>

                )

            }

        </div>

    </div>

);
}

export default Profile;

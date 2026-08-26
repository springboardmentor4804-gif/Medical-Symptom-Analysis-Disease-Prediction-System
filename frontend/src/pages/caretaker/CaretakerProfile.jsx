import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    FaArrowLeft,
    FaPhone,
    FaBriefcase,
    FaHospital,
    FaUserMd,
    FaAward,
    FaSave,
    FaEdit,
    FaIdBadge
} from "react-icons/fa";

import {
    createCaretakerProfile,
    getCaretakerProfile,
    updateCaretakerProfile
} from "../../services/caretakerService";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Form.css";
import "../../styles/Button.css";

function CaretakerProfile() {

    const [editing, setEditing] = useState(true);

    const [formData, setFormData] = useState({

        phone: "",

        profession: "",

        organization: "",

        years_of_experience: "",

        specialization: ""

    });

    useEffect(() => {

        loadProfile();

    }, []);

    const loadProfile = async () => {

        try {

            const data = await getCaretakerProfile();

            setFormData({

                phone: data.phone || "",

                profession: data.profession || "",

                organization: data.organization || "",

                years_of_experience: data.years_of_experience || "",

                specialization: data.specialization || ""

            });

            setEditing(false);

        }

        catch (error) {

            console.log("No profile found. Create one.");

            setEditing(true);

        }

    };

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editing) {

                await createCaretakerProfile(formData);

            }

            else {

                await updateCaretakerProfile(formData);

            }

            alert("Profile saved successfully.");

            loadProfile();

        }

        catch (error) {

            console.error(error);

            alert("Failed to save profile.");

        }

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <Link
                    to="/caretaker/dashboard"
                    className="secondary-btn"
                    style={{
                        marginBottom: "25px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px"
                    }}
                >

                    <FaArrowLeft />

                    Back to Dashboard

                </Link>

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="dashboard-brand">

                            <FaHospital />

                            MedAssist AI

                        </div>

                        <h1>

                            Caretaker Profile

                        </h1>

                        <p>

                            Keep your professional information up to date.
                            This information helps patients identify your
                            expertise and enables seamless healthcare
                            collaboration.

                        </p>

                    </div>

                    <div className="hero-image">

                        <div className="hero-icon-circle">

                            <FaUserMd />

                        </div>

                    </div>

                </section>

                <div
                    className="glass-card"
                    style={{
                        marginTop: "40px"
                    }}
                >

                    <form onSubmit={handleSubmit}>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                                gap: "25px"
                            }}
                        >

                                                        <div className="form-group">

                                <label>

                                    Phone Number

                                </label>

                                <div
                                    style={{
                                        position: "relative"
                                    }}
                                >

                                    <FaPhone
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "18px",
                                            color: "#42a5f5"
                                        }}
                                    />

                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-input"
                                        style={{
                                            paddingLeft: "50px"
                                        }}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Enter phone number"
                                        required
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>

                                    Profession

                                </label>

                                <div
                                    style={{
                                        position: "relative"
                                    }}
                                >

                                    <FaBriefcase
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "18px",
                                            color: "#42a5f5"
                                        }}
                                    />

                                    <input
                                        type="text"
                                        name="profession"
                                        className="form-input"
                                        style={{
                                            paddingLeft: "50px"
                                        }}
                                        value={formData.profession}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Doctor, Nurse, Caregiver..."
                                        required
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>

                                    Organization

                                </label>

                                <div
                                    style={{
                                        position: "relative"
                                    }}
                                >

                                    <FaHospital
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "18px",
                                            color: "#42a5f5"
                                        }}
                                    />

                                    <input
                                        type="text"
                                        name="organization"
                                        className="form-input"
                                        style={{
                                            paddingLeft: "50px"
                                        }}
                                        value={formData.organization}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Hospital / Clinic"
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>

                                    Years of Experience

                                </label>

                                <div
                                    style={{
                                        position: "relative"
                                    }}
                                >

                                    <FaAward
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "18px",
                                            color: "#42a5f5"
                                        }}
                                    />

                                    <input
                                        type="number"
                                        name="years_of_experience"
                                        className="form-input"
                                        style={{
                                            paddingLeft: "50px"
                                        }}
                                        value={formData.years_of_experience}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Years of experience"
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>

                                    Specialization

                                </label>

                                <div
                                    style={{
                                        position: "relative"
                                    }}
                                >

                                    <FaIdBadge
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "18px",
                                            color: "#42a5f5"
                                        }}
                                    />

                                    <input
                                        type="text"
                                        name="specialization"
                                        className="form-input"
                                        style={{
                                            paddingLeft: "50px"
                                        }}
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Cardiology, General Care..."
                                    />

                                </div>

                            </div>

                        </div>

                        <div
                            style={{
                                marginTop: "35px",
                                display: "flex",
                                justifyContent: "center"
                            }}
                        >

                            {editing ? (

                                <button
                                    type="submit"
                                    className="primary-btn large-btn"
                                >

                                    <FaSave />

                                    Save Profile

                                </button>

                            ) : (

                                <button
                                    type="button"
                                    className="primary-btn large-btn"
                                    onClick={() => setEditing(true)}
                                >

                                    <FaEdit />

                                    Update Profile

                                </button>

                            )}

                        </div>

                                        </form>

                </div>

                <div
                    className="glass-card"
                    style={{
                        marginTop: "35px"
                    }}
                >

                    <div className="section-header">

                        <h2>

                            Professional Information

                        </h2>

                        <p>

                            Your profile helps patients understand your
                            qualifications and experience before collaborating
                            with you.

                        </p>

                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "20px",
                            marginTop: "25px"
                        }}
                    >

                        <div className="feature-item">

                            <FaUserMd />

                            Professional Profile

                        </div>

                        <div className="feature-item">

                            <FaHospital />

                            Healthcare Organization

                        </div>

                        <div className="feature-item">

                            <FaAward />

                            Verified Experience

                        </div>

                        <div className="feature-item">

                            <FaIdBadge />

                            Area of Specialization

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default CaretakerProfile;
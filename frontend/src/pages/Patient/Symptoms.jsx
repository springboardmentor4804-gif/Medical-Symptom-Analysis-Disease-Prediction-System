import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    FaArrowLeft,
    FaHeartbeat,
    FaSearch,
    FaCheckCircle,
    FaStethoscope,
    FaClipboardList
} from "react-icons/fa";

import {
    getAvailableSymptoms,
    addPatientSymptom,
    getPatientSymptoms,
    deletePatientSymptom
} from "../../services/patientService";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Form.css";
import "../../styles/Button.css";

function Symptoms() {

    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedSymptoms, setSelectedSymptoms] = useState([]);

    const [savedSymptoms, setSavedSymptoms] = useState([]);

    useEffect(() => {
        fetchSymptoms();
        fetchSavedSymptoms();
    }, []);

    const fetchSymptoms = async () => {

        try {

            const data = await getAvailableSymptoms();

            setSymptoms(data.symptoms);

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                error.message
            );

        } finally {

            setLoading(false);

        }

    };

    const fetchSavedSymptoms = async () => {

        try {

            const response = await getPatientSymptoms();

            setSavedSymptoms(response.symptoms);

        } catch (error) {

            console.error(error);

        }

    };

    const filteredSymptoms = useMemo(() => {

        if (searchTerm.trim() === "") return [];

        return symptoms.filter((symptom) =>
            symptom
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );

    }, [searchTerm, symptoms]);

    const handleCheckboxChange = (symptom) => {

        const exists = selectedSymptoms.find(
            (item) => item.symptom_name === symptom
        );

        if (exists) {

            setSelectedSymptoms(

                selectedSymptoms.filter(
                    (item) => item.symptom_name !== symptom
                )

            );

        } else {

            setSelectedSymptoms([

                ...selectedSymptoms,

                {
                    symptom_name: symptom,
                    severity: "Mild"
                }

            ]);

        }

    };

    const handleSeverityChange = (symptom, severity) => {

        setSelectedSymptoms(

            selectedSymptoms.map((item) =>

                item.symptom_name === symptom

                    ? {
                        ...item,
                        severity
                    }

                    : item

            )

        );

    };

    const handleSaveSymptoms = async () => {

        try {

            if (selectedSymptoms.length === 0) {

                alert("Please select at least one symptom.");

                return;

            }

            const existingSymptoms = savedSymptoms.map(
                (item) => item.symptom_name.toLowerCase()
            );

            const duplicateSymptoms = selectedSymptoms.filter(

                (item) =>

                    existingSymptoms.includes(

                        item.symptom_name.toLowerCase()

                    )

            );

            if (duplicateSymptoms.length > 0) {

                alert(
                    `These symptom(s) are already saved: ${duplicateSymptoms
                        .map((item) => item.symptom_name)
                        .join(", ")}`
                );

                return;

            }


                 // Save new symptoms

            for (const symptom of selectedSymptoms) {

                await addPatientSymptom({

                    symptom_name: symptom.symptom_name,
                    severity: symptom.severity

                });

            }

            alert("Symptoms saved successfully!");

            setSelectedSymptoms([]);

            fetchSavedSymptoms();

        } catch (error) {

            console.error(error);

            alert(

                error.response?.data?.detail ||

                "Failed to save symptoms."

            );

        }

    };

    const handleDeleteSymptom = async (symptomId) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to delete this symptom?"

        );

        if (!confirmDelete) return;

        try {

            await deletePatientSymptom(symptomId);

            alert("Symptom deleted successfully!");

            fetchSavedSymptoms();

        } catch (error) {

            console.error(error);

            alert(

                error.response?.data?.detail ||

                "Failed to delete symptom."

            );

        }

    };

    return (

        <div className="dashboard-page">

            <div className="dashboard-overlay">

                <div className="dashboard-container">

                    <Link
                        to="/patient/dashboard"
                        className="back-button"
                    >
                        <FaArrowLeft />
                        Back to Dashboard
                    </Link>

                    <div className="dashboard-hero">

                        <div>

                            <span className="hero-badge">

                                <FaHeartbeat />

                                Patient Module

                            </span>

                            <h1>

                                Symptom Tracker

                            </h1>

                            <p>

                                Search symptoms, assign severity,

                                and maintain an accurate health record

                                for disease prediction.

                            </p>

                        </div>

                    </div>

                    <div className="dashboard-stats">

                        <div className="dashboard-card">

                            <FaClipboardList className="card-icon" />

                            <h3>Total Symptoms</h3>

                            <h2>{symptoms.length}</h2>

                        </div>

                        <div className="dashboard-card">

                            <FaCheckCircle className="card-icon" />

                            <h3>Selected</h3>

                            <h2>{selectedSymptoms.length}</h2>

                        </div>

                        <div className="dashboard-card">

                            <FaStethoscope className="card-icon" />

                            <h3>Saved Records</h3>

                            <h2>{savedSymptoms.length}</h2>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Search Symptoms

                            </h2>

                            <p>

                                Start typing to search from the

                                available medical symptom database.

                            </p>

                        </div>

                        <div className="search-box">

                            <FaSearch className="search-icon" />

                            <input

                                type="text"

                                placeholder="Search symptoms..."

                                value={searchTerm}

                                onChange={(e) =>

                                    setSearchTerm(e.target.value)

                                }

                            />

                        </div>

                        {

                            loading ? (

                                <div className="loading-section">

                                    Loading symptoms...

                                </div>

                            ) : (

                                <div className="symptom-grid">

                                    {

                                        filteredSymptoms.map(

                                            (symptom, index) => {

                                                const checked =

                                                    selectedSymptoms.some(

                                                        (item) =>

                                                            item.symptom_name === symptom

                                                    );

                                                return (

                                                    <label

                                                        key={index}

                                                        className={`symptom-chip ${checked ? "active" : ""}`}

                                                    >

                                                        <input

                                                            type="checkbox"

                                                            checked={checked}

                                                            onChange={() =>

                                                                handleCheckboxChange(symptom)

                                                            }

                                                        />

                                                        <span>

                                                            {symptom}

                                                        </span>

                                                    </label>

                                                );

                                            }

                                        )

                                    }

                                </div>

                            )

                        }

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Selected Symptoms

                            </h2>

                            <p>

                                Choose the severity before saving.

                            </p>

                        </div>

                        {

                            selectedSymptoms.length === 0 ?

                            (

                                <div className="empty-card">

                                    No symptoms selected yet.

                                </div>

                            )

                            :

                            (

                                <div className="selected-list">

                                    {

                                        selectedSymptoms.map(

                                            (item, index) => (

                                                <div

                                                    key={index}

                                                    className="selected-item"

                                                >

                                                    <div>

                                                        <strong>

                                                            {item.symptom_name}

                                                        </strong>

                                                    </div>

                                                    <select

                                                        value={item.severity}

                                                        onChange={(e)=>

                                                            handleSeverityChange(

                                                                item.symptom_name,

                                                                e.target.value

                                                            )

                                                        }

                                                    >

                                                        <option value="Mild">

                                                            Mild

                                                        </option>

                                                        <option value="Moderate">

                                                            Moderate

                                                        </option>

                                                        <option value="Severe">

                                                            Severe

                                                        </option>

                                                    </select>

                                                </div>

                                            )

                                        )

                                    }

                                </div>

                            )

                        }

                        <div className="button-group">

                            <button

                                className="primary-btn"

                                disabled={selectedSymptoms.length===0}

                                onClick={handleSaveSymptoms}

                            >

                                Save Symptoms

                            </button>

                        </div>

                    </div>

                    
                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Previously Saved Symptoms

                            </h2>

                            <p>

                                Review and manage your symptom history.

                            </p>

                        </div>

                        {

                            savedSymptoms.length === 0 ?

                            (

                                <div className="empty-card">

                                    No saved symptoms found.

                                </div>

                            )

                            :

                            (

                                <div className="table-responsive">

                                    <table className="dashboard-table">

                                        <thead>

                                            <tr>

                                                <th>Symptom</th>

                                                <th>Severity</th>

                                                <th>Recorded At</th>

                                                <th>Action</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {

                                                savedSymptoms.map((item) => (

                                                    <tr key={item.id}>

                                                        <td>

                                                            {item.symptom_name}

                                                        </td>

                                                        <td>

                                                            <span

                                                                className={`severity-badge ${item.severity.toLowerCase()}`}

                                                            >

                                                                {item.severity}

                                                            </span>

                                                        </td>

                                                        <td>

                                                            {

                                                                new Date(

                                                                    item.recorded_at

                                                                ).toLocaleString()

                                                            }

                                                        </td>

                                                        <td>

                                                            <button

                                                                className="danger-btn"

                                                                onClick={() =>

                                                                    handleDeleteSymptom(

                                                                        item.id

                                                                    )

                                                                }

                                                            >

                                                                Delete

                                                            </button>

                                                        </td>

                                                    </tr>

                                                ))

                                            }

                                        </tbody>

                                    </table>

                                </div>

                            )

                        }

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Symptoms;
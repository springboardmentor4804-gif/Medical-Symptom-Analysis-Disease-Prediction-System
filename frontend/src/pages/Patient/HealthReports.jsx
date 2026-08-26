import { Link } from "react-router-dom";
import { useState } from "react";

import {
    FaArrowLeft,
    FaFileMedical,
    FaCloudUploadAlt,
    FaFolderOpen,
    FaHeartbeat,
    FaFilePdf,
    FaNotesMedical
} from "react-icons/fa";

import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";
import "../../styles/Patient.css";

function HealthReports() {

    const [selectedFile, setSelectedFile] = useState(null);

    const [reportType, setReportType] = useState("");

    const [reports, setReports] = useState([

        {
            id: 1,
            type: "Blood Test",
            name: "Blood_Test_Report.pdf",
            uploadedOn: "29-Jul-2026"
        }

    ]);

    const handleFileChange = (event) => {

        setSelectedFile(event.target.files[0]);

    };

    const handleUpload = () => {

        if (!reportType) {

            alert("Please select the report type.");

            return;

        }

        if (!selectedFile) {

            alert("Please select a report.");

            return;

        }

        const newReport = {

            id: reports.length + 1,

            type: reportType,

            name: selectedFile.name,

            uploadedOn: new Date().toLocaleDateString()

        };

        setReports([...reports, newReport]);

        alert("Report uploaded successfully.");

        setSelectedFile(null);

        setReportType("");

        document.getElementById("reportUpload").value = "";

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <Link
                    to="/patient/dashboard"
                    className="back-button"
                >
                    <FaArrowLeft />
                    Back to Dashboard
                </Link>

                <section className="dashboard-hero">

                    <div className="hero-left">

                        <div className="dashboard-brand">

                            <FaFileMedical />

                            MedAssist AI

                        </div>

                        <h1>

                            Health Reports

                        </h1>

                        <p>

                            Securely upload, organize and access all your
                            medical reports in one place. Maintain a complete
                            digital health history for faster diagnosis and
                            better treatment.

                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaCloudUploadAlt />

                            Reports

                        </div>

                    </div>

                </section>

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaFolderOpen />

                        <h3>Total Reports</h3>

                        <h2>{reports.length}</h2>

                    </div>

                    <div className="stats-card">

                        <FaCloudUploadAlt />

                        <h3>Upload Status</h3>

                        <h2>Ready</h2>

                    </div>

                    <div className="stats-card">

                        <FaHeartbeat />

                        <h3>Health Records</h3>

                        <h2>Secure</h2>

                    </div>

                    <div className="stats-card">

                        <FaNotesMedical />

                        <h3>Medical Files</h3>

                        <h2>Digital</h2>

                    </div>

                </section>

                                <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Upload New Report</h2>

                                <p>

                                    Upload laboratory reports, prescriptions,
                                    scans and other medical documents securely.

                                </p>

                            </div>

                        </div>

                        <div className="form-grid">

                            <div className="form-group">

                                <label>

                                    Report Type

                                </label>

                                <select
                                    className="form-input"
                                    value={reportType}
                                    onChange={(e) =>
                                        setReportType(e.target.value)
                                    }
                                >

                                    <option value="">
                                        Select Report Type
                                    </option>

                                    <option>
                                        Blood Test
                                    </option>

                                    <option>
                                        X-Ray
                                    </option>

                                    <option>
                                        MRI Scan
                                    </option>

                                    <option>
                                        CT Scan
                                    </option>

                                    <option>
                                        ECG
                                    </option>

                                    <option>
                                        Prescription
                                    </option>

                                    <option>
                                        Discharge Summary
                                    </option>

                                    <option>
                                        Other
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>

                                    Medical Report

                                </label>

                                <input
                                    id="reportUpload"
                                    className="form-input"
                                    type="file"
                                    onChange={handleFileChange}
                                />

                            </div>

                        </div>

                        {

                            selectedFile && (

                                <div className="selected-file-card">

                                    <FaFilePdf />

                                    <div>

                                        <strong>

                                            {selectedFile.name}

                                        </strong>

                                        <p>

                                            Ready for upload

                                        </p>

                                    </div>

                                </div>

                            )

                        }

                        <div className="action-buttons">

                            <button
                                className="primary-btn"
                                onClick={handleUpload}
                            >

                                <FaCloudUploadAlt />

                                Upload Report

                            </button>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>

                                    Upload Guidelines

                                </h2>

                                <p>

                                    Tips for maintaining your digital
                                    medical records.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-features">

                            <div className="feature-item">

                                ✅ Upload clear PDF or image files.

                            </div>

                            <div className="feature-item">

                                ✅ Choose the correct report category.

                            </div>

                            <div className="feature-item">

                                ✅ Keep reports updated after every visit.

                            </div>

                            <div className="feature-item">

                                ✅ Your reports remain securely stored.

                            </div>

                            <div className="feature-item">

                                ✅ Share reports easily with caretakers.

                            </div>

                        </div>

                    </div>

                </div>

                                <div className="glass-card">

                    <div className="section-header">

                        <div>

                            <h2>Uploaded Reports</h2>

                            <p>

                                View all your uploaded medical reports.

                            </p>

                        </div>

                    </div>

                    {

                        reports.length === 0 ? (

                            <div className="empty-state">

                                <FaFileMedical size={60} />

                                <h3>No Reports Uploaded</h3>

                                <p>

                                    Upload your first medical report to
                                    maintain your digital health records.

                                </p>

                            </div>

                        ) : (

                            <div className="table-responsive">

                                <table className="dashboard-table">

                                    <thead>

                                        <tr>

                                            <th>Report Type</th>

                                            <th>File Name</th>

                                            <th>Uploaded On</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {

                                            reports.map((report) => (

                                                <tr key={report.id}>

                                                    <td>

                                                        <span className="status-badge info">

                                                            {report.type}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="file-cell">

                                                            <FaFilePdf />

                                                            <span>

                                                                {report.name}

                                                            </span>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        {report.uploadedOn}

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

    );

}

export default HealthReports;
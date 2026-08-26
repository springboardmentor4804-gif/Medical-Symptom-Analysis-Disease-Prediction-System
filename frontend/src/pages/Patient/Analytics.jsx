import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    FaArrowLeft,
    FaChartBar,
    FaHeartbeat,
    FaUsers,
    FaRobot,
    FaClipboardList,
    FaShieldAlt,
    FaChartLine
} from "react-icons/fa";

import {
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    XAxis, YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

import {
    getAnalyticsSummary,
    getDiseaseDistribution,
    getSymptomFrequency,
    getRiskDistribution,
    getMonthlyTrends,
    getRecentPredictions
} from "../../services/analyticsService";

import "../../styles/Dashboard.css";
import "../../styles/Patient.css";


const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#06b6d4",
    "#10b981", "#f59e0b", "#ef4444",
    "#ec4899", "#14b8a6", "#6366f1",
    "#f97316", "#84cc16", "#a855f7",
    "#22d3ee", "#fb923c", "#4ade80"
];


function Analytics() {

    const [summary, setSummary] = useState(null);
    const [diseases, setDiseases] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [riskData, setRiskData] = useState(null);
    const [trends, setTrends] = useState([]);
    const [recentPredictions, setRecentPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const [
                summaryData,
                diseaseData,
                symptomData,
                riskDistData,
                trendData,
                recentData
            ] = await Promise.all([
                getAnalyticsSummary(),
                getDiseaseDistribution(),
                getSymptomFrequency(),
                getRiskDistribution(),
                getMonthlyTrends(),
                getRecentPredictions()
            ]);

            setSummary(summaryData);
            setDiseases(diseaseData.diseases || []);
            setSymptoms(symptomData.symptoms || []);
            setRiskData(riskDistData);
            setTrends(trendData.trends || []);
            setRecentPredictions(recentData.predictions || []);

        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    };


    // Format month label: "2026-08" -> "Aug"
    const formatMonth = (monthStr) => {
        if (!monthStr) return "";
        const date = new Date(monthStr + "-01");
        return date.toLocaleString("default", { month: "short" });
    };


    if (loading) {
        return (
            <div className="patient-dashboard">
                <div className="dashboard-overlay"></div>
                <div className="dashboard-content">
                    <div className="glass-card">
                        <h2>Loading Analytics...</h2>
                        <p>Gathering healthcare data and statistics.</p>
                    </div>
                </div>
            </div>
        );
    }


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


                {/* Hero */}
                <section className="dashboard-hero">
                    <div className="hero-left">
                        <div className="dashboard-brand">
                            <FaChartBar />
                            MedAssist AI
                        </div>
                        <h1>Healthcare Analytics</h1>
                        <p>
                            Comprehensive overview of disease predictions,
                            symptom trends, risk assessments, and health
                            analytics across the platform.
                        </p>
                    </div>
                    <div className="hero-right">
                        <div className="hero-badge">
                            <FaChartLine />
                            Analytics
                        </div>
                    </div>
                </section>


                {/* Summary Stats */}
                {summary && (
                    <section className="stats-grid">

                        <div className="stats-card">
                            <FaUsers />
                            <h3>Total Patients</h3>
                            <h2>{summary.total_patients}</h2>
                        </div>

                        <div className="stats-card">
                            <FaRobot />
                            <h3>AI Predictions</h3>
                            <h2>{summary.total_predictions}</h2>
                        </div>

                        <div className="stats-card">
                            <FaClipboardList />
                            <h3>Symptoms Logged</h3>
                            <h2>{summary.total_symptoms}</h2>
                        </div>

                        <div className="stats-card">
                            <FaShieldAlt />
                            <h3>Risk Assessments</h3>
                            <h2>{summary.total_risk_assessments}</h2>
                        </div>

                    </section>
                )}


                {/* ========================= */}
                {/* MONTHLY TRENDS CHARTS     */}
                {/* ========================= */}

                {trends.length > 0 && (

                    <div className="glass-card" style={{ marginBottom: "25px" }}>

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaChartLine style={{ marginRight: "10px" }} />
                                    Health Trends (Monthly)
                                </h2>
                                <p>
                                    Monthly trends showing disease predictions,
                                    risk assessments, and symptom logging activity.
                                </p>
                            </div>
                        </div>

                        {/* Disease Predictions Line Chart */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{
                                color: "#e2e8f0",
                                marginBottom: "15px"
                            }}>
                                Disease Predictions Over Time
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={trends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.1)"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonth}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(30,41,59,0.95)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            color: "#e2e8f0"
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predictions"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: "#3b82f6", r: 5 }}
                                        name="Predictions"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Risk Assessments Bar Chart */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{
                                color: "#e2e8f0",
                                marginBottom: "15px"
                            }}>
                                Risk Assessments Over Time
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={trends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.1)"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonth}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(30,41,59,0.95)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            color: "#e2e8f0"
                                        }}
                                    />
                                    <Bar
                                        dataKey="risk_assessments"
                                        fill="#8b5cf6"
                                        radius={[6, 6, 0, 0]}
                                        name="Risk Assessments"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Symptoms Area Chart */}
                        <div>
                            <h3 style={{
                                color: "#e2e8f0",
                                marginBottom: "15px"
                            }}>
                                Symptom Logging Trends
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={trends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.1)"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonth}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(30,41,59,0.95)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            color: "#e2e8f0"
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="symptoms"
                                        stroke="#10b981"
                                        fill="rgba(16,185,129,0.2)"
                                        strokeWidth={2}
                                        name="Symptoms"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                )}


                {/* ========================= */}
                {/* DISEASE DISTRIBUTION       */}
                {/* ========================= */}

                <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaHeartbeat style={{ marginRight: "10px" }} />
                                    Disease Distribution
                                </h2>
                                <p>
                                    Top predicted diseases across all patients.
                                </p>
                            </div>
                        </div>

                        {diseases.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={diseases}
                                        layout="vertical"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.1)"
                                        />
                                        <XAxis
                                            type="number"
                                            stroke="#94a3b8"
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="disease"
                                            width={120}
                                            stroke="#94a3b8"
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: "rgba(30,41,59,0.95)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                                color: "#e2e8f0"
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Cases"
                                            radius={[0, 6, 6, 0]}
                                        >
                                            {diseases.map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <div className="feature-item">
                                No disease prediction data available yet.
                            </div>
                        )}

                    </div>


                    {/* SYMPTOM FREQUENCY */}

                    <div className="glass-card">

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaClipboardList style={{ marginRight: "10px" }} />
                                    Most Common Symptoms
                                </h2>
                                <p>
                                    Top symptoms logged by patients.
                                </p>
                            </div>
                        </div>

                        {symptoms.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={symptoms}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.1)"
                                    />
                                    <XAxis
                                        dataKey="symptom"
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(30,41,59,0.95)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            color: "#e2e8f0"
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Times Logged"
                                        radius={[6, 6, 0, 0]}
                                    >
                                        {symptoms.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="feature-item">
                                No symptom data available yet.
                            </div>
                        )}

                    </div>

                </div>


                {/* ========================= */}
                {/* RISK & RECENT PREDICTIONS  */}
                {/* ========================= */}

                <div className="dashboard-grid">

                    {/* RISK DISTRIBUTION */}
                    <div className="glass-card">

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaShieldAlt style={{ marginRight: "10px" }} />
                                    Risk Assessment Overview
                                </h2>
                                <p>
                                    Distribution of positive vs negative
                                    risk outcomes.
                                </p>
                            </div>
                        </div>

                        {riskData && riskData.outcomes && riskData.outcomes.length > 0 ? (
                            <div className="stats-grid">
                                {riskData.outcomes.map((item, index) => (
                                    <div className="stats-card" key={index}>
                                        <FaShieldAlt style={{
                                            color: item.outcome === "Positive"
                                                ? "#ef4444"
                                                : "#22c55e"
                                        }} />
                                        <h3>{item.outcome}</h3>
                                        <h2>{item.count}</h2>
                                        <p style={{
                                            fontSize: "12px",
                                            color: "#94a3b8"
                                        }}>
                                            {item.percentage}%
                                        </p>
                                    </div>
                                ))}
                                <div className="stats-card">
                                    <FaChartBar />
                                    <h3>Total</h3>
                                    <h2>{riskData.total}</h2>
                                </div>
                            </div>
                        ) : (
                            <div className="feature-item">
                                No risk assessment data available yet.
                            </div>
                        )}

                    </div>


                    {/* RECENT PREDICTIONS TABLE */}
                    <div className="glass-card">

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaRobot style={{ marginRight: "10px" }} />
                                    Recent Predictions
                                </h2>
                                <p>
                                    Latest AI disease predictions across the platform.
                                </p>
                            </div>
                        </div>

                        {recentPredictions.length > 0 ? (
                            <div className="table-responsive">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Disease</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPredictions.map((pred) => (
                                            <tr key={pred.id}>
                                                <td>{pred.patient_name}</td>
                                                <td>{pred.predicted_disease}</td>
                                                <td>
                                                    {new Date(
                                                        pred.created_at
                                                    ).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="feature-item">
                                No predictions recorded yet.
                            </div>
                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Analytics;

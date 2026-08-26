import { NavLink } from "react-router-dom";
import {
    FaHome,
    FaUser,
    FaHeartbeat,
    FaRobot,
    FaHistory,
    FaLightbulb,
    FaFileMedical,
    FaUserNurse,
    FaSignOutAlt,
    FaChartBar
} from "react-icons/fa";

import "../styles/Sidebar.css";

function Sidebar({ logout }) {

    return (

        <aside className="sidebar">

            <h2 className="sidebar-logo">

                🏥 MedAssist

            </h2>

            <nav>

                <NavLink to="/patient/dashboard" className="sidebar-link">
                    <FaHome />
                    Dashboard
                </NavLink>

                <NavLink to="/patient/profile" className="sidebar-link">
                    <FaUser />
                    Profile
                </NavLink>

                <NavLink to="/patient/symptoms" className="sidebar-link">
                    <FaHeartbeat />
                    Symptoms
                </NavLink>

                <NavLink to="/patient/disease-prediction" className="sidebar-link">
                    <FaRobot />
                    Prediction
                </NavLink>

                <NavLink to="/patient/medical-history" className="sidebar-link">
                    <FaHistory />
                    History
                </NavLink>

                <NavLink to="/patient/recommendations" className="sidebar-link">
                    <FaLightbulb />
                    Recommendations
                </NavLink>

                <NavLink to="/patient/health-reports" className="sidebar-link">
                    <FaFileMedical />
                    Reports
                </NavLink>

                <NavLink to="/patient/analytics" className="sidebar-link">
                    <FaChartBar />
                    Analytics
                </NavLink>

                <NavLink to="/patient/select-caretaker" className="sidebar-link">
                    <FaUserNurse />
                    Caretaker
                </NavLink>

            </nav>

            <button
                className="logout-btn"
                onClick={logout}
            >
                <FaSignOutAlt />
                Logout
            </button>

        </aside>

    );

}

export default Sidebar;
import { Link, useLocation } from "react-router-dom";
import { FaHospital, FaUserCircle } from "react-icons/fa";

import "../styles/AppShell.css";

function Navbar() {
    const { pathname } = useLocation();
    const isCaretaker = pathname.startsWith("/caretaker");
    const dashboardPath = isCaretaker
        ? "/caretaker/dashboard"
        : "/patient/dashboard";

    return (
        <header className="app-navbar">
            <Link to={dashboardPath} className="app-navbar__brand">
                <FaHospital />
                <span>MedAssist AI</span>
            </Link>
            <Link to={dashboardPath} className="app-navbar__profile">
                <FaUserCircle />
                <span>{isCaretaker ? "Caretaker portal" : "Patient portal"}</span>
            </Link>
        </header>
    );
}

export default Navbar;

import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import "../styles/AppShell.css";

function AppShell() {
    return (
        <div className="app-shell">
            <Navbar />
            <main className="app-shell-main">
                <Outlet />
            </main>
        </div>
    );
}

export default AppShell;

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/Layout.css";

function Layout({ children, logout }) {

    return (

        <div className="layout">

            <Sidebar logout={logout} />

            <div className="layout-content">

                <Navbar />

                <div className="page-content">

                    {children}

                </div>

            </div>

        </div>

    );

}

export default Layout;
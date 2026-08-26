import { Link } from "react-router-dom";
import "../styles/Home.css";

import {
  FaHeartbeat,
  FaUserMd,
  FaChartLine,
  FaRobot,
  FaShieldAlt,
  FaNotesMedical
} from "react-icons/fa";

function Home() {

  return (

    <div className="home">

      {/* Navbar */}

      <nav className="navbar">

        <h2 className="brand">

          <FaHeartbeat className="brand-icon"/>

          MedAssist AI

        </h2>

        <p className="creator">

          Developed by <strong>Mr. Swastik Sukla</strong>

        </p>

      </nav>

      {/* Hero Section */}

      <div className="hero">

        <div className="hero-left">

          <span className="tagline">

            AI Powered Healthcare Platform

          </span>

          <h1>

            Smarter Healthcare.
            <br />

            Better Decisions.

          </h1>

          <p>

            MedAssist AI helps patients and healthcare providers with
            intelligent disease prediction, patient monitoring,
            risk assessment, medical report management and
            AI-driven healthcare recommendations.

          </p>

          <div className="hero-buttons">

            <Link to="/login">

              <button className="primary-btn">

                Login

              </button>

            </Link>

            <Link to="/register">

              <button className="secondary-btn">

                Create Account

              </button>

            </Link>

          </div>

        </div>

        {/* Right Side */}

        <div className="hero-right">

          <div className="feature-card">

            <FaRobot />

            <span>AI Disease Prediction</span>

          </div>

          <div className="feature-card">

            <FaShieldAlt />

            <span>Risk Assessment</span>

          </div>

          <div className="feature-card">

            <FaNotesMedical />

            <span>Medical Reports</span>

          </div>

          <div className="feature-card">

            <FaUserMd />

            <span>Patient Monitoring</span>

          </div>

          <div className="feature-card">

            <FaChartLine />

            <span>Healthcare Analytics</span>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Home;
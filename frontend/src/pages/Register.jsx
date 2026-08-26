import "../styles/Register.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleRegister = async () => {

    if (name === "" || email === "" || password === "" || role === "") {
      alert("Please fill all fields");
      return;
    }

    try {

      const response = await fetch("http://127.0.0.1:8000/register", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          name: name,
          email: email,
          password: password,
          role: role === "doctor" ? "Healthcare Provider" : "Patient"

        }),

      });

      const data = await response.json();

      if (!response.ok) {

        alert(data.detail);
        return;

      }

      alert("Registration Successful!");

      navigate("/login");

    }

    catch (error) {

      console.error(error);

      alert("Unable to connect to server.");

    }

  };

  return (

    <div className="register-page">

      <div className="register-card">

        <h1>Create Account</h1>

        <p>Register to use MedAssist AI</p>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="role-section">

          <label>Select Role</label>

          <div className="radio-group">

            <label>

              <input
                type="radio"
                name="role"
                value="patient"
                onChange={(e) => setRole(e.target.value)}
              />

              Patient

            </label>

            <label>

              <input
                type="radio"
                name="role"
                value="doctor"
                onChange={(e) => setRole(e.target.value)}
              />

              Healthcare Provider

            </label>

          </div>

        </div>

        <button onClick={handleRegister}>

          Register

        </button>

      </div>

    </div>

  );

}

export default Register;
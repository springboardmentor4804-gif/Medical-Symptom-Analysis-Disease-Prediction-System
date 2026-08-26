import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    if (email === "" || password === "") {
      alert("Please fill all fields");
      return;
    }

    try {

      const response = await fetch("http://127.0.0.1:8000/login", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),

      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail);
        return;
      }

      localStorage.setItem("userId", data.id);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);

      alert("Login Successful!");

      if (data.role === "Healthcare Provider") {
        navigate("/doctor");
      } else {
        navigate("/patient");
      }

    } catch (error) {

      console.error(error);
      alert("Unable to connect to server.");

    }

  };

  return (

    <div className="login-page">

      <div className="login-card">

        <h1>Welcome Back</h1>

        <p>Login to access your MedAssist AI account</p>

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

        <button onClick={handleLogin}>
          Login
        </button>

      </div>

    </div>

  );
}

export default Login;
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patient");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      alert(data.message);

      if (data.message === "Login Successful") {
        // Save user details
        localStorage.setItem("user", JSON.stringify(data));

        if (role === "Patient") {
          navigate("/patient-dashboard");
        } else {
          navigate("/healthcare-provider-dashboard");   
        }
      }
    } catch (error) {
      alert("Login Failed");
      console.log(error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>Patient</option>
        <option>Healthcare Provider</option>
      </select>

      <br />
      <br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
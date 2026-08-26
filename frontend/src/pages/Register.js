import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patient");

  const handleRegister = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname,
          age: parseInt(age),
          gender,
          phone,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();
      alert(data.message);

      navigate("/login");
    } catch (error) {
      alert("Registration Failed!");
      console.log(error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Full Name"
        value={fullname}
        onChange={(e) => setFullname(e.target.value)}
      />
      <br />
      <br />

      <input
        type="number"
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
      <br />
      <br />

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      >
        <option value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>

      <br />
      <br />

      <input
        type="text"
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <br />
      <br />

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

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option>Patient</option>
        <option>Healthcare Provider</option>
      </select>

      <br />
      <br />

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;
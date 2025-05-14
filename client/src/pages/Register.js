import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Register.css';
import backgroundImage from "../assets/2.jpg";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/auth/register", {
        username,
        email,
        password
      });

      console.log(res.data);
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Something went wrong, please try again!");
      }
    }
  };

  return (
  <div
    style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div className="register-container">
      <h2>Register</h2>
      <form className="register-form" onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="register-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="register-input"
        />
        <button type="submit" className="register-button">Register</button>
      </form>
    </div>
  </div>
);

};

export default Register;

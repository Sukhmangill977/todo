import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Add Link here
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Sending login request to backend API
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });
      
      // Storing the JWT token in localStorage
      localStorage.setItem("authToken", res.data.token);

      // Redirecting to Dashboard after successful login
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // Safe error handling
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Something went wrong, please try again!");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p> {/* Now Link is defined */}
    </div>
  );
}

export default Login;

import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentAuth() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAuth() {
    try {
      let res;
      if (isSignup) {
        res = await API.post("/auth/student/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        alert("Signup successful! Now login.");
        setIsSignup(false);
      } else {
        res = await API.post("/auth/student/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token || res.data.access_token);
        localStorage.setItem("role", res.data.role || "student");
        alert("Login successful!");
        navigate("/"); // ✅ redirect to home
      }
    } catch (err) {
      alert("Authentication failed");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isSignup ? "Student Signup" : "Student Login"}</h2>

      {isSignup && (
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />
      )}

      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />

      <button onClick={handleAuth}>
        {isSignup ? "Signup" : "Login"}
      </button>

      <p>
        {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Login" : "Signup"}
        </button>
      </p>
    </div>
  );
}

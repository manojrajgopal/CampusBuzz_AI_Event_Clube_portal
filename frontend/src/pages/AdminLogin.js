// frontend/src/pages/AdminLogin.js
import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin() {
    try {
      const res = await API.post("/auth/admin/login", form);
      localStorage.setItem("token", res.data.token || res.data.access_token);
      localStorage.setItem("role", res.data.role || "admin");
      alert("Admin login successful!");
      navigate("/admin"); // ✅ redirect to admin dashboard
    } catch (err) {
      alert("Admin login failed");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Login</h2>
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
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

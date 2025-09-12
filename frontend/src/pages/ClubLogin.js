import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ClubLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function login() {
    try {
      const res = await API.post("/auth/club/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "club");
      alert("Login successful!");
      navigate("/clubs"); // ✅ redirect to club page
    } catch (err) {
      alert("Login failed");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Club Login</h2>
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
      <button onClick={login}>Login</button>
    </div>
  );
}

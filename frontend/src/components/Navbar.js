import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      if (role === "student") {
        try {
          const res = await API.get("/student/profile/completed", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setProfileCompleted(res.data.profile_completed);
        } catch (err) {
          console.log("Profile check error:", err);
        }
      }
    }
    checkProfile();
  }, [role]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }

  return (
    <nav style={{ padding: "10px", background: "#ddd", display: "flex", justifyContent: "space-between" }}>
      {/* Left side links */}
      <div>
        <Link to="/" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/information" style={{ marginRight: "10px" }}>Information</Link>
        <Link to="/events" style={{ marginRight: "10px" }}>Events</Link>
        <Link to="/blogs" style={{ marginRight: "10px" }}>Blogs</Link>
        <a href="/#contact" style={{ marginRight: "10px" }}>Contact</a>
      </div>

      {/* Right side auth/profile links */}
      <div>
        {!role && (
          <>
            <Link to="/student/login" style={{ marginRight: "10px" }}>Student</Link>
            <Link to="/club/login" style={{ marginRight: "10px" }}>Club</Link>
            <Link to="/admin/login">Admin</Link>
          </>
        )}

        {role === "student" && !profileCompleted && (
          <Link to="/student/register" style={{ marginLeft: "10px" }}>Register/Application</Link>
        )}

        {role === "student" && profileCompleted && (
          <Link to="/student/profile" style={{ marginLeft: "10px", marginRight: "10px" }}>Profile</Link>
        )}

        {role && (
          <button onClick={handleLogout} style={{ marginLeft: "10px" }}>Logout</button>
        )}
      </div>
    </nav>
  );
}

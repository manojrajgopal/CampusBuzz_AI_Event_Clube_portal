import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Navbar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const popupRef = useRef(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch student profile if logged in
  useEffect(() => {
    async function fetchProfile() {
      if (role === "student" && token) {
        try {
          const res = await API.get("/student/profile");
          setProfile(res.data);
          setFormData(res.data);
        } catch (err) {

        }
      }
    }
    fetchProfile();
  }, [role, token]);

  // Close popup when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
        setIsEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;
    if (["skills", "interests", "achievements"].includes(e.target.name)) {
      value = value.split(",").map((v) => v.trim());
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = async () => {
    try {
      const res = await API.post("/student/profile", formData);
      setProfile(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav
      style={{
        padding: "10px",
        background: "#ddd",
        display: "flex",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
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
        {/* Student Login */}
        {role === "student" && token ? (
          <>
            <button onClick={() => setShowPopup(!showPopup)}>Profile</button>
            <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
              Logout
            </button>

            {showPopup && (
              <div
                ref={popupRef}
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "20px",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "15px",
                  width: "320px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  zIndex: 1000,
                }}
              >
                <h3>Student Profile</h3>
                {profile && !isEditing ? (
                  <div>
                    <p><b>Name:</b> {profile.name}</p>
                    <p><b>Email:</b> {profile.email}</p>
                    <p><b>Mobile:</b> {profile.mobile}</p>
                    <p><b>Student ID:</b> {profile.student_id}</p>
                    <p><b>Department:</b> {profile.department}</p>
                    <p><b>Year:</b> {profile.year}</p>
                    <p><b>Skills:</b> {profile.skills?.join(", ")}</p>
                    <p><b>Interests:</b> {profile.interests?.join(", ")}</p>
                    <p><b>Achievements:</b> {profile.achievements?.join(", ")}</p>
                    <p><b>Description:</b> {profile.description}</p>
                    <button onClick={() => setIsEditing(true)}>Edit</button>
                  </div>
                ) : (
                  <div>
                    <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} />
                    <input name="email" placeholder="Email" value={formData.email || ""} onChange={handleChange} />
                    <input name="mobile" placeholder="Mobile" value={formData.mobile || ""} onChange={handleChange} />
                    <input name="student_id" placeholder="Student ID" value={formData.student_id || ""} onChange={handleChange} />
                    <input name="department" placeholder="Department" value={formData.department || ""} onChange={handleChange} />
                    <input name="year" placeholder="Year" value={formData.year || ""} onChange={handleChange} />
                    <input name="skills" placeholder="Skills (comma separated)" value={formData.skills?.join(", ") || ""} onChange={handleChange} />
                    <input name="interests" placeholder="Interests (comma separated)" value={formData.interests?.join(", ") || ""} onChange={handleChange} />
                    <input name="achievements" placeholder="Achievements (comma separated)" value={formData.achievements?.join(", ") || ""} onChange={handleChange} />
                    <textarea name="description" placeholder="Description" value={formData.description || ""} onChange={handleChange} />
                    
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : role === "club" && token ? (
          <>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/student/login" style={{ marginRight: "10px" }}>Student</Link>
            <Link to="/club/login" style={{ marginRight: "10px" }}>Club</Link>
            <Link to="/admin/login">Admin</Link>
          </>
        )}
      </div>
    </nav>
  );
}

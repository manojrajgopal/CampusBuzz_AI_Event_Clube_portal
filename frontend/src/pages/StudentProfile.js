// frontend/src/pages/StudentProfile.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    student_id: "",
    department: "",
    year: "",
    skills: "",
    interests: "",
    achievements: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile when page loads
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await API.get("/student/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.data || Object.keys(res.data).length === 0) {
          setIsEditing(true); // First time, show form
        } else {
          setProfile(res.data);
          setFormData({
            ...res.data,
            skills: res.data.skills?.join(", ") || "",
            interests: res.data.interests?.join(", ") || "",
            achievements: res.data.achievements?.join(", ") || "",
          });
        }
      } catch (err) {

        setIsEditing(true); // If error/no profile → show form
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save profile (create or update)
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()),
        interests: formData.interests.split(",").map((i) => i.trim()),
        achievements: formData.achievements.split(",").map((a) => a.trim()),
      };

      const res = await API.post("/student/profile", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setProfile(res.data);
      setIsEditing(false);
      alert("Profile saved successfully!");
      navigate("/student/profile"); // stay on page
    } catch (err) {
      console.error("Error saving profile", err);
      alert("Error saving profile");
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{!profile ? "Student Registration / Application" : "My Profile"}</h2>

      {isEditing ? (
        <div>
          <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} /> <br />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} /> <br />
          <input name="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleChange} /> <br />
          <input name="student_id" placeholder="Student ID" value={formData.student_id} onChange={handleChange} /> <br />
          <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} /> <br />
          <input name="year" placeholder="Year" value={formData.year} onChange={handleChange} /> <br />
          <input name="skills" placeholder="Skills (comma separated)" value={formData.skills} onChange={handleChange} /> <br />
          <input name="interests" placeholder="Interests (comma separated)" value={formData.interests} onChange={handleChange} /> <br />
          <input name="achievements" placeholder="Achievements (comma separated)" value={formData.achievements} onChange={handleChange} /> <br />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} /> <br />

          <button onClick={handleSave}>Save</button>
          {profile && <button onClick={() => setIsEditing(false)}>Cancel</button>}
        </div>
      ) : (
        profile && (
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
        )
      )}
    </div>
  );
}

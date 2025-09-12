// src/pages/StudentProfile.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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
  const [isFirstTime, setIsFirstTime] = useState(false); // track if student is filling first time

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await API.get("/student/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = res.data;
        if (!data || Object.keys(data).length === 0) {
          setIsFirstTime(true);
        }
        setForm({
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          student_id: data.student_id || "",
          department: data.department || "",
          year: data.year || "",
          skills: data.skills ? data.skills.join(",") : "",
          interests: data.interests ? data.interests.join(",") : "",
          achievements: data.achievements ? data.achievements.join(",") : "",
          description: data.description || "",
        });
      } catch (err) {
        console.log("No existing profile or error:", err);
        setIsFirstTime(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    try {
      await API.post(
        "/student/profile",
        {
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()),
          interests: form.interests.split(",").map((s) => s.trim()),
          achievements: form.achievements.split(",").map((s) => s.trim()),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert(isFirstTime ? "Profile created successfully!" : "Profile updated successfully!");
      setIsFirstTime(false);
      navigate("/student/profile"); // stay on profile page after submit
    } catch (err) {
      console.log(err);
      alert("Error saving profile");
    }
  }

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isFirstTime ? "Student Registration / Application" : "My Profile"}</h2>
      {Object.keys(form).map((key) => (
        <div key={key} style={{ marginBottom: "10px" }}>
          <input
            name={key}
            placeholder={key.replace("_", " ").toUpperCase()}
            value={form[key]}
            onChange={handleChange}
            style={{ width: "300px", padding: "5px" }}
          />
        </div>
      ))}
      <button onClick={handleSubmit}>
        {isFirstTime ? "Submit Application" : "Save / Update Profile"}
      </button>
    </div>
  );
}

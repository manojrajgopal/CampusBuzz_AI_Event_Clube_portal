// frontend/src/pages/ClubCreate.js
import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ClubCreate() {
  const [form, setForm] = useState({
    // Club details
    club_name: "",
    description: "",
    club_email: "",
    club_password: "",

    // Leader details
    leader_name: "",
    leader_email: "",
    leader_mobile: "",
    leader_student_id: "",
    leader_department: "",
    leader_year: "",
    leader_description: "",

    // Sub-leader details
    subleader_name: "",
    subleader_email: "",
    subleader_mobile: "",
    subleader_student_id: "",
    subleader_department: "",
    subleader_year: "",
    subleader_description: "",
  });

  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await API.post("/clubs/apply/create", form);
      alert("✅ Club creation request submitted! Wait for admin approval.");
      navigate("/");
    } catch (err) {
      alert("❌ Failed to create club. Please check details.");
      console.error(err);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create a New Club</h2>
      <form onSubmit={handleSubmit}>
        {/* Club Details */}
        <h3>Club Details</h3>
        <input name="club_name" placeholder="Club Name" value={form.club_name} onChange={handleChange} required />
        <input name="club_email" placeholder="Club Email" value={form.club_email} onChange={handleChange} required />
        <input name="club_password" type="password" placeholder="Club Password" value={form.club_password} onChange={handleChange} required />
        <textarea name="description" placeholder="Club Description" value={form.description} onChange={handleChange} />

        {/* Leader Details */}
        <h3>Leader Details</h3>
        <input name="leader_name" placeholder="Leader Name" value={form.leader_name} onChange={handleChange} required />
        <input name="leader_email" placeholder="Leader Email" value={form.leader_email} onChange={handleChange} required />
        <input name="leader_mobile" placeholder="Leader Mobile" value={form.leader_mobile} onChange={handleChange} required />
        <input name="leader_student_id" placeholder="Leader Student ID" value={form.leader_student_id} onChange={handleChange} required />
        <input name="leader_department" placeholder="Leader Department" value={form.leader_department} onChange={handleChange} required />
        <input name="leader_year" placeholder="Leader Year" value={form.leader_year} onChange={handleChange} />
        <textarea name="leader_description" placeholder="Leader Description" value={form.leader_description} onChange={handleChange} />

        {/* Sub-Leader Details */}
        <h3>Sub-Leader Details</h3>
        <input name="subleader_name" placeholder="Sub-Leader Name" value={form.subleader_name} onChange={handleChange} required />
        <input name="subleader_email" placeholder="Sub-Leader Email" value={form.subleader_email} onChange={handleChange} required />
        <input name="subleader_mobile" placeholder="Sub-Leader Mobile" value={form.subleader_mobile} onChange={handleChange} required />
        <input name="subleader_student_id" placeholder="Sub-Leader Student ID" value={form.subleader_student_id} onChange={handleChange} required />
        <input name="subleader_department" placeholder="Sub-Leader Department" value={form.subleader_department} onChange={handleChange} required />
        <input name="subleader_year" placeholder="Sub-Leader Year" value={form.subleader_year} onChange={handleChange} />
        <textarea name="subleader_description" placeholder="Sub-Leader Description" value={form.subleader_description} onChange={handleChange} />

        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

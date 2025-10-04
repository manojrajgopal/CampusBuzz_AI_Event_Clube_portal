// frontend/src/pages/ClubCreate.js
import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "./ClubCreate.css"; // We'll create this CSS file

export default function ClubCreate() {
  const [form, setForm] = useState({
    // Club details
    club_name: "",
    club_email: "",
    club_password: "",
    description: "",
    purpose: "",
    type: "",
    
    // Leader details - only USN required, others will be auto-filled or default
    leader_USN_id: "",
    
    // Sub-leader details - only USN required, others will be auto-filled or default
    subleader_USN_id: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Function to auto-fill user details based on USN (you can integrate with your backend)
  async function fetchUserDetails(usn, fieldPrefix) {
    try {
      // This would typically call your backend API to get user details
      const response = await API.get(`/users/${usn}`);
      const userData = response.data;
      
      // Auto-fill the details (though we won't display them in the form)
      console.log(`Auto-filled details for ${fieldPrefix}:`, userData);
      
    } catch (error) {
      console.log(`Could not auto-fill details for USN: ${usn}`);
      // Continue with default values
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data for submission
      const submissionData = {
        // Club details
        club_name: form.club_name,
        club_email: form.club_email,
        club_password: form.club_password,
        description: form.description || "No description provided",
        purpose: form.purpose || "To promote student activities and interests",
        type: form.type || "General",
        
        // Leader details - backend will handle fetching complete details
        leader_USN_id: form.leader_USN_id,
        
        // Sub-leader details - backend will handle fetching complete details
        subleader_USN_id: form.subleader_USN_id,
      };

      await API.post("/clubs/apply/create", submissionData);
      alert("✅ Club creation request submitted! Wait for admin approval.");
      navigate("/");
    } catch (err) {
      alert("❌ Failed to create club. Please check details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="club-create-container">
      <div className="club-create-card">
        <div className="club-create-header">
          <h2>Create New Club</h2>
          <p>Fill in the details below to register your club</p>
        </div>

        <form onSubmit={handleSubmit} className="club-create-form">
          {/* Club Details Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">🏢</span>
              Club Information
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="club_name">Club Name *</label>
                <input
                  id="club_name"
                  name="club_name"
                  type="text"
                  placeholder="Enter club name"
                  value={form.club_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="club_email">Club Email *</label>
                <input
                  id="club_email"
                  name="club_email"
                  type="email"
                  placeholder="club@college.edu"
                  value={form.club_email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="club_password">Club Password *</label>
                <input
                  id="club_password"
                  name="club_password"
                  type="password"
                  placeholder="Create a secure password"
                  value={form.club_password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Club Type</label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select club type</option>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Social">Social</option>
                  <option value="Academic">Academic</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Club Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your club's mission, activities, and goals..."
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="form-textarea"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="purpose">Club Purpose</label>
              <textarea
                id="purpose"
                name="purpose"
                placeholder="What is the main purpose of your club?"
                value={form.purpose}
                onChange={handleChange}
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>

          {/* Leadership Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">👥</span>
              Leadership Team
            </h3>
            
            <div className="leadership-grid">
              {/* Leader */}
              <div className="leader-card">
                <h4 className="leader-role">Club Leader</h4>
                <div className="form-group">
                  <label htmlFor="leader_USN_id">Leader USN ID *</label>
                  <input
                    id="leader_USN_id"
                    name="leader_USN_id"
                    type="text"
                    placeholder="Enter USN (e.g., 1RV20CS001)"
                    value={form.leader_USN_id}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                  <small className="input-hint">
                    Other details will be automatically fetched from student records
                  </small>
                </div>
              </div>

              {/* Sub-Leader */}
              <div className="leader-card">
                <h4 className="leader-role">Sub Leader</h4>
                <div className="form-group">
                  <label htmlFor="subleader_USN_id">Sub Leader USN ID *</label>
                  <input
                    id="subleader_USN_id"
                    name="subleader_USN_id"
                    type="text"
                    placeholder="Enter USN (e.g., 1RV20CS002)"
                    value={form.subleader_USN_id}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                  <small className="input-hint">
                    Other details will be automatically fetched from student records
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate("/")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Submitting..." : "Create Club Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
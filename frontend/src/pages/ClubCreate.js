// frontend/src/pages/ClubCreate.js
import React, { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "./ClubCreate.css";

export default function ClubCreate() {
  const [form, setForm] = useState({
    // Club details
    club_name: "",
    club_email: "",
    club_password: "",
    description: "",
    purpose: "",
    type: "",
    
    // Leader details
    leader_USN_id: "",
    
    // Sub-leader details
    subleader_USN_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [leaderDetails, setLeaderDetails] = useState(null);
  const [subleaderDetails, setSubleaderDetails] = useState(null);
  const [validatingUSN, setValidatingUSN] = useState({ leader: false, subleader: false });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Function to validate and fetch user details based on USN
  async function validateUSN(usn, fieldType) {
    if (!usn || usn.length < 3) {
      if (fieldType === 'leader') setLeaderDetails(null);
      if (fieldType === 'subleader') setSubleaderDetails(null);
      return;
    }

    setValidatingUSN(prev => ({ ...prev, [fieldType]: true }));

    try {
      // Call backend API to validate USN and get student details
      const response = await API.get(`/students/${usn}`);
      const studentData = response.data;
      
      if (fieldType === 'leader') {
        setLeaderDetails(studentData);
      } else {
        setSubleaderDetails(studentData);
      }
    } catch (error) {
      console.log(`Could not find student with USN: ${usn}`);
      if (fieldType === 'leader') {
        setLeaderDetails(null);
      } else {
        setSubleaderDetails(null);
      }
    } finally {
      setValidatingUSN(prev => ({ ...prev, [fieldType]: false }));
    }
  }

  // Handle USN input with debouncing
  const handleUSNChange = (e, fieldType) => {
    const usn = e.target.value;
    setForm({ ...form, [e.target.name]: usn });
    
    // Debounce the validation call
    setTimeout(() => {
      validateUSN(usn, fieldType);
    }, 500);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    // Basic validation
    if (!leaderDetails) {
      alert("❌ Please enter a valid Leader USN");
      setLoading(false);
      return;
    }
    
    if (!subleaderDetails) {
      alert("❌ Please enter a valid Sub Leader USN");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission - matches backend expectations
      const submissionData = {
        // Club details
        club_name: form.club_name,
        club_email: form.club_email,
        club_password: form.club_password,
        description: form.description || "No description provided",
        purpose: form.purpose || "To promote student activities and interests",
        type: form.type || "General",
        
        // Leader details
        leader_USN_id: form.leader_USN_id,
        
        // Sub-leader details
        subleader_USN_id: form.subleader_USN_id,
      };

      await API.post("/clubs/apply/create", submissionData);
      alert("✅ Club creation request submitted! Wait for admin approval.");
      navigate("/");
    } catch (err) {
      if (err.response?.data?.detail) {
        alert(`❌ ${err.response.data.detail}`);
      } else {
        alert("❌ Failed to create club. Please check details.");
      }
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
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter club type (will be auto-classified)"
                />
                <small className="input-hint">
                  You can enter a type or it will be automatically classified
                </small>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Club Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your club's mission, activities, and goals... (will be enhanced automatically)"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="form-textarea"
              />
              <small className="input-hint">
                Your description will be professionally enhanced using AI
              </small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="purpose">Club Purpose</label>
              <textarea
                id="purpose"
                name="purpose"
                placeholder="What is the main purpose of your club? (will be enhanced automatically)"
                value={form.purpose}
                onChange={handleChange}
                rows="3"
                className="form-textarea"
              />
              <small className="input-hint">
                Your purpose will be professionally enhanced using AI
              </small>
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
                    onChange={(e) => handleUSNChange(e, 'leader')}
                    required
                    className="form-input"
                  />
                  <div className="usn-validation-status">
                    {validatingUSN.leader && (
                      <small className="validating">🔄 Validating USN...</small>
                    )}
                    {leaderDetails && !validatingUSN.leader && (
                      <div className="student-details">
                        <small className="valid">✅ Validated: {leaderDetails.name}</small>
                        <small>Email: {leaderDetails.email}</small>
                      </div>
                    )}
                    {!leaderDetails && form.leader_USN_id && !validatingUSN.leader && (
                      <small className="invalid">❌ USN not found in student records</small>
                    )}
                  </div>
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
                    onChange={(e) => handleUSNChange(e, 'subleader')}
                    required
                    className="form-input"
                  />
                  <div className="usn-validation-status">
                    {validatingUSN.subleader && (
                      <small className="validating">🔄 Validating USN...</small>
                    )}
                    {subleaderDetails && !validatingUSN.subleader && (
                      <div className="student-details">
                        <small className="valid">✅ Validated: {subleaderDetails.name}</small>
                        <small>Email: {subleaderDetails.email}</small>
                      </div>
                    )}
                    {!subleaderDetails && form.subleader_USN_id && !validatingUSN.subleader && (
                      <small className="invalid">❌ USN not found in student records</small>
                    )}
                  </div>
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
              disabled={loading || !leaderDetails || !subleaderDetails}
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
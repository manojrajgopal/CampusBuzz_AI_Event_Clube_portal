// frontend/src/pages/ClubCreate.js
import React, { useState, useEffect } from "react";
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
  const [students, setStudents] = useState({});
  const navigate = useNavigate();

  // Fetch all students on component mount
  useEffect(() => {
    fetchAllStudents();
  }, []);

  async function fetchAllStudents() {
    try {
      const response = await API.get("http://localhost:8000/api/student/students");
      setStudents(response.data);
      console.log("Students data loaded:", response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Function to validate and get user details based on USN from local data
  function validateUSN(usn, fieldType) {
    if (!usn || usn.length < 3) {
      if (fieldType === 'leader') setLeaderDetails(null);
      if (fieldType === 'subleader') setSubleaderDetails(null);
      return;
    }

    setValidatingUSN(prev => ({ ...prev, [fieldType]: true }));

    // Simulate async operation for better UX
    setTimeout(() => {
      const studentData = students[usn];
      
      if (studentData) {
        if (fieldType === 'leader') {
          setLeaderDetails(studentData);
          // Auto-detect club type based on leader's skills and interests
          autoDetectClubType(studentData, subleaderDetails);
        } else {
          setSubleaderDetails(studentData);
          // Auto-detect club type based on subleader's skills and interests
          autoDetectClubType(leaderDetails, studentData);
        }
      } else {
        console.log(`Could not find student with USN: ${usn}`);
        if (fieldType === 'leader') {
          setLeaderDetails(null);
        } else {
          setSubleaderDetails(null);
        }
      }
      
      setValidatingUSN(prev => ({ ...prev, [fieldType]: false }));
    }, 300);
  }

  // Auto-detect club type based on student skills and interests
  function autoDetectClubType(leaderData, subleaderData) {
    if (!leaderData && !subleaderData) return;

    const allSkills = [];
    const allInterests = [];

    if (leaderData) {
      allSkills.push(...(leaderData.skills || []));
      allInterests.push(...(leaderData.interests || []));
    }

    if (subleaderData) {
      allSkills.push(...(subleaderData.skills || []));
      allInterests.push(...(subleaderData.interests || []));
    }

    // Simple club type detection logic
    const techKeywords = ['python', 'ai', 'coding', 'programming', 'web', 'software', 'tech'];
    const artsKeywords = ['dance', 'music', 'art', 'painting', 'creative', 'design'];
    const sportsKeywords = ['sports', 'football', 'basketball', 'cricket', 'athletics'];
    const academicKeywords = ['research', 'science', 'math', 'engineering', 'academic'];

    const combinedText = [...allSkills, ...allInterests].join(' ').toLowerCase();

    let detectedType = "General"; // Default type

    if (techKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Technical";
    } else if (artsKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Arts & Cultural";
    } else if (sportsKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Sports";
    } else if (academicKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Academic";
    }

    setForm(prev => ({ ...prev, type: detectedType }));
  }

  // Handle USN input with debouncing
  const handleUSNChange = (e, fieldType) => {
    const usn = e.target.value.toUpperCase(); // Convert to uppercase for consistency
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
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
      </div>

      <div className="club-create-card">
        <div className="club-create-header">
          <h2>Create New Club</h2>
          <p>Fill in the details below to register your club</p>
          <small className="data-status">
            {Object.keys(students).length > 0 
              ? `✅ Loaded ${Object.keys(students).length} student records` 
              : '🔄 Loading student data...'}
          </small>
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
                  placeholder="Auto-detected based on leadership"
                />
                <small className="input-hint">
                  Club type is auto-detected based on leadership skills and interests
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
                    placeholder="Enter USN (e.g., P19MT23S126051)"
                    value={form.leader_USN_id}
                    onChange={(e) => handleUSNChange(e, 'leader')}
                    required
                    className="form-input"
                  />
                  <div className="usn-validation-status">
                    {validatingUSN.leader && (
                      <small className="validating">🔄 Searching student records...</small>
                    )}
                    {leaderDetails && !validatingUSN.leader && (
                      <div className="student-details-card">
                        <div className="student-header">
                          <h5>✅ {leaderDetails.name}</h5>
                          <span className="student-badge">Leader</span>
                        </div>
                        <div className="student-info-grid">
                          <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{leaderDetails.email}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Department:</span>
                            <span className="info-value">{leaderDetails.department}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Year:</span>
                            <span className="info-value">{leaderDetails.year}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Mobile:</span>
                            <span className="info-value">{leaderDetails.mobile}</span>
                          </div>
                          {leaderDetails.skills && leaderDetails.skills.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Skills:</span>
                              <div className="tags-container">
                                {leaderDetails.skills.map((skill, index) => (
                                  <span key={index} className="tag">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {leaderDetails.interests && leaderDetails.interests.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Interests:</span>
                              <div className="tags-container">
                                {leaderDetails.interests.map((interest, index) => (
                                  <span key={index} className="tag">{interest}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {leaderDetails.achievements && leaderDetails.achievements.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Achievements:</span>
                              <div className="tags-container">
                                {leaderDetails.achievements.map((achievement, index) => (
                                  <span key={index} className="tag achievement">{achievement}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {leaderDetails.description && (
                            <div className="info-item">
                              <span className="info-label">Description:</span>
                              <span className="info-value description-text">{leaderDetails.description}</span>
                            </div>
                          )}
                        </div>
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
                    placeholder="Enter USN (e.g., P19MT23S126052)"
                    value={form.subleader_USN_id}
                    onChange={(e) => handleUSNChange(e, 'subleader')}
                    required
                    className="form-input"
                  />
                  <div className="usn-validation-status">
                    {validatingUSN.subleader && (
                      <small className="validating">🔄 Searching student records...</small>
                    )}
                    {subleaderDetails && !validatingUSN.subleader && (
                      <div className="student-details-card">
                        <div className="student-header">
                          <h5>✅ {subleaderDetails.name}</h5>
                          <span className="student-badge">Sub Leader</span>
                        </div>
                        <div className="student-info-grid">
                          <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{subleaderDetails.email}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Department:</span>
                            <span className="info-value">{subleaderDetails.department}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Year:</span>
                            <span className="info-value">{subleaderDetails.year}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Mobile:</span>
                            <span className="info-value">{subleaderDetails.mobile}</span>
                          </div>
                          {subleaderDetails.skills && subleaderDetails.skills.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Skills:</span>
                              <div className="tags-container">
                                {subleaderDetails.skills.map((skill, index) => (
                                  <span key={index} className="tag">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {subleaderDetails.interests && subleaderDetails.interests.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Interests:</span>
                              <div className="tags-container">
                                {subleaderDetails.interests.map((interest, index) => (
                                  <span key={index} className="tag">{interest}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {subleaderDetails.achievements && subleaderDetails.achievements.length > 0 && (
                            <div className="info-item">
                              <span className="info-label">Achievements:</span>
                              <div className="tags-container">
                                {subleaderDetails.achievements.map((achievement, index) => (
                                  <span key={index} className="tag achievement">{achievement}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {subleaderDetails.description && (
                            <div className="info-item">
                              <span className="info-label">Description:</span>
                              <span className="info-value description-text">{subleaderDetails.description}</span>
                            </div>
                          )}
                        </div>
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
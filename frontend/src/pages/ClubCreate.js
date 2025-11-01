// frontend/src/pages/ClubCreate.js - Apple-Inspired Redesign
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
      console.log("✅ Student records loaded:", Object.keys(response.data).length);
    } catch (error) {
      console.error("❌ Failed to fetch students:", error);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
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
        console.log(`❌ Student not found: ${usn}`);
        if (fieldType === 'leader') {
          setLeaderDetails(null);
        } else {
          setSubleaderDetails(null);
        }
      }
      
      setValidatingUSN(prev => ({ ...prev, [fieldType]: false }));
    }, 400);
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

    // Enhanced club type detection logic
    const techKeywords = ['python', 'ai', 'coding', 'programming', 'web', 'software', 'tech', 'computer', 'developer', 'engineer'];
    const artsKeywords = ['dance', 'music', 'art', 'painting', 'creative', 'design', 'photography', 'film', 'theater'];
    const sportsKeywords = ['sports', 'football', 'basketball', 'cricket', 'athletics', 'fitness', 'yoga', 'meditation'];
    const academicKeywords = ['research', 'science', 'math', 'engineering', 'academic', 'study', 'literature', 'writing'];

    const combinedText = [...allSkills, ...allInterests].join(' ').toLowerCase();

    let detectedType = "General"; // Default type

    if (techKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Technical";
    } else if (artsKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Arts & Cultural";
    } else if (sportsKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Sports & Wellness";
    } else if (academicKeywords.some(keyword => combinedText.includes(keyword))) {
      detectedType = "Academic";
    }

    setForm(prev => ({ ...prev, type: detectedType }));
  }

  // Handle USN input with enhanced debouncing
  const handleUSNChange = (e, fieldType) => {
    const usn = e.target.value.toUpperCase(); // Convert to uppercase for consistency
    const { name } = e.target;
    
    setForm(prev => ({ ...prev, [name]: usn }));
    
    // Enhanced debounce with cleanup
    const timeoutId = setTimeout(() => {
      validateUSN(usn, fieldType);
    }, 600);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle premium image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setImageFile(file);
        } else {
          alert('📁 Please select an image smaller than 5MB');
        }
      } else {
        alert('🖼️ Please select a valid image file (JPEG, PNG, etc.)');
      }
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    // Enhanced validation with better messaging
    if (!leaderDetails) {
      alert("❌ Please enter a valid Leader USN that exists in our student records");
      setLoading(false);
      return;
    }
    
    if (!subleaderDetails) {
      alert("❌ Please enter a valid Sub Leader USN that exists in our student records");
      setLoading(false);
      return;
    }

    if (form.leader_USN_id === form.subleader_USN_id) {
      alert("❌ Leader and Sub Leader cannot be the same person");
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

      console.log("🚀 Submitting club creation request:", submissionData);

      // If image is selected, create FormData and append the file
      if (imageFile) {
        const formData = new FormData();
        Object.keys(submissionData).forEach(key => {
          formData.append(key, submissionData[key]);
        });
        formData.append('club_image', imageFile);
        
        await API.post("/clubs/apply/create", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await API.post("/clubs/apply/create", submissionData);
      }

      alert("✅ Club creation request submitted successfully!\n\nYour request is now pending admin approval. You'll be notified once it's reviewed.");
      navigate("/");
    } catch (err) {
      console.error("❌ Submission error:", err);
      if (err.response?.data?.detail) {
        alert(`❌ ${err.response.data.detail}`);
      } else if (err.response?.data?.message) {
        alert(`❌ ${err.response.data.message}`);
      } else {
        alert("❌ Failed to create club. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="club-create-container">
      {/* Premium Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
      </div>

      <div className="club-create-card">
        <div className="club-create-header">
          <h2>Create New Club</h2>
          <p>Establish your student organization with our community platform</p>
          <small className="data-status">
            {Object.keys(students).length > 0 
              ? `✅ ${Object.keys(students).length} student records loaded and ready` 
              : '🔄 Loading student database...'}
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
                <label htmlFor="club_name" className="required">Club Name</label>
                <input
                  id="club_name"
                  name="club_name"
                  type="text"
                  placeholder="Enter your club's official name"
                  value={form.club_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="club_email" className="required">Club Email</label>
                <input
                  id="club_email"
                  name="club_email"
                  type="email"
                  placeholder="club.organization@college.edu"
                  value={form.club_email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="club_password" className="required">Club Password</label>
                <input
                  id="club_password"
                  name="club_password"
                  type="password"
                  placeholder="Create a secure password for club account"
                  value={form.club_password}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <small className="input-hint">
                  Minimum 8 characters with letters and numbers
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="type">Club Type</label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  placeholder="Technical, Arts, Sports, Academic, etc."
                  value={form.type}
                  onChange={handleChange}
                  className="form-input"
                />
                <small className="input-hint">
                  Auto-detected based on leadership skills and interests
                </small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Club Description</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your club's mission, activities, and goals..."
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea"
                />
                <small className="input-hint">
                  This description will be visible to all students
                </small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="purpose">Purpose & Objectives</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  placeholder="What specific goals and activities will your club focus on?"
                  value={form.purpose}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>

              {/* Premium Image Upload */}
              <div className="form-group full-width">
                <label>Club Logo/Image</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                    id="club_image"
                  />
                  <label htmlFor="club_image" className="image-upload-label">
                    <span className="upload-icon">📸</span>
                    Choose Club Image
                  </label>
                </div>
                {imageFile && (
                  <div className="image-preview">
                    ✅ Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                <small className="input-hint">
                  Recommended: Square image, JPG/PNG format, max 5MB
                </small>
              </div>
            </div>
          </div>

          {/* Leadership Team Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">👥</span>
              Leadership Team
            </h3>
            
            <div className="leadership-grid">
              {/* Leader Card */}
              <div className="leader-card">
                <h4 className="leader-role">Club Leader</h4>
                <div className="form-group">
                  <label htmlFor="leader_USN_id" className="required">Leader USN</label>
                  <input
                    id="leader_USN_id"
                    name="leader_USN_id"
                    type="text"
                    placeholder="Enter Leader's USN (e.g., 1RV20CS001)"
                    value={form.leader_USN_id}
                    onChange={(e) => handleUSNChange(e, 'leader')}
                    required
                    className="form-input"
                  />
                  {validatingUSN.leader && (
                    <div className="validating">
                      🔍 Validating USN and fetching student details...
                    </div>
                  )}
                </div>

                {leaderDetails && (
                  <div className="student-details-card">
                    <div className="student-header">
                      <h5>Student Details</h5>
                      <span className="student-badge">✅ Verified</span>
                    </div>
                    <div className="student-info-grid">
                      <div className="info-item">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{leaderDetails.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{leaderDetails.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Department</span>
                        <span className="info-value">{leaderDetails.department}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Year</span>
                        <span className="info-value">{leaderDetails.year}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Skills</span>
                        <div className="tags-container">
                          {leaderDetails.skills?.map((skill, index) => (
                            <span key={index} className="tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Interests</span>
                        <div className="tags-container">
                          {leaderDetails.interests?.map((interest, index) => (
                            <span key={index} className="tag">{interest}</span>
                          ))}
                        </div>
                      </div>
                      {leaderDetails.achievements && leaderDetails.achievements.length > 0 && (
                        <div className="info-item">
                          <span className="info-label">Achievements</span>
                          <div className="tags-container">
                            {leaderDetails.achievements.map((achievement, index) => (
                              <span key={index} className="tag achievement">{achievement}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub Leader Card */}
              <div className="leader-card">
                <h4 className="leader-role">Sub Leader</h4>
                <div className="form-group">
                  <label htmlFor="subleader_USN_id" className="required">Sub Leader USN</label>
                  <input
                    id="subleader_USN_id"
                    name="subleader_USN_id"
                    type="text"
                    placeholder="Enter Sub Leader's USN (e.g., 1RV20CS002)"
                    value={form.subleader_USN_id}
                    onChange={(e) => handleUSNChange(e, 'subleader')}
                    required
                    className="form-input"
                  />
                  {validatingUSN.subleader && (
                    <div className="validating">
                      🔍 Validating USN and fetching student details...
                    </div>
                  )}
                </div>

                {subleaderDetails && (
                  <div className="student-details-card">
                    <div className="student-header">
                      <h5>Student Details</h5>
                      <span className="student-badge">✅ Verified</span>
                    </div>
                    <div className="student-info-grid">
                      <div className="info-item">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{subleaderDetails.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{subleaderDetails.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Department</span>
                        <span className="info-value">{subleaderDetails.department}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Year</span>
                        <span className="info-value">{subleaderDetails.year}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Skills</span>
                        <div className="tags-container">
                          {subleaderDetails.skills?.map((skill, index) => (
                            <span key={index} className="tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Interests</span>
                        <div className="tags-container">
                          {subleaderDetails.interests?.map((interest, index) => (
                            <span key={index} className="tag">{interest}</span>
                          ))}
                        </div>
                      </div>
                      {subleaderDetails.achievements && subleaderDetails.achievements.length > 0 && (
                        <div className="info-item">
                          <span className="info-label">Achievements</span>
                          <div className="tags-container">
                            {subleaderDetails.achievements.map((achievement, index) => (
                              <span key={index} className="tag achievement">{achievement}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !leaderDetails || !subleaderDetails}
            >
              {loading ? (
                <>
                  <span style={{marginRight: '8px'}}>⏳</span>
                  Creating Club...
                </>
              ) : (
                <>
                  <span style={{marginRight: '8px'}}>🚀</span>
                  Create Club
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
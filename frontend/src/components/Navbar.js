import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import StudentAuth from "../pages/StudentAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const popupRef = useRef(null);
  const loginDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

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
          // Set profile photo if exists
          if (res.data.photo) {
            setProfilePhoto(res.data.photo);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    fetchProfile();
  }, [role, token]);

  // Close popups when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
        setIsEditing(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target)) {
        setShowLoginDropdown(false);
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
        // You can also upload the photo to your backend here
        // handlePhotoUploadToServer(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        photo: profilePhoto // Include photo in saved data
      };
      const res = await API.post("/student/profile", dataToSave);
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

  // Smooth scroll function for navbar links
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const targetSection = targetId.replace('#', '');
    
    if (window.location.pathname !== "/") {
      // If we're not on home page, navigate to home first
      navigate("/");
      // Use a timeout to ensure navigation happens before scrolling and URL update
      setTimeout(() => {
        const element = document.getElementById(targetSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Update URL with hash
          window.history.pushState(null, '', `/#${targetSection}`);
        }
      }, 100);
    } else {
      // We're already on home page, just scroll and update URL
      const element = document.getElementById(targetSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Update URL with hash
        window.history.pushState(null, '', `/#${targetSection}`);
      }
    }
  };

  return (
    <>
      <nav className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo-section">
          <div 
            className="navbar-logo-icon"
            onMouseEnter={(e) => e.target.style.transform = "rotate(5deg) scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "rotate(0deg) scale(1)"}
          >
            <span className="navbar-logo-text">CE</span>
          </div>
          <span className="navbar-brand-text">CampusBuzz</span>
        </div>

        {/* Navigation Links - Center */}
        <div className="navbar-links-container">
          <Link 
            to="/" 
            onClick={(e) => {
              if (window.location.pathname === "/" && (window.location.hash || window.scrollY > 0)) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.pushState(null, '', '/');
              }
            }}
            className={`navbar-link ${window.location.pathname === "/" && !window.location.hash ? 'navbar-link-active' : ''}`}
            onMouseEnter={(e) => {
              if (!(window.location.pathname === "/" && !window.location.hash)) {
                e.target.style.background = "rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(window.location.pathname === "/" && !window.location.hash)) {
                e.target.style.background = "transparent";
              }
            }}
          >
            Home
          </Link>
          
          <Link 
            to="/#information" 
            onClick={(e) => handleSmoothScroll(e, '#information')}
            className="navbar-link"
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Information
          </Link>
          
          <Link 
            to="/events" 
            className={`navbar-link ${window.location.pathname === "/events" ? 'navbar-link-active' : ''}`}
            onMouseEnter={(e) => {
              if (window.location.pathname !== "/events") {
                e.target.style.background = "rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (window.location.pathname !== "/events") {
                e.target.style.background = "transparent";
              }
            }}
          >
            Events
          </Link>
          
          <Link 
            to="/blogs" 
            className={`navbar-link ${window.location.pathname === "/blogs" ? 'navbar-link-active' : ''}`}
            onMouseEnter={(e) => {
              if (window.location.pathname !== "/blogs") {
                e.target.style.background = "rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (window.location.pathname !== "/blogs") {
                e.target.style.background = "transparent";
              }
            }}
          >
            Blogs
          </Link>
          
          <Link 
            to="/#contact"
            onClick={(e) => handleSmoothScroll(e, '#contact')}
            className="navbar-link"
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Contact
          </Link>
        </div>

        {/* Auth Section - Right Side */}
        <div className="navbar-auth-section">
          {/* Create Club button - hidden for club role */}
          {role !== "club" && (
            <Link to="/club/create">
              <button className="navbar-create-club-btn">
                Create Club
              </button>
            </Link>
          )}

          {/* Login/Profile Section */}
          {role === "admin" && token ? (
            <div className="navbar-admin-section">
              <Link to="/admin">
                <button className="navbar-admin-dashboard-btn">
                  Admin Dashboard
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="navbar-logout-btn"
              >
                Logout
              </button>
            </div>
          ) : role === "student" && token ? (
            <div style={{ position: "relative" }}>
              <div className="navbar-student-section">
                <button 
                  onClick={() => setShowPopup(!showPopup)}
                  className="navbar-profile-btn"
                >
                  My Profile
                </button>
                <button 
                  onClick={handleLogout} 
                  className="navbar-logout-btn"
                >
                  Logout
                </button>
              </div>

              {showPopup && (
                <div
                  ref={popupRef}
                  className="profile-popup"
                >
                  <h3 className="profile-popup-title">
                    <span className="profile-icon">👤</span>
                    Student Profile
                  </h3>
                  
                  {profile && !isEditing ? (
                    <div className="profile-view">
                      {/* Profile Photo and Basic Info Section */}
                      <div className="profile-header">
                        <div className="profile-photo-display">
                          {!profilePhoto && (profile.name ? profile.name.charAt(0).toUpperCase() : "S")}
                        </div>
                        <div className="profile-basic-info">
                          <h4 className="profile-name">
                            {profile.name}
                          </h4>
                          <p className="profile-usn">
                            <b>USN:</b> {profile.USN_id}
                          </p>
                          <p className="profile-year-dept">
                            <b>Year:</b> {profile.year} • <b>Dept:</b> {profile.department}
                          </p>
                          <p className="profile-email">
                            {profile.email}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Information Section */}
                      <div className="profile-details-grid">
                        <div>
                          <p className="profile-detail-item">
                            <b className="detail-label">Mobile</b>
                            <span className="detail-value">{profile.mobile}</span>
                          </p>
                        </div>
                        <div>
                          <p className="profile-detail-item">
                            <b className="detail-label">Interests</b>
                            <span className="detail-value">{profile.interests?.join(", ") || "None"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div className="profile-skills-section">
                        <b className="detail-label">Skills</b>
                        <div className="skills-container">
                          {profile.skills?.map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          )) || <span className="no-skills">No skills added</span>}
                        </div>
                      </div>

                      {/* Achievements Section */}
                      <div className="profile-achievements-section">
                        <b className="detail-label">Achievements</b>
                        <div className="achievements-text">
                          {profile.achievements?.join(", ") || "No achievements added"}
                        </div>
                      </div>

                      {/* Description Section */}
                      {profile.description && (
                        <div className="profile-description-section">
                          <b className="detail-label">About</b>
                          <p className="profile-description">
                            {profile.description}
                          </p>
                        </div>
                      )}

                      <button 
                        onClick={() => setIsEditing(true)}
                        className="edit-profile-btn"
                      >
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <div className="profile-edit-form">
                      {/* Photo Upload Section */}
                      <div className="photo-upload-section">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="profile-photo-edit"
                        >
                          {!profilePhoto && (formData.name ? formData.name.charAt(0).toUpperCase() : "S")}
                        </div>
                        <div className="photo-upload-controls">
                          <p className="photo-upload-label">
                            Profile Photo
                          </p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="upload-photo-btn"
                          >
                            Upload Photo
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            style={{ display: "none" }}
                          />
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="form-grid">
                        <input name="USN_id" placeholder="USN ID" value={formData.USN_id || ""} onChange={handleChange} className="form-input" />
                        <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} className="form-input" />
                        <input name="email" placeholder="Email" value={formData.email || ""} onChange={handleChange} className="form-input" />
                        <input name="mobile" placeholder="Mobile" value={formData.mobile || ""} onChange={handleChange} className="form-input" />
                        <input name="department" placeholder="Department" value={formData.department || ""} onChange={handleChange} className="form-input" />
                        <input name="year" placeholder="Year" value={formData.year || ""} onChange={handleChange} className="form-input" />
                      </div>
                      
                      <input name="skills" placeholder="Skills (comma separated)" value={formData.skills?.join(", ") || ""} onChange={handleChange} className="form-input-full" />
                      <input name="interests" placeholder="Interests (comma separated)" value={formData.interests?.join(", ") || ""} onChange={handleChange} className="form-input-full" />
                      <input name="achievements" placeholder="Achievements (comma separated)" value={formData.achievements?.join(", ") || ""} onChange={handleChange} className="form-input-full" />
                      <textarea name="description" placeholder="Description" value={formData.description || ""} onChange={handleChange} className="form-textarea" />
                      
                      <div className="form-buttons">
                        <button 
                          onClick={handleSave}
                          className="save-changes-btn"
                        >
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : role === "club" && token ? (
            <div className="navbar-club-section">
              <Link to="/clubs">
                <button className="navbar-club-dashboard-btn">
                  Club Dashboard
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="navbar-logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }} ref={loginDropdownRef}>
              <button 
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                className="navbar-login-btn"
              >
                Login
              </button>

              {showLoginDropdown && (
                <div className="login-dropdown">
                  <h4 className="dropdown-title">
                    Choose Login
                  </h4>
                  <div className="dropdown-buttons">
                    <Link to="/admin/login">
                      <button className="admin-login-btn">
                        Admin Login
                      </button>
                    </Link>
                    <Link to="/club/login">
                      <button className="club-login-btn">
                        Club Login
                      </button>
                    </Link>
                    <button
                      onClick={() => setShowStudentLogin(true)}
                      className="student-login-btn"
                    >
                      Student Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Student Login Modal */}
      {showStudentLogin && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button 
              onClick={() => setShowStudentLogin(false)}
              className="modal-close-btn"
            >
              ×
            </button>
            <StudentAuth onClose={() => setShowStudentLogin(false)} />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .navbar-container {
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }

          .navbar-logo-section {
            display: flex;
            align-items: center;
          }

          .navbar-logo-icon {
            width: 42px;
            height: 42px;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
          }

          .navbar-logo-text {
            color: white;
            font-weight: 800;
            font-size: 16px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }

          .navbar-brand-text {
            color: white;
            font-weight: 700;
            font-size: 20px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            letter-spacing: -0.5px;
          }

          .navbar-links-container {
            display: flex;
            gap: 8px;
            align-items: center;
            background: rgba(255,255,255,0.1);
            border-radius: 25px;
            padding: 4px;
          }

          .navbar-link {
            color: white;
            text-decoration: none;
            font-weight: 600;
            padding: 8px 20px;
            border-radius: 20px;
            transition: all 0.3s ease;
            font-size: 14px;
            background: transparent;
          }

          .navbar-link-active {
            background: rgba(255,255,255,0.2);
          }

          .navbar-auth-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .navbar-create-club-btn {
            background: linear-gradient(45deg, #ff9a9e, #fad0c4);
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
          }

          .navbar-create-club-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          }

          .navbar-create-club-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .navbar-admin-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .navbar-admin-dashboard-btn {
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
          }

          .navbar-admin-dashboard-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          .navbar-admin-dashboard-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .navbar-logout-btn {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          }

          .navbar-logout-btn:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-2px);
          }

          .navbar-logout-btn:not(:hover) {
            background: rgba(255,255,255,0.15);
            transform: translateY(0);
          }

          .navbar-student-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .navbar-profile-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
          }

          .navbar-profile-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          .navbar-profile-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .navbar-club-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .navbar-club-dashboard-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
          }

          .navbar-club-dashboard-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          .navbar-club-dashboard-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .navbar-login-btn {
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            border: none;
            padding: 10px 24px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
          }

          .navbar-login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          .navbar-login-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .login-dropdown {
            position: absolute;
            top: 50px;
            right: 0;
            background: white;
            border: none;
            border-radius: 16px;
            padding: 16px;
            width: 200px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideDown 0.3s ease;
          }

          .dropdown-title {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 16px;
            font-weight: 700;
            text-align: center;
          }

          .dropdown-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .admin-login-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            font-size: 14px;
          }

          .admin-login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }

          .admin-login-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: none;
          }

          .club-login-btn {
            background: linear-gradient(45deg, #ff9a9e, #fad0c4);
            border: none;
            padding: 12px 16px;
            border-radius: 12px;
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            font-size: 14px;
          }

          .club-login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 154, 158, 0.4);
          }

          .club-login-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: none;
          }

          .student-login-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border: none;
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            font-size: 14px;
          }

          .student-login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
          }

          .student-login-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: none;
          }

          .profile-popup {
            position: absolute;
            top: 60px;
            right: 0;
            background: white;
            border: none;
            border-radius: 16px;
            padding: 24px;
            width: 420px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideDown 0.3s ease;
          }

          .profile-popup-title {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #4ecdc4;
            padding-bottom: 12px;
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .profile-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 600;
          }

          .profile-view {
            line-height: 1.6;
            font-size: 14px;
            color: #555;
          }

          .profile-header {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #f0f0f0;
          }

          .profile-photo-display {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(45deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 24px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 3px solid #4ecdc4;
          }

          .profile-basic-info {
            flex: 1;
          }

          .profile-name {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 18px;
            font-weight: 700;
          }

          .profile-usn {
            margin: 0 0 6px 0;
            color: #666;
            font-size: 14px;
          }

          .profile-year-dept {
            margin: 0 0 6px 0;
            color: #666;
            font-size: 14px;
          }

          .profile-email {
            margin: 0;
            color: #4ecdc4;
            font-size: 13px;
            font-weight: 600;
          }

          .profile-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }

          .profile-detail-item {
            margin: 0 0 8px 0;
          }

          .detail-label {
            color: #333;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .detail-value {
            color: #666;
          }

          .profile-skills-section {
            margin-bottom: 15px;
          }

          .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .skill-tag {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .no-skills {
            color: #999;
            font-size: 13px;
          }

          .profile-achievements-section {
            margin-bottom: 20px;
          }

          .achievements-text {
            color: #666;
            font-size: 13px;
            line-height: 1.5;
          }

          .profile-description-section {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
          }

          .profile-description {
            margin: 0;
            color: #666;
            font-size: 13px;
            line-height: 1.5;
            font-style: italic;
          }

          .edit-profile-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border: none;
            padding: 12px 24px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
            width: 100%;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(78, 205, 196, 0.3);
          }

          .edit-profile-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
          }

          .edit-profile-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(78, 205, 196, 0.3);
          }

          .profile-edit-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .photo-upload-section {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
          }

          .profile-photo-edit {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(45deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 3px solid #4ecdc4;
            transition: all 0.3s ease;
          }

          .profile-photo-edit:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }

          .profile-photo-edit:not(:hover) {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }

          .photo-upload-controls {
            flex: 1;
          }

          .photo-upload-label {
            margin: 0 0 8px 0;
            color: #333;
            font-weight: 600;
            font-size: 14px;
          }

          .upload-photo-btn {
            background: rgba(102, 126, 234, 0.1);
            border: 1px dashed #667eea;
            padding: 8px 16px;
            border-radius: 10px;
            color: #667eea;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
          }

          .upload-photo-btn:hover {
            background: rgba(102, 126, 234, 0.2);
          }

          .upload-photo-btn:not(:hover) {
            background: rgba(102, 126, 234, 0.1);
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .form-input {
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
            background: #f8f9fa;
          }

          .form-input-full {
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
            background: #f8f9fa;
          }

          .form-textarea {
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
            background: #f8f9fa;
            resize: vertical;
            min-height: 80px;
          }

          .form-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
          }

          .save-changes-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border: none;
            padding: 12px 24px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 2;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(78, 205, 196, 0.3);
          }

          .save-changes-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
          }

          .save-changes-btn:not(:hover) {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(78, 205, 196, 0.3);
          }

          .cancel-btn {
            background: rgba(108, 117, 125, 0.1);
            border: 1px solid #6c757d;
            padding: 12px 24px;
            border-radius: 20px;
            color: #6c757d;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            font-size: 14px;
          }

          .cancel-btn:hover {
            background: rgba(108, 117, 125, 0.2);
          }

          .cancel-btn:not(:hover) {
            background: rgba(108, 117, 125, 0.1);
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
          }

          .modal-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            position: relative;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          }

          .modal-close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(108, 117, 125, 0.1);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            color: #6c757d;
            transition: all 0.3s ease;
          }

          .modal-close-btn:hover {
            background: rgba(108, 117, 125, 0.2);
            transform: rotate(90deg);
          }

          .modal-close-btn:not(:hover) {
            background: rgba(108, 117, 125, 0.1);
            transform: rotate(0deg);
          }
        `}
      </style>
    </>
  );
}
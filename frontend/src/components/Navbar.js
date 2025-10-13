
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
      <nav
        style={{
          padding: "12px 30px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
          fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: "42px",
            height: "42px",
            background: "linear-gradient(45deg, #ff6b6b, #feca57)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => e.target.style.transform = "rotate(5deg) scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "rotate(0deg) scale(1)"}
          >
            <span style={{ 
              color: "white", 
              fontWeight: "800", 
              fontSize: "16px",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
            }}>CE</span>
          </div>
          <span style={{ 
            color: "white", 
            fontWeight: "700", 
            fontSize: "20px",
            textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
            letterSpacing: "-0.5px"
          }}>CampusBuzz</span>
        </div>

        {/* Navigation Links - Center */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "25px",
          padding: "4px"
        }}>
          <Link 
            to="/" 
            onClick={(e) => {
              if (window.location.pathname === "/" && (window.location.hash || window.scrollY > 0)) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.pushState(null, '', '/');
              }
            }}
            style={{ 
              color: "white", 
              textDecoration: "none", 
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              fontSize: "14px",
              background: window.location.pathname === "/" && !window.location.hash ? "rgba(255,255,255,0.2)" : "transparent"
            }}
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
            style={{ 
              color: "white", 
              textDecoration: "none", 
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              fontSize: "14px"
            }}
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
            style={{ 
              color: "white", 
              textDecoration: "none", 
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              fontSize: "14px",
              background: window.location.pathname === "/events" ? "rgba(255,255,255,0.2)" : "transparent"
            }}
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
            style={{ 
              color: "white", 
              textDecoration: "none", 
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              fontSize: "14px",
              background: window.location.pathname === "/blogs" ? "rgba(255,255,255,0.2)" : "transparent"
            }}
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
            style={{ 
              color: "white", 
              textDecoration: "none", 
              fontWeight: "600",
              padding: "8px 20px",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              fontSize: "14px"
            }}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Create Club button - hidden for club role */}
          {role !== "club" && (
            <Link to="/club/create">
              <button
                style={{
                  background: "linear-gradient(45deg, #ff9a9e, #fad0c4)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  color: "#333",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                }}
              >
                Create Club
              </button>
            </Link>
          )}

          {/* Login/Profile Section */}
          {role === "admin" && token ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/admin">
                <button
                  style={{
                    background: "linear-gradient(45deg, #ff6b6b, #feca57)",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                  }}
                >
                  Admin Dashboard
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.25)";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Logout
              </button>
            </div>
          ) : role === "student" && token ? (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  onClick={() => setShowPopup(!showPopup)}
                  style={{
                    background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                  }}
                >
                  My Profile
                </button>
                <button 
                  onClick={handleLogout} 
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.25)";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.15)";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  Logout
                </button>
              </div>

              {showPopup && (
                <div
                  ref={popupRef}
                  style={{
                    position: "absolute",
                    top: "60px",
                    right: "0",
                    background: "white",
                    border: "none",
                    borderRadius: "16px",
                    padding: "24px",
                    width: "420px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    animation: "slideDown 0.3s ease"
                  }}
                >
                  <h3 style={{ 
                    margin: "0 0 20px 0", 
                    color: "#333", 
                    borderBottom: "2px solid #4ecdc4", 
                    paddingBottom: "12px",
                    fontSize: "18px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{
                      width: "32px",
                      height: "32px",
                      background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>👤</span>
                    Student Profile
                  </h3>
                  
                  {profile && !isEditing ? (
                    <div style={{ lineHeight: "1.6", fontSize: "14px", color: "#555" }}>
                      {/* Profile Photo and Basic Info Section */}
                      <div style={{ 
                        display: "flex", 
                        gap: "20px", 
                        alignItems: "flex-start",
                        marginBottom: "20px",
                        paddingBottom: "20px",
                        borderBottom: "1px solid #f0f0f0"
                      }}>
                        <div style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(45deg, #667eea, #764ba2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "24px",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                          border: "3px solid #4ecdc4"
                        }}>
                          {!profilePhoto && (profile.name ? profile.name.charAt(0).toUpperCase() : "S")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            margin: "0 0 8px 0", 
                            color: "#333", 
                            fontSize: "18px",
                            fontWeight: "700"
                          }}>
                            {profile.name}
                          </h4>
                          <p style={{ 
                            margin: "0 0 6px 0", 
                            color: "#666",
                            fontSize: "14px"
                          }}>
                            <b>USN:</b> {profile.USN_id}
                          </p>
                          <p style={{ 
                            margin: "0 0 6px 0", 
                            color: "#666",
                            fontSize: "14px"
                          }}>
                            <b>Year:</b> {profile.year} • <b>Dept:</b> {profile.department}
                          </p>
                          <p style={{ 
                            margin: "0", 
                            color: "#4ecdc4",
                            fontSize: "13px",
                            fontWeight: "600"
                          }}>
                            {profile.email}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Information Section */}
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "15px",
                        marginBottom: "20px"
                      }}>
                        <div>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <b style={{ color: "#333", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mobile</b>
                            <span style={{ color: "#666" }}>{profile.mobile}</span>
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <b style={{ color: "#333", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Interests</b>
                            <span style={{ color: "#666" }}>{profile.interests?.join(", ") || "None"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div style={{ marginBottom: "15px" }}>
                        <b style={{ color: "#333", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Skills</b>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {profile.skills?.map((skill, index) => (
                            <span key={index} style={{
                              background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                              color: "white",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "500"
                            }}>
                              {skill}
                            </span>
                          )) || <span style={{ color: "#999", fontSize: "13px" }}>No skills added</span>}
                        </div>
                      </div>

                      {/* Achievements Section */}
                      <div style={{ marginBottom: "20px" }}>
                        <b style={{ color: "#333", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Achievements</b>
                        <div style={{ color: "#666", fontSize: "13px", lineHeight: "1.5" }}>
                          {profile.achievements?.join(", ") || "No achievements added"}
                        </div>
                      </div>

                      {/* Description Section */}
                      {profile.description && (
                        <div style={{ 
                          background: "#f8f9fa",
                          padding: "12px",
                          borderRadius: "10px",
                          marginBottom: "20px"
                        }}>
                          <b style={{ color: "#333", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>About</b>
                          <p style={{ 
                            margin: "0", 
                            color: "#666", 
                            fontSize: "13px",
                            lineHeight: "1.5",
                            fontStyle: "italic"
                          }}>
                            {profile.description}
                          </p>
                        </div>
                      )}

                      <button 
                        onClick={() => setIsEditing(true)}
                        style={{
                          background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "20px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginTop: "10px",
                          transition: "all 0.3s ease",
                          width: "100%",
                          fontSize: "14px",
                          boxShadow: "0 2px 10px rgba(78, 205, 196, 0.3)"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 10px rgba(78, 205, 196, 0.3)";
                        }}
                      >
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {/* Photo Upload Section */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "15px",
                        marginBottom: "10px"
                      }}>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(45deg, #667eea, #764ba2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "600",
                            fontSize: "24px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                            border: "3px solid #4ecdc4",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.05)";
                            e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                          }}
                        >
                          {!profilePhoto && (formData.name ? formData.name.charAt(0).toUpperCase() : "S")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            margin: "0 0 8px 0", 
                            color: "#333",
                            fontWeight: "600",
                            fontSize: "14px"
                          }}>
                            Profile Photo
                          </p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              background: "rgba(102, 126, 234, 0.1)",
                              border: "1px dashed #667eea",
                              padding: "8px 16px",
                              borderRadius: "10px",
                              color: "#667eea",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "12px",
                              transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "rgba(102, 126, 234, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "rgba(102, 126, 234, 0.1)";
                            }}
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
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "12px"
                      }}>
                        <input name="USN_id" placeholder="USN ID" value={formData.USN_id || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                        <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                        <input name="email" placeholder="Email" value={formData.email || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                        <input name="mobile" placeholder="Mobile" value={formData.mobile || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                        <input name="department" placeholder="Department" value={formData.department || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                        <input name="year" placeholder="Year" value={formData.year || ""} onChange={handleChange} 
                          style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                      </div>
                      
                      <input name="skills" placeholder="Skills (comma separated)" value={formData.skills?.join(", ") || ""} onChange={handleChange} 
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                      <input name="interests" placeholder="Interests (comma separated)" value={formData.interests?.join(", ") || ""} onChange={handleChange} 
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                      <input name="achievements" placeholder="Achievements (comma separated)" value={formData.achievements?.join(", ") || ""} onChange={handleChange} 
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f8f9fa" }} />
                      <textarea name="description" placeholder="Description" value={formData.description || ""} onChange={handleChange} 
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e0e0e0", minHeight: "80px", fontSize: "14px", background: "#f8f9fa", resize: "vertical" }} />
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button 
                          onClick={handleSave}
                          style={{
                            background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "20px",
                            color: "white",
                            fontWeight: "600",
                            cursor: "pointer",
                            flex: 1,
                            transition: "all 0.3s ease",
                            fontSize: "14px",
                            boxShadow: "0 2px 10px rgba(78, 205, 196, 0.3)"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 2px 10px rgba(78, 205, 196, 0.3)";
                          }}
                        >
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid #e0e0e0",
                            padding: "12px 24px",
                            borderRadius: "20px",
                            color: "#666",
                            fontWeight: "600",
                            cursor: "pointer",
                            flex: 1,
                            transition: "all 0.3s ease",
                            fontSize: "14px"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#f8f9fa";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "rgba(255,255,255,0.1)";
                            e.target.style.transform = "translateY(0)";
                          }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/clubs">
                <button
                  style={{
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                  }}
                >
                  Club Dashboard
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.25)";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }} ref={loginDropdownRef}>
              <button 
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                style={{
                  background: "linear-gradient(45deg, #ff6b6b, #feca57)",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "20px",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                }}
              >
                Login
              </button>

              {showLoginDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: "0",
                    background: "white",
                    border: "none",
                    borderRadius: "16px",
                    padding: "16px",
                    width: "200px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    animation: "slideDown 0.3s ease"
                  }}
                >
                  <h4 style={{ 
                    margin: "0 0 12px 0", 
                    color: "#333", 
                    fontSize: "16px",
                    fontWeight: "700",
                    textAlign: "center"
                  }}>
                    Choose Login
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link to="/admin/login">
                      <button
                        style={{
                          background: "linear-gradient(45deg, #667eea, #764ba2)",
                          border: "none",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          width: "100%",
                          fontSize: "14px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        Admin Login
                      </button>
                    </Link>
                    <Link to="/club/login">
                      <button
                        style={{
                          background: "linear-gradient(45deg, #ff9a9e, #fad0c4)",
                          border: "none",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          color: "#333",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          width: "100%",
                          fontSize: "14px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 4px 15px rgba(255, 154, 158, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        Club Login
                      </button>
                    </Link>
                    <button
                      onClick={() => setShowStudentLogin(true)}
                      style={{
                        background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                        border: "none",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        width: "100%",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
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
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(5px)"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "30px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
            position: "relative"
          }}>
            <button 
              onClick={() => setShowStudentLogin(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#999",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#333";
                e.target.style.transform = "rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#999";
                e.target.style.transform = "rotate(0deg)";
              }}
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
        `}
      </style>
    </>
  );
}

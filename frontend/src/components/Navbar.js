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
  const popupRef = useRef(null);
  const loginDropdownRef = useRef(null);

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
          {/* Create Club button - visible always */}
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

          {/* Login/Profile Section */}
          {role === "admin" && token ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/admin">
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
                    width: "380px",
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
                    fontWeight: "700"
                  }}>
                    Student Profile
                  </h3>
                  {profile && !isEditing ? (
                    <div style={{ lineHeight: "1.6", fontSize: "14px", color: "#555" }}>
                      <p><b>USN ID:</b> {profile.USN_id}</p>
                      <p><b>Name:</b> {profile.name}</p>
                      <p><b>Email:</b> {profile.email}</p>
                      <p><b>Mobile:</b> {profile.mobile}</p>
                      <p><b>Department:</b> {profile.department}</p>
                      <p><b>Year:</b> {profile.year}</p>
                      <p><b>Skills:</b> {profile.skills?.join(", ")}</p>
                      <p><b>Interests:</b> {profile.interests?.join(", ")}</p>
                      <p><b>Achievements:</b> {profile.achievements?.join(", ")}</p>
                      <p><b>Description:</b> {profile.description}</p>
                      <button 
                        onClick={() => setIsEditing(true)}
                        style={{
                          background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "20px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginTop: "15px",
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
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                            padding: "10px 20px",
                            borderRadius: "20px",
                            color: "white",
                            fontWeight: "600",
                            cursor: "pointer",
                            flex: 1,
                            transition: "all 0.3s ease",
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
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid #e0e0e0",
                            padding: "10px 20px",
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
                  background: "linear-gradient(45deg, #a8edea, #fed6e3)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "20px",
                  color: "#333",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
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
                Login 
                <span style={{ 
                  transform: showLoginDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  fontSize: "10px"
                }}>▼</span>
              </button>

              {showLoginDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: "0",
                    background: "white",
                    borderRadius: "16px",
                    padding: "16px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    animation: "slideDown 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    minWidth: "200px",
                    border: "1px solid rgba(0,0,0,0.05)"
                  }}
                >
                  <button 
                    onClick={() => {
                      setShowStudentLogin(true);
                      setShowLoginDropdown(false);
                    }}
                    style={{ 
                      background: 'none',
                      border: 'none',
                      textDecoration: 'none', 
                      color: '#333',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(102, 126, 234, 0.08)";
                      e.target.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    Student Login/Signup
                  </button>
                  <Link 
                    to="/club/login" 
                    style={{ 
                      textDecoration: 'none', 
                      color: '#333',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(102, 126, 234, 0.08)";
                      e.target.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    Club Login
                  </Link>
                  <Link 
                    to="/admin/login" 
                    style={{ 
                      textDecoration: 'none', 
                      color: '#333',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(102, 126, 234, 0.08)";
                      e.target.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    Admin Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Student Login Modal - Centered on screen */}
      {showStudentLogin && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <StudentAuth onClose={() => setShowStudentLogin(false)} />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
}
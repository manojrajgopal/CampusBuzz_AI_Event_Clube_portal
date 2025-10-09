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
    <nav
      style={{
        padding: "15px 30px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Logo Section */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{
          width: "45px",
          height: "45px",
          background: "linear-gradient(45deg, #ff6b6b, #feca57)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          transform: "rotate(15deg)",
          transition: "transform 0.3s ease"
        }}
        onMouseEnter={(e) => e.target.style.transform = "rotate(0deg) scale(1.1)"}
        onMouseLeave={(e) => e.target.style.transform = "rotate(15deg) scale(1)"}
        >
          <span style={{ 
            color: "white", 
            fontWeight: "bold", 
            fontSize: "20px",
            textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
          }}>CE</span>
        </div>
        <span style={{ 
          color: "white", 
          fontWeight: "bold", 
          fontSize: "22px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
        }}>CampusConnect</span>
      </div>

      {/* Navigation Links - Right Side */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link 
          to="/" 
          onClick={(e) => {
            if (window.location.pathname === "/" && (window.location.hash || window.scrollY > 0)) {
              e.preventDefault();
              // If we're already on home page but scrolled down or has hash, scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
              // Clear any hash from URL
              window.history.pushState(null, '', '/');
            }
            // If we're on a different page, let the regular navigation handle it
          }}
          style={{ 
            color: "white", 
            textDecoration: "none", 
            fontWeight: "600",
            padding: "8px 16px",
            borderRadius: "25px",
            transition: "all 0.3s ease",
            background: "rgba(255,255,255,0.1)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
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
            padding: "8px 16px",
            borderRadius: "25px",
            transition: "all 0.3s ease",
            background: "rgba(255,255,255,0.1)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
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
            padding: "8px 16px",
            borderRadius: "25px",
            transition: "all 0.3s ease",
            background: "rgba(255,255,255,0.1)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
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
            padding: "8px 16px",
            borderRadius: "25px",
            transition: "all 0.3s ease",
            background: "rgba(255,255,255,0.1)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
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
            padding: "8px 16px",
            borderRadius: "25px",
            transition: "all 0.3s ease",
            background: "rgba(255,255,255,0.1)"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          Contact
        </Link>
      </div>

      {/* Auth Section - Left Side */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Create Club button - visible always */}
        <Link to="/club/create">
          <button
            style={{
              background: "linear-gradient(45deg, #ff9a9e, #fad0c4)",
              border: "none",
              padding: "10px 20px",
              borderRadius: "25px",
              color: "#333",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
            }}
          >
            Create Club
          </button>
        </Link>

        {/* Login/Profile Section */}
        {role === "admin" && token ? (
          <button 
            onClick={handleLogout}
            style={{
              background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
              border: "none",
              padding: "10px 20px",
              borderRadius: "25px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            Logout
          </button>
        ) : role === "student" && token ? (
          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setShowPopup(!showPopup)}
              style={{
                background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "25px",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              Profile
            </button>
            <button 
              onClick={handleLogout} 
              style={{
                background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "25px",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                marginLeft: "10px",
                transition: "all 0.3s ease"
              }}
            >
              Logout
            </button>

            {showPopup && (
              <div
                ref={popupRef}
                style={{
                  position: "absolute",
                  top: "60px",
                  right: "0",
                  background: "white",
                  border: "none",
                  borderRadius: "15px",
                  padding: "20px",
                  width: "350px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  zIndex: 1000,
                  animation: "slideDown 0.3s ease"
                }}
              >
                <h3 style={{ margin: "0 0 15px 0", color: "#333", borderBottom: "2px solid #4ecdc4", paddingBottom: "10px" }}>Student Profile</h3>
                {profile && !isEditing ? (
                  <div style={{ lineHeight: "1.6" }}>
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
                        padding: "8px 16px",
                        borderRadius: "20px",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginTop: "10px",
                        transition: "all 0.3s ease"
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input name="USN_id" placeholder="USN ID" value={formData.USN_id || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="name" placeholder="Name" value={formData.name || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="email" placeholder="Email" value={formData.email || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="mobile" placeholder="Mobile" value={formData.mobile || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="department" placeholder="Department" value={formData.department || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="year" placeholder="Year" value={formData.year || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="skills" placeholder="Skills (comma separated)" value={formData.skills?.join(", ") || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="interests" placeholder="Interests (comma separated)" value={formData.interests?.join(", ") || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <input name="achievements" placeholder="Achievements (comma separated)" value={formData.achievements?.join(", ") || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <textarea name="description" placeholder="Description" value={formData.description || ""} onChange={handleChange} 
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "60px" }} />
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button 
                        onClick={handleSave}
                        style={{
                          background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          flex: 1
                        }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        style={{
                          background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          flex: 1
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
          <button 
            onClick={handleLogout}
            style={{
              background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
              border: "none",
              padding: "10px 20px",
              borderRadius: "25px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        ) : (
          <div style={{ position: "relative" }} ref={loginDropdownRef}>
            <button 
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              style={{
                background: "linear-gradient(45deg, #a8edea, #fed6e3)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "25px",
                color: "#333",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              Login 
              <span style={{ 
                transform: showLoginDropdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease"
              }}>▼</span>
            </button>

            {showLoginDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "0",
                  background: "white",
                  borderRadius: "15px",
                  padding: "15px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                  animation: "slideDown 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  minWidth: "150px"
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(102, 126, 234, 0.1)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  Student Login/Signup
                </button>
                <Link 
                  to="/club/login" 
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(102, 126, 234, 0.1)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  Club Login
                </Link>
                <Link 
                  to="/admin/login" 
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(102, 126, 234, 0.1)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Login Modal */}
      {showStudentLogin && <StudentAuth onClose={() => setShowStudentLogin(false)} />}

      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </nav>
  );
}
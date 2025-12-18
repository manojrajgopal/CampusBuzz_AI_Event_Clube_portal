import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ClubLogin({ onClose }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const modalRef = useRef(null);

  // Show modal with animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    
    // Animate elements step by step
    const steps = [1, 2, 3, 4];
    steps.forEach((step, index) => {
      setTimeout(() => setAnimationStep(step), 300 * (index + 1));
    });
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
      navigate("/");
    }, 300);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  }

  function validateForm() {
    const newErrors = {};
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function login() {
    // Validate form before sending to backend
    if (!validateForm()) {
      return;
    }

    try {
      const res = await API.post("/auth/club/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "club");
      localStorage.setItem("club_id", res.data.club_id);
      handleClose();
      setTimeout(() => navigate("/clubs"), 100);
    } catch (err) {
      alert("Login failed - Invalid credentials");
    }
  }

  // Simple floating animation for background elements
  const FloatingShape = ({ delay, size, color, position }) => (
    <div 
      className="floating-shape"
      style={{
        width: size,
        height: size,
        background: color,
        position: 'absolute',
        ...position,
        animationDelay: `${delay}s`,
        opacity: animationStep >= 2 ? 1 : 0,
        transform: `scale(${animationStep >= 2 ? 1 : 0}) rotate(${animationStep >= 2 ? '0deg' : '45deg'})`,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    />
  );

  return (
    <div 
      className="club-login-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(119, 119, 119, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* Background Shapes */}
      <FloatingShape 
        delay={0} 
        size="80px" 
        color="linear-gradient(45deg, #c91188ff, #A0522D)" 
        position={{ top: '20%', left: '20%' }} 
      />
      <FloatingShape 
        delay={0.2} 
        size="60px" 
        color="linear-gradient(45deg, #2F4F4F, #708090)" 
        position={{ bottom: '25%', right: '20%' }} 
      />
      <FloatingShape 
        delay={0.4} 
        size="100px" 
        color="linear-gradient(45deg, #556B2F, #6B8E23)" 
        position={{ top: '60%', left: '10%' }} 
      />
      <FloatingShape 
        delay={0.6} 
        size="70px" 
        color="linear-gradient(45deg, #483D8B, #6A5ACD)" 
        position={{ top: '30%', right: '15%' }} 
      />

      <div 
        ref={modalRef}
        className="club-login-modal"
        style={{
          background: 'rgba(246, 246, 246, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '25px',
          padding: '40px',
          width: '90%',
          maxWidth: '450px',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-50px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(240, 240, 240, 1)',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000802ff',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(139, 69, 19, 0.1)';
            e.target.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'rotate(0deg)';
          }}
        >
          ×
        </button>

        {/* Logo */}
        <div 
          style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            opacity: animationStep >= 1 ? 1 : 0,
            transform: `translateY(${animationStep >= 1 ? '0' : '20px'})`,
            transition: 'all 0.6s ease'
          }}
        >
          <div style={{
            width: "60px",
            height: "60px",
            background: "linear-gradient(135deg, #af36f0ff 0%, #c908b2ff 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            boxShadow: "0 8px 25px rgba(11, 21, 13, 0.3)",
            transform: "rotate(15deg)"
          }}>
            <span style={{ 
              color: "white", 
              fontWeight: "bold", 
              fontSize: "24px" 
            }}>CL</span>
          </div>
          <h2 style={{ 
            margin: 0, 
            color: '#d7ccccff',
            background: 'linear-gradient(135deg)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: '#543560ff',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Club Login
          </h2>
          <p style={{ 
            color: '#090606ff', 
            margin: '10px 0 0 0',
            fontSize: '16px'
          }}>
            Access your club dashboard
          </p>
        </div>

        {/* Form */}
        <div 
          style={{
            opacity: animationStep >= 2 ? 1 : 0,
            transform: `translateX(${animationStep >= 2 ? '0' : '-20px'})`,
            transition: 'all 0.6s ease 0.2s'
          }}
        >
          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <input
              name="email"
              placeholder="Club Email Address"
              value={form.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 0px',
                borderRadius: '15px',
                border: errors.email ? 
                  '2px solid #dc3545' : 
                  '2px solid rgba(139, 69, 19, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.email ? '#dc3545' : '#8B4513';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? '#dc3545' : 'rgba(139, 69, 19, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              }}
            />
            {errors.email && (
              <div style={{
                color: '#dc3545',
                fontSize: '14px',
                marginTop: '8px',
                paddingLeft: '10px'
              }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Club Password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 50px 15px 0px',
                borderRadius: '15px',
                border: errors.password ?
                  '2px solid #dc3545' :
                  '2px solid rgba(139, 69, 19, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.password ? '#dc3545' : '#8B4513';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? '#dc3545' : 'rgba(139, 69, 19, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#8B4513',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            {errors.password && (
              <div style={{
                color: '#dc3545',
                fontSize: '14px',
                marginTop: '8px',
                paddingLeft: '10px'
              }}>
                {errors.password}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div 
          style={{
            opacity: animationStep >= 3 ? 1 : 0,
            transform: `translateY(${animationStep >= 3 ? '0' : '20px'})`,
            transition: 'all 0.6s ease 0.4s'
          }}
        >
          <button 
            onClick={login}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #8703f4ff 0%, #ea0e75ff 100%)',
              border: 'none',
              borderRadius: '15px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(244, 7, 98, 0.24)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 30px rgba(139, 69, 19, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 19, 0.3)';
            }}
          >
            Login to Club
          </button>

          {/* Help Text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              color: '#666', 
              margin: 0,
              fontSize: '14px'
            }}>
              Contact admin for club access
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(139, 69, 19, 0.1)',
            textAlign: 'center',
            opacity: animationStep >= 4 ? 1 : 0,
            transition: 'all 0.6s ease 0.6s'
          }}
        >
          <p style={{ 
            color: '#999', 
            fontSize: '12px',
            margin: 0
          }}>
            Secure club portal • Authorized access only
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .floating-shape {
          animation: float 6s ease-in-out infinite;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          filter: blur(1px);
          opacity: 0.3;
        }

        .club-login-modal::-webkit-scrollbar {
          width: 6px;
        }

        .club-login-modal::-webkit-scrollbar-track {
          background: rgba(139, 69, 19, 0.1);
          border-radius: 10px;
        }

        .club-login-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8B4513, #A0522D);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
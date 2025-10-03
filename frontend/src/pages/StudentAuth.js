import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentAuth({ onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
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
    setTimeout(() => onClose?.(), 300);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAuth() {
    try {
      let res;
      if (isSignup) {
        res = await API.post("/auth/student/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        alert("Signup successful! Now login.");
        setIsSignup(false);
        setForm({ ...form, name: "", password: "" });
      } else {
        res = await API.post("/auth/student/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token || res.data.access_token);
        localStorage.setItem("role", res.data.role || "student");
        handleClose();
        setTimeout(() => navigate("/"), 100);
      }
    } catch (err) {
      alert("Authentication failed");
    }
  }

  // 3D floating animation for background elements
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
      className="student-auth-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* 3D Floating Background Shapes */}
      <FloatingShape 
        delay={0} 
        size="80px" 
        color="linear-gradient(45deg, #667eea, #764ba2)" 
        position={{ top: '20%', left: '20%' }} 
      />
      <FloatingShape 
        delay={0.2} 
        size="60px" 
        color="linear-gradient(45deg, #ff6b6b, #feca57)" 
        position={{ bottom: '25%', right: '20%' }} 
      />
      <FloatingShape 
        delay={0.4} 
        size="100px" 
        color="linear-gradient(45deg, #4ecdc4, #44a08d)" 
        position={{ top: '60%', left: '10%' }} 
      />
      <FloatingShape 
        delay={0.6} 
        size="70px" 
        color="linear-gradient(45deg, #a8edea, #fed6e3)" 
        position={{ top: '30%', right: '15%' }} 
      />

      <div 
        ref={modalRef}
        className="student-auth-modal"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
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
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#667eea',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(102, 126, 234, 0.1)';
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
            transform: "rotate(15deg)"
          }}>
            <span style={{ 
              color: "white", 
              fontWeight: "bold", 
              fontSize: "24px" 
            }}>CE</span>
          </div>
          <h2 style={{ 
            margin: 0, 
            color: '#333',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            {isSignup ? "Join CampusConnect" : "Welcome Back"}
          </h2>
          <p style={{ 
            color: '#666', 
            margin: '10px 0 0 0',
            fontSize: '16px'
          }}>
            {isSignup ? "Start your campus journey" : "Continue your campus journey"}
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
          {isSignup && (
            <div style={{ marginBottom: '20px' }}>
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: '15px',
                  border: '2px solid rgba(102, 126, 234, 0.1)',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.8)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(102, 126, 234, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <input
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: '15px',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: '15px',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          style={{
            opacity: animationStep >= 3 ? 1 : 0,
            transform: `translateY(${animationStep >= 3 ? '0' : '20px'})`,
            transition: 'all 0.6s ease 0.4s'
          }}
        >
          <button 
            onClick={handleAuth}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '15px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
            }}
          >
            {isSignup ? "Create Account" : "Login to CampusConnect"}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', margin: 0 }}>
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => {
                  setIsSignup(!isSignup);
                  setAnimationStep(0);
                  setTimeout(() => {
                    const steps = [1, 2, 3, 4];
                    steps.forEach((step, index) => {
                      setTimeout(() => setAnimationStep(step), 200 * (index + 1));
                    });
                  }, 300);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                {isSignup ? "Login here" : "Sign up here"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(102, 126, 234, 0.1)',
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
            By continuing, you agree to our Terms and Privacy Policy
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

        .student-auth-modal::-webkit-scrollbar {
          width: 6px;
        }

        .student-auth-modal::-webkit-scrollbar-track {
          background: rgba(102, 126, 234, 0.1);
          border-radius: 10px;
        }

        .student-auth-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
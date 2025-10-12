import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function StudentAuth({ onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [wrapperActive, setWrapperActive] = useState(false);
  const navigate = useNavigate();
  const modalRef = useRef(null);

  // Show modal with wrapper activation animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    
    // Wrapper activation sequence
    setTimeout(() => setWrapperActive(true), 200);
    
    // Animate elements step by step with depth effect
    const steps = [1, 2, 3, 4, 5];
    steps.forEach((step, index) => {
      setTimeout(() => setAnimationStep(step), 400 * (index + 1));
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
    setWrapperActive(false);
    setIsVisible(false);
    setTimeout(() => onClose?.(), 500);
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

  // Student-themed background elements
  const StudentBackgroundElement = ({ delay, type, position, size }) => {
    const elements = {
      book: {
        background: "linear-gradient(45deg, #4a6572, #344955)",
        emoji: "📚",
        shape: "polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)"
      },
      cap: {
        background: "linear-gradient(45deg, #ffd700, #ffb700)",
        emoji: "🎓",
        shape: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
      },
      laptop: {
        background: "linear-gradient(45deg, #667eea, #764ba2)",
        emoji: "💻",
        shape: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)"
      },
      pencil: {
        background: "linear-gradient(45deg, #ff6b6b, #feca57)",
        emoji: "✏️",
        shape: "polygon(30% 0%, 70% 0%, 60% 100%, 40% 100%)"
      }
    };

    const element = elements[type] || elements.book;

    return (
      <div 
        className="student-bg-element"
        style={{
          width: size,
          height: size,
          background: element.background,
          position: 'absolute',
          ...position,
          clipPath: element.shape,
          animationDelay: `${delay}s`,
          opacity: wrapperActive ? 0.4 : 0,
          transform: wrapperActive ? 
            `scale(1) rotate(0deg) translateZ(0)` : 
            `scale(0) rotate(180deg) translateZ(-100px)`,
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === '60px' ? '24px' : size === '80px' ? '32px' : '20px',
          filter: 'blur(0.5px)'
        }}
      >
        <span style={{ opacity: 0.7 }}>{element.emoji}</span>
      </div>
    );
  };

  return (
    <div 
      className="student-auth-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: wrapperActive ? 
          'radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.15), rgba(0, 0, 0, 0.8))' : 
          'rgba(0, 0, 0, 0.4)',
        backdropFilter: wrapperActive ? 'blur(12px)' : 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        perspective: '1000px'
      }}
    >
      {/* Student-themed Background Elements */}
      <StudentBackgroundElement 
        type="book" 
        delay={0.1} 
        size="80px" 
        position={{ top: '15%', left: '15%' }} 
      />
      <StudentBackgroundElement 
        type="cap" 
        delay={0.3} 
        size="60px" 
        position={{ top: '20%', right: '20%' }} 
      />
      <StudentBackgroundElement 
        type="laptop" 
        delay={0.5} 
        size="100px" 
        position={{ bottom: '25%', left: '10%' }} 
      />
      <StudentBackgroundElement 
        type="pencil" 
        delay={0.7} 
        size="50px" 
        position={{ bottom: '15%', right: '15%' }} 
      />
      <StudentBackgroundElement 
        type="book" 
        delay={0.9} 
        size="70px" 
        position={{ top: '60%', right: '25%' }} 
      />

      {/* Main Modal Container with 3D Depth */}
      <div 
        ref={modalRef}
        className="student-auth-modal"
        style={{
          background: wrapperActive ? 
            'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))' : 
            'rgba(255, 255, 255, 0.6)',
          backdropFilter: wrapperActive ? 'blur(25px)' : 'blur(10px)',
          borderRadius: '25px',
          padding: '40px',
          width: '90%',
          maxWidth: '450px',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: wrapperActive ? 
            '0 35px 70px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 50px rgba(255, 255, 255, 0.2)' : 
            '0 10px 30px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transform: isVisible ? 
            (wrapperActive ? 
              'scale(1) rotateX(0) rotateY(0) translateZ(0)' : 
              'scale(0.7) rotateX(15deg) rotateY(-10deg) translateZ(-100px)') : 
            'scale(0.5) rotateX(30deg) rotateY(20deg) translateZ(-200px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Animated Border Effect */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #667eea, #764ba2, #ff6b6b, #feca57)',
            opacity: wrapperActive ? 0.3 : 0,
            transition: 'opacity 0.6s ease 0.3s',
            zIndex: -1,
            filter: 'blur(15px)'
          }}
        />

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: wrapperActive ? 
              'rgba(255, 255, 255, 0.9)' : 
              'rgba(255, 255, 255, 0.6)',
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
            transition: 'all 0.4s ease',
            transform: wrapperActive ? 'scale(1)' : 'scale(0.8)',
            opacity: animationStep >= 1 ? 1 : 0,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            e.target.style.transform = 'rotate(90deg) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.transform = 'rotate(0deg) scale(1)';
          }}
        >
          ×
        </button>

        {/* Logo with Depth Animation */}
        <div 
          style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            opacity: animationStep >= 1 ? 1 : 0,
            transform: animationStep >= 1 ? 
              'translateY(0) translateZ(0)' : 
              'translateY(30px) translateZ(-50px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
          }}
        >
          <div style={{
            width: "70px",
            height: "70px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            boxShadow: wrapperActive ? 
              "0 15px 35px rgba(102, 126, 234, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)" : 
              "0 8px 25px rgba(102, 126, 234, 0.3)",
            transform: wrapperActive ? 
              "rotate(0deg) scale(1)" : 
              "rotate(-45deg) scale(0.8)",
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
          }}>
            <span style={{ 
              color: "white", 
              fontWeight: "bold", 
              fontSize: "28px" 
            }}>CE</span>
          </div>
          <h2 style={{ 
            margin: 0, 
            color: '#333',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '32px',
            fontWeight: 'bold',
            transform: wrapperActive ? 'translateZ(20px)' : 'translateZ(-20px)',
            transition: 'transform 0.6s ease 0.3s'
          }}>
            {isSignup ? "Join CampusBuzz" : "Welcome Back"}
          </h2>
          <p style={{ 
            color: '#666', 
            margin: '10px 0 0 0',
            fontSize: '16px',
            opacity: wrapperActive ? 1 : 0.5,
            transform: wrapperActive ? 'translateZ(10px)' : 'translateZ(-10px)',
            transition: 'all 0.6s ease 0.4s'
          }}>
            {isSignup ? "Start your campus journey" : "Continue your campus journey"}
          </p>
        </div>

        {/* Form with Layer Animation */}
        <div 
          style={{
            opacity: animationStep >= 2 ? 1 : 0,
            transform: animationStep >= 2 ? 
              'translateX(0) translateZ(0)' : 
              'translateX(-30px) translateZ(-30px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
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
                  padding: '16px 5px',
                  borderRadius: '15px',
                  border: wrapperActive ? 
                    '2px solid rgba(102, 126, 234, 0.2)' : 
                    '2px solid rgba(102, 126, 234, 0.1)',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.4s ease',
                  background: wrapperActive ? 
                    'rgba(255, 255, 255, 0.9)' : 
                    'rgba(255, 255, 255, 0.6)',
                  boxShadow: wrapperActive ? 
                    '0 5px 20px rgba(0, 0, 0, 0.1)' : 
                    '0 2px 10px rgba(0, 0, 0, 0.05)',
                  transform: wrapperActive ? 'translateZ(10px)' : 'translateZ(0)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.transform = 'translateZ(20px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.transform = 'translateZ(10px)';
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
                padding: '16px 5px',
                borderRadius: '15px',
                border: wrapperActive ? 
                  '2px solid rgba(102, 126, 234, 0.2)' : 
                  '2px solid rgba(102, 126, 234, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.4s ease',
                background: wrapperActive ? 
                  'rgba(255, 255, 255, 0.9)' : 
                  'rgba(255, 255, 255, 0.6)',
                boxShadow: wrapperActive ? 
                  '0 5px 20px rgba(0, 0, 0, 0.1)' : 
                  '0 2px 10px rgba(0, 0, 0, 0.05)',
                transform: wrapperActive ? 'translateZ(10px)' : 'translateZ(0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'translateZ(20px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateZ(10px)';
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
                padding: '16px 5px',
                borderRadius: '15px',
                border: wrapperActive ? 
                  '2px solid rgba(102, 126, 234, 0.2)' : 
                  '2px solid rgba(102, 126, 234, 0.1)',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.4s ease',
                background: wrapperActive ? 
                  'rgba(255, 255, 255, 0.9)' : 
                  'rgba(255, 255, 255, 0.6)',
                boxShadow: wrapperActive ? 
                  '0 5px 20px rgba(0, 0, 0, 0.1)' : 
                  '0 2px 10px rgba(0, 0, 0, 0.05)',
                transform: wrapperActive ? 'translateZ(10px)' : 'translateZ(0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'translateZ(20px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateZ(10px)';
              }}
            />
          </div>
        </div>

        {/* Action Buttons with Pop-in Animation */}
        <div 
          style={{
            opacity: animationStep >= 3 ? 1 : 0,
            transform: animationStep >= 3 ? 
              'translateY(0) translateZ(0)' : 
              'translateY(30px) translateZ(-30px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s'
          }}
        >
          <button 
            onClick={handleAuth}
            style={{
              width: '100%',
              padding: '17px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '15px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: wrapperActive ? 
                '0 15px 35px rgba(102, 126, 234, 0.4), 0 5px 15px rgba(0, 0, 0, 0.1)' : 
                '0 8px 25px rgba(102, 126, 234, 0.3)',
              marginBottom: '20px',
              transform: wrapperActive ? 'translateZ(20px)' : 'translateZ(0)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) translateZ(30px)';
              e.target.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) translateZ(20px)';
              e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>
              {isSignup ? "Create Account" : "Login to CampusConnect"}
            </span>
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.6s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.left = '100%';
              }}
            />
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', margin: 0 }}>
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => {
                  setIsSignup(!isSignup);
                  setAnimationStep(0);
                  setTimeout(() => {
                    const steps = [1, 2, 3, 4, 5];
                    steps.forEach((step, index) => {
                      setTimeout(() => setAnimationStep(step), 300 * (index + 1));
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
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#764ba2';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#667eea';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {isSignup ? "Login here" : "Sign up here"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer with Fade-in */}
        <div 
          style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(102, 126, 234, 0.1)',
            textAlign: 'center',
            opacity: animationStep >= 4 ? 1 : 0,
            transform: animationStep >= 4 ? 
              'translateY(0) translateZ(0)' : 
              'translateY(20px) translateZ(-20px)',
            transition: 'all 0.6s ease 0.7s'
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
        @keyframes floatDepth {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) translateZ(0); 
          }
          33% { 
            transform: translateY(-15px) rotate(120deg) translateZ(10px); 
          }
          66% { 
            transform: translateY(10px) rotate(240deg) translateZ(-10px); 
          }
        }
        
        .student-bg-element {
          animation: floatDepth 8s ease-in-out infinite;
        }

        .student-auth-modal::-webkit-scrollbar {
          width: 8px;
        }

        .student-auth-modal::-webkit-scrollbar-track {
          background: rgba(102, 126, 234, 0.1);
          border-radius: 10px;
        }

        .student-auth-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
        }

        @keyframes wrapperActivate {
          0% {
            opacity: 0;
            transform: scale(0.8) translateZ(-200px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        .student-auth-modal {
          animation: wrapperActivate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
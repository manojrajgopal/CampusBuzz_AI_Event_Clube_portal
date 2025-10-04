// frontend/src/pages/AdminLogin.js
import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
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
      newErrors.email = "Admin email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    // Validate form before sending to backend
    if (!validateForm()) {
      return;
    }

    try {
      const res = await API.post("/auth/admin/login", form);
      localStorage.setItem("token", res.data.token || res.data.access_token);
      localStorage.setItem("role", res.data.role || "admin");
      localStorage.setItem("adminEmail", form.email);
      
      // Success animation before navigation
      setWrapperActive(false);
      setTimeout(() => {
        navigate("/admin");
      }, 500);
      
    } catch (err) {
      alert("Admin login failed: " + (err.response?.data?.message || "Invalid credentials"));
    }
  }

  // Admin-themed background elements
  const AdminBackgroundElement = ({ delay, type, position, size }) => {
    const elements = {
      shield: {
        background: "linear-gradient(45deg, #2c3e50, #34495e)",
        emoji: "🛡️",
        shape: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
      },
      gear: {
        background: "linear-gradient(45deg, #3498db, #2980b9)",
        emoji: "⚙️",
        shape: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      },
      key: {
        background: "linear-gradient(45deg, #e74c3c, #c0392b)",
        emoji: "🔑",
        shape: "polygon(30% 0%, 70% 0%, 70% 40%, 80% 40%, 80% 60%, 70% 60%, 70% 100%, 30% 100%, 30% 60%, 20% 60%, 20% 40%, 30% 40%)"
      },
      chart: {
        background: "linear-gradient(45deg, #27ae60, #229954)",
        emoji: "📊",
        shape: "polygon(0% 0%, 100% 0%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)"
      }
    };

    const element = elements[type] || elements.shield;

    return (
      <div 
        className="admin-bg-element"
        style={{
          width: size,
          height: size,
          background: element.background,
          position: 'absolute',
          ...position,
          clipPath: element.shape,
          animationDelay: `${delay}s`,
          opacity: wrapperActive ? 0.3 : 0,
          transform: wrapperActive ? 
            `scale(1) rotate(0deg) translateZ(0)` : 
            `scale(0) rotate(180deg) translateZ(-100px)`,
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === '40px' ? '20px' : size === '80px' ? '28px' : '16px',
          filter: 'blur(0.8px)'
        }}
      >
        <span style={{ opacity: 0.8 }}>{element.emoji}</span>
      </div>
    );
  };

  return (
    <div 
      className="admin-login-container"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Admin-themed Background Elements */}
      <AdminBackgroundElement 
        type="shield" 
        delay={0.1} 
        size="80px" 
        position={{ top: '10%', left: '10%' }} 
      />
      <AdminBackgroundElement 
        type="gear" 
        delay={0.3} 
        size="60px" 
        position={{ top: '15%', right: '15%' }} 
      />
      <AdminBackgroundElement 
        type="key" 
        delay={0.5} 
        size="90px" 
        position={{ bottom: '20%', left: '8%' }} 
      />
      <AdminBackgroundElement 
        type="chart" 
        delay={0.7} 
        size="70px" 
        position={{ bottom: '12%', right: '12%' }} 
      />
      <AdminBackgroundElement 
        type="shield" 
        delay={0.9} 
        size="50px" 
        position={{ top: '60%', right: '20%' }} 
      />

      {/* Main Login Card */}
      <div 
        ref={modalRef}
        className="admin-login-card"
        style={{
          background: wrapperActive ? 
            'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.88))' : 
            'rgba(255, 255, 255, 0.85)',
          backdropFilter: wrapperActive ? 'blur(20px)' : 'blur(10px)',
          borderRadius: '20px',
          padding: '40px 35px',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          boxShadow: wrapperActive ? 
            '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.1)' : 
            '0 15px 35px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          transform: isVisible ? 
            (wrapperActive ? 
              'scale(1) rotateX(0) rotateY(0) translateZ(0)' : 
              'scale(0.8) rotateX(10deg) rotateY(-5deg) translateZ(-80px)') : 
            'scale(0.6) rotateX(15deg) rotateY(10deg) translateZ(-150px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Animated Security Border */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #2c3e50, #3498db, #27ae60, #e74c3c)',
            opacity: wrapperActive ? 0.15 : 0,
            transition: 'opacity 0.6s ease 0.3s',
            zIndex: -1,
            filter: 'blur(12px)'
          }}
        />

        {/* Header Section */}
        <div 
          style={{ 
            textAlign: 'center', 
            marginBottom: '35px',
            opacity: animationStep >= 1 ? 1 : 0,
            transform: animationStep >= 1 ? 
              'translateY(0) translateZ(0)' : 
              'translateY(25px) translateZ(-40px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
          }}
        >
          {/* Admin Logo */}
          <div style={{
            width: "65px",
            height: "65px",
            background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: wrapperActive ? 
              "0 12px 30px rgba(44, 62, 80, 0.35), inset 0 2px 8px rgba(255, 255, 255, 0.25)" : 
              "0 8px 20px rgba(44, 62, 80, 0.3)",
            transform: wrapperActive ? 
              "rotate(0deg) scale(1)" : 
              "rotate(-30deg) scale(0.85)",
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
          }}>
            <span style={{ 
              color: "white", 
              fontWeight: "bold", 
              fontSize: "22px",
              fontFamily: 'Arial, sans-serif'
            }}>AD</span>
          </div>
          
          <h1 style={{ 
            margin: 0, 
            color: '#2c3e50',
            background: 'linear-gradient(135deg, #2c3e50, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            transform: wrapperActive ? 'translateZ(15px)' : 'translateZ(-15px)',
            transition: 'transform 0.6s ease 0.3s'
          }}>
            Admin Portal
          </h1>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '8px 0 0 0',
            fontSize: '15px',
            fontWeight: '500',
            opacity: wrapperActive ? 1 : 0.6,
            transform: wrapperActive ? 'translateZ(8px)' : 'translateZ(-8px)',
            transition: 'all 0.6s ease 0.4s'
          }}>
            Secure access to dashboard
          </p>
        </div>

        {/* Form Section */}
        <div 
          style={{
            opacity: animationStep >= 2 ? 1 : 0,
            transform: animationStep >= 2 ? 
              'translateX(0) translateZ(0)' : 
              'translateX(-25px) translateZ(-25px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
          }}
        >
          {/* Email Input */}
          <div style={{ marginBottom: '22px' }}>
            <input
              name="email"
              placeholder="Admin Email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 0px',
                borderRadius: '12px',
                border: errors.email ? 
                  '2px solid #e74c3c' : 
                  (wrapperActive ? 
                    '2px solid rgba(52, 152, 219, 0.25)' : 
                    '2px solid rgba(52, 152, 219, 0.15)'),
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: wrapperActive ? 
                  'rgba(255, 255, 255, 0.9)' : 
                  'rgba(255, 255, 255, 0.8)',
                boxShadow: wrapperActive ? 
                  '0 4px 15px rgba(0, 0, 0, 0.08)' : 
                  '0 2px 8px rgba(0, 0, 0, 0.05)',
                transform: wrapperActive ? 'translateZ(8px)' : 'translateZ(0)',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.email ? '#e74c3c' : '#3498db';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'translateZ(15px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? '#e74c3c' : 'rgba(52, 152, 219, 0.25)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateZ(8px)';
              }}
            />
            {errors.email && (
              <div style={{
                color: '#e74c3c',
                fontSize: '13px',
                marginTop: '6px',
                fontWeight: '500',
                opacity: animationStep >= 2 ? 1 : 0,
                transform: `translateX(${animationStep >= 2 ? '0' : '-10px'})`,
                transition: 'all 0.3s ease'
              }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '8px' }}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px 0px',
                borderRadius: '12px',
                border: errors.password ? 
                  '2px solid #e74c3c' : 
                  (wrapperActive ? 
                    '2px solid rgba(52, 152, 219, 0.25)' : 
                    '2px solid rgba(52, 152, 219, 0.15)'),
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: wrapperActive ? 
                  'rgba(255, 255, 255, 0.9)' : 
                  'rgba(255, 255, 255, 0.8)',
                boxShadow: wrapperActive ? 
                  '0 4px 15px rgba(0, 0, 0, 0.08)' : 
                  '0 2px 8px rgba(0, 0, 0, 0.05)',
                transform: wrapperActive ? 'translateZ(8px)' : 'translateZ(0)',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.password ? '#e74c3c' : '#3498db';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'translateZ(15px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? '#e74c3c' : 'rgba(52, 152, 219, 0.25)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateZ(8px)';
              }}
            />
            {errors.password && (
              <div style={{
                color: '#e74c3c',
                fontSize: '13px',
                marginTop: '6px',
                fontWeight: '500',
                opacity: animationStep >= 2 ? 1 : 0,
                transform: `translateX(${animationStep >= 2 ? '0' : '-10px'})`,
                transition: 'all 0.3s ease'
              }}>
                ⚠️ {errors.password}
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div 
          style={{
            opacity: animationStep >= 3 ? 1 : 0,
            transform: animationStep >= 3 ? 
              'translateY(0) translateZ(0)' : 
              'translateY(25px) translateZ(-25px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s',
            marginTop: '25px'
          }}
        >
          <button 
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: wrapperActive ? 
                '0 12px 30px rgba(52, 152, 219, 0.35), 0 4px 12px rgba(0, 0, 0, 0.1)' : 
                '0 8px 20px rgba(52, 152, 219, 0.3)',
              transform: wrapperActive ? 'translateZ(15px)' : 'translateZ(0)',
              position: 'relative',
              overflow: 'hidden',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) translateZ(25px)';
              e.target.style.boxShadow = '0 15px 35px rgba(52, 152, 219, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) translateZ(15px)';
              e.target.style.boxShadow = '0 12px 30px rgba(52, 152, 219, 0.35)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>
              🔒 Access Admin Dashboard
            </span>
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                transition: 'left 0.6s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.left = '100%';
              }}
            />
          </button>

          {/* Security Notice */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            opacity: animationStep >= 4 ? 1 : 0,
            transition: 'all 0.6s ease 0.7s'
          }}>
            <p style={{ 
              color: '#95a5a6', 
              fontSize: '12px',
              margin: 0,
              fontWeight: '500'
            }}>
              🔐 Restricted access • Authorized personnel only
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes adminFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) translateZ(0); 
          }
          33% { 
            transform: translateY(-12px) rotate(90deg) translateZ(8px); 
          }
          66% { 
            transform: translateY(8px) rotate(180deg) translateZ(-8px); 
          }
        }
        
        .admin-bg-element {
          animation: adminFloat 10s ease-in-out infinite;
        }

        @keyframes wrapperActivate {
          0% {
            opacity: 0;
            transform: scale(0.8) translateZ(-150px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        .admin-login-card {
          animation: wrapperActivate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Input focus effects */
        input:focus {
          box-shadow: 0 6px 20px rgba(52, 152, 219, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
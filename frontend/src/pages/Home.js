// Home.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import "./Home.css";

// Mock data generator for student performance
function generateStudentMockData(studentId, userName, userEmail) {
  // Create consistent random seed based on user ID
  const seed = studentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (min, max) => {
    const x = Math.sin(seed + min + max) * 10000;
    return min + (max - min) * (x - Math.floor(x));
  };

  // Generate performance data based on user characteristics
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];
  const activities = ["Class Participation", "Lab Work", "Group Project", "Quiz", "Assignment"];

  // Base performance level varies by user
  const basePerformance = 60 + (seed % 25); // 60-85 range
  const performanceMultiplier = seed % 3; // 0, 1, or 2

  const performanceData = [];
  const notifications = [];
  let totalScore = 0;
  let recordCount = 0;

  // Generate 8-12 performance records
  const numRecords = 8 + (seed % 5);
  for (let i = 0; i < numRecords; i++) {
    const isAcademic = random(0, 1) > 0.3; // 70% academic, 30% non-academic
    const date = new Date();
    date.setDate(date.getDate() - (i * 7)); // Spread over weeks

    let category, subcategory, score, level;

    if (isAcademic) {
      category = "subject";
      subcategory = subjects[i % subjects.length];
      score = Math.round(basePerformance + random(-15, 15) + (performanceMultiplier * 5));
      score = Math.max(45, Math.min(100, score));
    } else {
      category = ["club_participation", "attendance", "engagement"][i % 3];
      subcategory = activities[i % activities.length];
      score = Math.round(75 + random(-10, 15) + (performanceMultiplier * 3));
      score = Math.max(60, Math.min(100, score));
    }

    // Calculate level
    if (score >= 85) level = "excellent";
    else if (score >= 70) level = "average";
    else level = "low";

    totalScore += score;
    recordCount++;

    performanceData.push({
      id: `mock_${studentId}_${i}`,
      student_id: studentId,
      type: isAcademic ? "academic" : "non_academic",
      category: category,
      subcategory: subcategory,
      score: score,
      max_score: 100,
      semester: "Fall 2024",
      year: "2024",
      description: `${subcategory} performance`,
      calculated_level: level,
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    });

    // Generate notifications for low performance
    if (score < 70 && random(0, 1) > 0.7) {
      notifications.push({
        id: `notif_${studentId}_${i}`,
        student_id: studentId,
        type: "low_performance",
        title: "Performance Alert",
        message: `Your ${subcategory} score of ${score}% needs improvement. Consider reviewing the material and seeking help.`,
        priority: "high",
        read: random(0, 1) > 0.5,
        created_at: date.toISOString()
      });
    }
  }

  // Calculate average for AI prediction
  const averageScore = totalScore / recordCount;
  const trend = performanceMultiplier === 0 ? "improving" :
                performanceMultiplier === 1 ? "stable" : "declining";

  const aiPrediction = {
    student_id: studentId,
    predicted_score: Math.round(averageScore + random(-5, 8)),
    confidence: 75 + (seed % 20),
    trend: trend,
    suggestions: [
      "Focus on regular practice and review sessions",
      "Participate actively in class discussions",
      "Seek help from instructors when needed",
      "Maintain consistent study habits",
      "Join study groups for peer learning"
    ].slice(0, 3 + (seed % 2)),
    generated_at: new Date().toISOString()
  };

  const aiSuggestions = {
    student_id: studentId,
    suggestions: [
      "Create a dedicated study schedule and stick to it",
      "Use active recall techniques for better retention",
      "Take regular breaks using the Pomodoro technique",
      "Review and correct mistakes from assignments",
      "Practice with past exam papers",
      "Join online forums for subject-related discussions"
    ].slice(0, 4 + (seed % 3)),
    priority_areas: subjects.slice(0, 2 + (seed % 2)),
    generated_at: new Date().toISOString()
  };

  // Add some positive notifications
  if (averageScore > 80 && notifications.length < 2) {
    notifications.push({
      id: `notif_${studentId}_positive`,
      student_id: studentId,
      type: "improvement",
      title: "Great Performance!",
      message: `Excellent work! Your overall performance is outstanding. Keep up the great work!`,
      priority: "medium",
      read: false,
      created_at: new Date().toISOString()
    });
  }

  return {
    performanceData,
    notifications,
    aiPrediction,
    aiSuggestions
  };
}

// Chatbot Component (unchanged as requested)
function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const userId = localStorage.getItem("token") || "guest";

  // Function to format the bot response with non-null data
  const formatBotResponse = (data) => {
    let response = data.message + "\n\n";
    
    // Add events if available
    if (data.events) {
      response += "📅 **Events:**\n";
      Object.values(data.events).forEach(eventArray => {
        eventArray.forEach(event => {
          response += `• ${event.title} - ${new Date(event.date).toLocaleDateString()}\n`;
        });
      });
      response += "\n";
    }
    
    // Add clubs if available
    if (data.clubs) {
      response += "👥 **Clubs:**\n";
      Object.values(data.clubs).forEach(clubArray => {
        clubArray.forEach(club => {
          response += `• ${club.name}`;
          if (club.description) response += ` - ${club.description}`;
          response += "\n";
        });
      });
      response += "\n";
    }
    
    // Add teachers if available
    if (data.teachers) {
      response += "👨‍🏫 **Teachers:**\n";
      Object.values(data.teachers).forEach(teacherArray => {
        teacherArray.forEach(teacher => {
          response += `• ${teacher.name} (${teacher.email})\n`;
        });
      });
      response += "\n";
    }
    
    // Add students if available
    if (data.students) {
      response += "👨‍🎓 **Students:**\n";
      Object.values(data.students).forEach(studentArray => {
        studentArray.forEach(student => {
          response += `• ${student.name} (${student.email})\n`;
        });
      });
    }
    
    return response;
  };

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages([...messages, newMessage]);
    setInput("");

    try {
      console.log("Sending question to backend:", input);
      console.log("User ID:", userId);
      const res = await API.post("/chatbot/query", {
        question: input,
        user_id: userId,
      });
      
      console.log("Received response from backend:", res.data);
      
      // Format the bot response based on the data structure
      const botResponse = formatBotResponse(res.data);
      const botMessage = { sender: "bot", text: botResponse };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error fetching response:", err);
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "❌ Error fetching response from the server. Please try again later." 
      }]);
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    "What events are happening?",
    "Tell me about clubs",
    "Show upcoming activities"
  ];

  const handleQuickAction = (action) => {
    setInput(action);
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot Toggle Button */}
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🤖
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Chatbot Header */}
          <div className="chatbot-header">
            <h3>CampusBuzz Assistant</h3>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          {/* Chatbot Messages Area */}
          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <div className="message bot">
                  👋 Hello! I'm your CampusBuzz assistant. How can I help you today?
                </div>
                <div className="quick-actions">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="quick-action-btn"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div 
                  key={i} 
                  className={`message ${m.sender}`}
                >
                  {m.text}
                </div>
              ))
            )}
          </div>

          {/* Chatbot Input Area */}
          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about campus..."
            />
            <button 
              className="chatbot-send"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const threeContainerRef = useRef(null);
  const role = localStorage.getItem("role");

  // Performance tracking states for students
  const [performanceData, setPerformanceData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const [selectedClub, setSelectedClub] = useState(
    localStorage.getItem("selectedClub") || ""
  );

  useEffect(() => {
    localStorage.setItem("selectedClub", selectedClub);
  }, [selectedClub]);

  // High-quality images for hero section
  const heroImages = [
    "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2128&q=80",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://plus.unsplash.com/premium_photo-1661877737564-3dfd7282efcb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1200"
  ];

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // ------------------- THREE.JS BACKGROUND -------------------
  useEffect(() => {
    const initThreeScene = () => {
      if (typeof window !== "undefined" && threeContainerRef.current) {
        const THREE = window.THREE;
        
        if (!THREE) {
          console.error("Three.js not loaded");
          return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        threeContainerRef.current.appendChild(renderer.domElement);
        
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 500;
        
        const posArray = new Float32Array(particlesCount * 3);
        const colorArray = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i++) {
          posArray[i] = (Math.random() - 0.5) * 15;
          colorArray[i] = Math.random();
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
          size: 0.05,
          vertexColors: true,
          transparent: true,
          opacity: 0.8
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
        
        camera.position.z = 5;
        
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
          mouseX = (event.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        const clock = new THREE.Clock();
        
        const animate = () => {
          requestAnimationFrame(animate);
          
          const elapsedTime = clock.getElapsedTime();
          
          particlesMesh.rotation.y = elapsedTime * 0.1;
          particlesMesh.rotation.x = elapsedTime * 0.05;
          
          particlesMesh.position.x = mouseX * 0.5;
          particlesMesh.position.y = mouseY * 0.5;
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (threeContainerRef.current && renderer.domElement) {
            threeContainerRef.current.removeChild(renderer.domElement);
          }
        };
      }
    };

    if (!window.THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = initThreeScene;
      document.head.appendChild(script);
    } else {
      initThreeScene();
    }
  }, []);

  // Fetch events, blogs, reviews
  useEffect(() => {
    API.get("/events")
      .then((res) => {
        // ✅ Ensure events is always an array
        const eventsData = res.data || [];
        setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 3) : []);
      })
      .catch(() => setEvents([]));

    API.get("/blogs")
      .then((res) => {
        const blogsData = res.data || [];
        setBlogs(Array.isArray(blogsData) ? blogsData.slice(0, 3) : []);
      })
      .catch(() => setBlogs([]));

    setReviews([
      { id: 1, name: "Alice", review: "Great platform for students!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" },
      { id: 2, name: "Bob", review: "I enjoyed participating in events.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" },
      { id: 3, name: "Charlie", review: "Very smooth process and helpful team.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" },
    ]);

    API.get("/student/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => console.log("Profile not found", err));

    API.get("/clubs")
      .then((res) => {
        const clubsData = res.data || [];
        setClubs(Array.isArray(clubsData) ? clubsData : []);
      })
      .catch(() => setClubs([]));

    setTimeout(() => setIsLoading(false), 1500);
  }, [role]);

  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await API.get("/clubs");
        const clubsData = res.data || [];
        setClubs(Array.isArray(clubsData) ? clubsData : []);
      } catch (err) {
        console.error("Error fetching clubs:", err);
        setClubs([]);
      }
    }
    fetchClubs();
  }, []);



  async function registerEvent(eventId) {
    try {
      await API.post(`/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Registered successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error registering");
    }
  }

  const applyJoinClub = async (clubId) => {
    try {
      await API.post("/clubs/apply/join", {
        club_id: clubId,
        user_token: localStorage.getItem("token")
      });
      alert("Applied successfully!");
    } catch (err) {
      console.error("Failed to apply:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2>Loading CampusBuzz...</h2>
      </div>
    );
  }

  // ✅ Safe array access for rendering
  const safeEvents = Array.isArray(events) ? events : [];
  const safeBlogs = Array.isArray(blogs) ? blogs : [];
  const safeClubs = Array.isArray(clubs) ? clubs : [];

  const fallbackMedia = ["/images/Achivement.jpg", "/images/fashion.jpg", "/images/programming'.jpg", "/images/reporterBoy.png", "/images/song (1).mp4"];

  const getRandomFallback = () => {
    return fallbackMedia[Math.floor(Math.random() * fallbackMedia.length)];
  };

  const renderImage = (blog) => {
    console.debug("[renderImage] called");
    console.debug("[renderImage] blog object:", blog);

    if (!blog.media) {
      console.warn("[renderImage] blog.media is missing, using random fallback");
      const fallbackUrl = getRandomFallback();
      const isVideo = /\.(mp4|webm|ogg)$/i.test(fallbackUrl);

      if (isVideo) {
        return (
          <div className="blog-media">
            <video
              controls
              className="blog-video"
              src={fallbackUrl}
              onPlay={() => console.debug("[renderImage] Fallback video started playing")}
              onPause={() => console.debug("[renderImage] Fallback video paused")}
              onError={(e) => console.error("[renderImage] Fallback video error", e)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else {
        return (
          <div className="blog-media">
            <img
              src={fallbackUrl}
              alt="Blog media"
              className="blog-image"
              onLoad={() => console.debug("[renderImage] Fallback image loaded successfully")}
              onError={(e) => console.error("[renderImage] Fallback image failed to load", e)}
            />
          </div>
        );
      }
    }

    const mediaUrl = blog.media;
    console.debug("[renderImage] mediaUrl:", mediaUrl);

    const isVideo =
      /\.(mp4|webm|ogg)$/i.test(mediaUrl) ||
      mediaUrl.includes("youtube.com") ||
      mediaUrl.includes("vimeo.com") ||
      blog.mediaType === "video";

    console.debug("[renderImage] blog.mediaType:", blog.mediaType);
    console.debug("[renderImage] isVideo:", isVideo);

    if (isVideo) {
      console.debug("[renderImage] Rendering VIDEO");

      return (
        <div className="blog-media">
          <video
            controls
            className="blog-video"
            src={mediaUrl}
            onPlay={() => console.debug("[renderImage] Video started playing")}
            onPause={() => console.debug("[renderImage] Video paused")}
            onError={(e) => console.error("[renderImage] Video error", e)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      console.debug("[renderImage] Rendering IMAGE");

      const imageUrl =
        blog.mediaType === "file"
          ? `${API.defaults.baseURL}/uploads/blogs/${mediaUrl.split("/").pop()}`
          : mediaUrl;

      console.debug("[renderImage] Computed imageUrl:", imageUrl);

      return (
        <div className="blog-media">
          <img
            src={imageUrl}
            alt={blog.title}
            className="blog-image"
            onLoad={() => {
              console.debug("[renderImage] Image loaded successfully:", imageUrl);
            }}
            onError={(e) => {
              console.error("[renderImage] Image failed to load", { failedUrl: imageUrl, event: e });
            }}
          />
        </div>
      );
    }
  };

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open performance modal with mock data
  const openPerformanceModal = () => {
    setShowPerformanceModal(true);
    setPerformanceLoading(true);

    // Generate mock data immediately
    const studentId = localStorage.getItem("userId") || "demo_student";
    const userName = localStorage.getItem("userName") || "Student";
    const userEmail = localStorage.getItem("adminEmail") || localStorage.getItem("userEmail") || "";

    const mockData = generateStudentMockData(studentId, userName, userEmail);

    // Simulate loading time for better UX
    setTimeout(() => {
      setPerformanceData(mockData.performanceData);
      setNotifications(mockData.notifications);
      setAiPrediction(mockData.aiPrediction);
      setAiSuggestions(mockData.aiSuggestions);
      setPerformanceLoading(false);
    }, 1500);
  };

  // Close performance modal
  const closePerformanceModal = () => {
    setShowPerformanceModal(false);
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="home-navigation" style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '25px',
        padding: '10px 20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="nav-buttons" style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => scrollToSection('hero')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('information')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Information
          </button>
          <button
            onClick={() => scrollToSection('events')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Events
          </button>
          <button
            onClick={() => scrollToSection('blogs')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Blogs
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Contact
          </button>
          {/* Student Performance Button - Only for logged-in students */}
          {role === "student" && (
            <button
              onClick={() => openPerformanceModal()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              📊 Student Performance
            </button>
          )}
        </div>
      </nav>

      {/* Three.js Background */}
      <div ref={threeContainerRef} className="three-background"></div>

      {/* Chatbot Component */}
      <Chatbot />
      
      {/* Hero Section with rotating images */}
      <section id="hero" className="hero-section">
        <div className="hero-slideshow">
          {heroImages.map((image, index) => (
            <div 
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            ></div>
          ))}
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">Campus Life Platform</div>
          <h1>Welcome to <span className="brand">CampusBuzz</span></h1>
          <p>Your one-stop platform for campus activities, events, clubs, and more.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Explore Events</Link>
            <Link to="/blogs" className="btn-outline">Read Blogs</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat">
              <span className="stat-number">20+</span>
              <span className="stat-label">Clubs</span>
            </div>
            <div className="stat">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Students</span>
            </div>
          </div>
        </div>
      </section>


      {/* Information Section */}
      <section className="information-section" id="information">
        <div className="section-header">
          <h2>Why Choose CampusBuzz?</h2>
          <div className="underline"></div>
        </div>
        
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">📅</div>
            <h3>Events</h3>
            <p>Access and participate in a variety of campus events ranging from academic workshops to cultural festivals, all in one platform.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🏆</div>
            <h3>Clubs & Societies</h3>
            <p>Discover and join student clubs that match your interests, from technical societies to hobby groups, fostering collaboration and personal growth.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🚀</div>
            <h3>Student Growth</h3>
            <p>Our platform is designed to foster holistic development by providing opportunities for skill enhancement, leadership development, and networking.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🤝</div>
            <h3>Collaboration Hub</h3>
            <p>CampusBuzz serves as a central hub where students can find collaborators for projects, form teams for competitions, and connect with like-minded individuals.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">💼</div>
            <h3>Career Preparation</h3>
            <p>Participate in workshops, hackathons, and industry interactions that build your resume and prepare you for future career opportunities.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🌐</div>
            <h3>Campus Community</h3>
            <p>Join a vibrant digital campus community where you can stay updated with all campus activities, share achievements, and contribute to making your college experience more engaging.</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="section events-section">
        <div className="section-background" style={{backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')"}}></div>
        <div className="section-overlay"></div>
        <div className="section-content">
          <div className="section-header">
            <h2>Events</h2>
            <div className="underline"></div>
          </div>
          {safeEvents.length > 0 ? (
            <div className="events-grid">
              {safeEvents.map((e) => (
                <div key={e.id} className="event-card">
                  <div className="event-image">
                    <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Event" />
                    <div className="event-date">
                      <span className="date-day">{new Date(e.date).getDate()}</span>
                      <span className="date-month">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                  </div>
                  <div className="event-content">
                    <h3>{e.title}</h3>
                    <p>{e.description}</p>
                    <div className="event-details">
                      <span className="event-venue">📍 {e.venue}</span>
                    </div>
                    <button className="btn-primary" onClick={() => registerEvent(e.id)}>Register Now</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>No events available</h3>
              <p>Check back later for upcoming events</p>
            </div>
          )}
          <div className="section-footer">
            <Link to="/events" className="view-all-link">View All Events →</Link>
          </div>
        </div>
      </section>

      {/* Latest Blogs */}
      <section id="blogs" className="section blogs-section">
        <div className="section-background" style={{backgroundImage: "url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')"}}></div>
        <div className="section-overlay"></div>
        <div className="section-content">
          <div className="section-header">
            <h2>Latest Blogs & Announcements</h2>
            <div className="underline"></div>
          </div>
          {safeBlogs.length > 0 ? (
            <div className="blogs-grid">
              {safeBlogs.map((blog) => (
                <div key={blog._id} className="blog-card">
                  {renderImage(blog)}
                  <div className="blog-content">
                    <div className="blog-header">
                      <h3 className="blog-title">{blog.title}</h3>
                    </div>
                    <p className="blog-excerpt">
                      {blog.content?.substring(0, 150)}
                      {blog.content?.length > 150 ? "..." : ""}
                    </p>
                    <div className="blog-meta">
                      {blog.author && <span className="blog-author">By {blog.author}</span>}
                      {blog.created_at && (
                        <span className="blog-date">
                          {new Date(blog.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <div className="blog-footer">
                      <Link to={`/blogs`} className="read-more">Read Full Story →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No blogs available</h3>
              <p>Check back later for new blogs</p>
            </div>
          )}
          <div className="section-footer">
            <Link to="/blogs" className="view-all-link">View All Blogs →</Link>
          </div>
        </div>
      </section>

<section className="section clubs-section">
  <div className="section-background" style={{backgroundImage: "url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"}}></div>
  <div className="section-overlay"></div>
  <div className="section-content">
    <div className="section-header">
      <h2>Join a Club</h2>
      <div className="underline"></div>
    </div>
    
    <div className="clubs-grid">
      {safeClubs.length > 0 ? (
        safeClubs.map((club) => (
          <div key={club.id} className="club-poster-card">
            {/* Club Image */}
            <div className="club-image-container">
              {club.image_base64 ? (
                <img 
                  src={`data:image/jpeg;base64,${club.image_base64}`} 
                  alt={club.name} 
                  className="club-image"
                />
              ) : (
                <div className="club-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>
            
            {/* Club Details */}
            <div className="club-details">
              <h3 className="club-name">{club.name}</h3>
              
              {club.email && (
                <div className="club-email">
                  <span className="email-label">Email: </span>
                  <a href={`mailto:${club.email}`} className="email-link">
                    {club.email}
                  </a>
                </div>
              )}
              
              {club.club_email && (
                <div className="club-email">
                  <span className="email-label">Club Email: </span>
                  <a href={`mailto:${club.club_email}`} className="email-link">
                    {club.club_email}
                  </a>
                </div>
              )}
              
              {club.description && (
                <div className="club-description">
                  <p>{club.description}</p>
                </div>
              )}
              
              {club.club_description && (
                <div className="club-description">
                  <h4>Club Description</h4>
                  <p>{club.club_description}</p>
                </div>
              )}
              
              {club.purpose_objectives && (
                <div className="club-purpose">
                  <h4>Purpose & Objectives</h4>
                  <p>{club.purpose_objectives}</p>
                </div>
              )}
            </div>
            
            {/* Join Button */}
            <div className="club-actions">
              <button
                className="btn-primary join-btn"
                onClick={() => applyJoinClub(club.id)}
              >
                Join Club
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-clubs-message">
          <p>No clubs available to join at the moment.</p>
        </div>
      )}
    </div>
  </div>
</section>

      {/* Reviews Section */}
      <section className="section reviews-section">
        <div className="section-header">
          <h2>What Students Say</h2>
          <div className="underline"></div>
        </div>
        <div className="reviews-grid">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  <img src={r.avatar} alt={r.name} />
                </div>
                <h4>{r.name}</h4>
              </div>
              <div className="review-content">
                <p>"{r.review}"</p>
              </div>
              <div className="review-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="star">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <div className="section-background" style={{backgroundImage: "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')"}}></div>
        <div className="section-overlay"></div>
        <div className="section-content">
          <div className="section-header">
            <h2>Contact Us</h2>
            <div className="underline"></div>
          </div>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div className="contact-details">
                <h4>Address</h4>
                <p>Club Colleges, Bangalore, Karnataka</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-details">
                <h4>Phone</h4>
                <p>+91 9876543210</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-details">
                <h4>Email</h4>
                <p>support@campusbuzz.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Performance Modal */}
      {showPerformanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.95) 0%, rgba(20, 20, 40, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                margin: 0,
                color: '#fff',
                fontSize: '28px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #fff 0%, #a8b2d1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                📊 Your Performance Dashboard
              </h2>
              <button
                onClick={closePerformanceModal}
                style={{
                  background: 'rgba(231, 76, 60, 0.15)',
                  color: '#e74c3c',
                  border: '1.5px solid rgba(231, 76, 60, 0.3)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'rotate(90deg)'}
                onMouseLeave={(e) => e.target.style.transform = 'rotate(0deg)'}
              >
                ×
              </button>
            </div>

            {/* Loading State */}
            {performanceLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: '#fff'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '3px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  borderTopColor: '#ff6b6b',
                  animation: 'spin 1s ease-in-out infinite',
                  marginBottom: '20px'
                }}></div>
                <h3>Loading your performance data...</h3>
                <p style={{ opacity: 0.7 }}>Fetching latest analytics and insights</p>
              </div>
            ) : (
              <div style={{ color: '#fff' }}>
                {/* Performance Notifications */}
                {notifications.length > 0 && (
                  <div style={{
                    marginBottom: "30px",
                    padding: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <h3 style={{ color: "#fff", marginBottom: "15px" }}>📢 Performance Notifications</h3>
                    {notifications.slice(0, 3).map((notif, index) => (
                      <p key={index} style={{ margin: "8px 0", color: "#fff" }}>
                        <strong>{notif.title}:</strong> {notif.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Performance Insights */}
                {aiPrediction && (
                  <div style={{
                    marginBottom: "30px",
                    padding: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <h3 style={{ color: "#fff", marginBottom: "15px" }}>🤖 AI Performance Prediction</h3>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "15px" }}>
                      <div>
                        <strong style={{ color: "#fff" }}>Predicted Score:</strong>
                        <span style={{ color: "#4CAF50", fontSize: "1.2em", marginLeft: "10px" }}>{aiPrediction.predicted_score}%</span>
                      </div>
                      <div>
                        <strong style={{ color: "#fff" }}>Confidence:</strong>
                        <span style={{ color: "#2196F3", marginLeft: "10px" }}>{aiPrediction.confidence}%</span>
                      </div>
                      <div>
                        <strong style={{ color: "#fff" }}>Trend:</strong>
                        <span style={{
                          color: aiPrediction.trend === "improving" ? "#4CAF50" : aiPrediction.trend === "declining" ? "#F44336" : "#FF9800",
                          marginLeft: "10px"
                        }}>{aiPrediction.trend}</span>
                      </div>
                    </div>
                    {aiPrediction.suggestions.length > 0 && (
                      <div>
                        <strong style={{ color: "#fff" }}>AI Suggestions:</strong>
                        <ul style={{ color: "#fff", marginTop: "10px" }}>
                          {aiPrediction.suggestions.map((suggestion, index) => (
                            <li key={index} style={{ margin: "5px 0" }}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Performance Records */}
                {performanceData.length > 0 && (
                  <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ color: "#fff", marginBottom: "20px" }}>📊 Recent Performance Records</h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "15px"
                    }}>
                      {performanceData.slice(0, 8).map((record, index) => (
                        <div key={index} style={{
                          padding: "20px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "10px",
                          backdropFilter: "blur(10px)",
                          textAlign: "center"
                        }}>
                          <h4 style={{ margin: "0 0 10px", color: "#fff", fontSize: "1.1em" }}>
                            {record.category === "subject" ? record.subcategory : record.category.replace("_", " ").toUpperCase()}
                          </h4>
                          <p style={{ margin: "0 0 10px", color: "#fff", fontSize: "2em", fontWeight: "bold" }}>{record.score}%</p>
                          <p style={{
                            margin: "0",
                            color: record.calculated_level === "excellent" ? "#4CAF50" :
                                   record.calculated_level === "average" ? "#FF9800" : "#F44336",
                            fontWeight: "bold",
                            fontSize: "1.1em"
                          }}>{record.calculated_level?.toUpperCase()}</p>
                          <p style={{ margin: "10px 0 0", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9em" }}>
                            {new Date(record.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Improvement Suggestions */}
                {aiSuggestions && aiSuggestions.suggestions.length > 0 && (
                  <div style={{
                    padding: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <h3 style={{ color: "#fff", marginBottom: "15px" }}>💡 AI Improvement Suggestions</h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "15px"
                    }}>
                      {aiSuggestions.suggestions.map((suggestion, index) => (
                        <div key={index} style={{
                          padding: "15px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                          <p style={{ margin: 0, color: "#fff" }}>{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
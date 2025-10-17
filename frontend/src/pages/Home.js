// Home.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import "./Home.css";

// Chatbot Component (moved from Chatbot.js and integrated)
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
      const res = await API.post("/chatbot/ask", {
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
  const threeContainerRef = useRef(null);
  const role = localStorage.getItem("role");

  const [selectedClub, setSelectedClub] = useState(
    localStorage.getItem("selectedClub") || ""
  );

  useEffect(() => {
    localStorage.setItem("selectedClub", selectedClub);
  }, [selectedClub]);

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

  return (
    <div className="home-page">
      {/* Three.js Background */}
      <div ref={threeContainerRef} className="three-background"></div>
      
      {/* Chatbot Component */}
      <Chatbot />
      
      {/* Hero Section */}
      <section className="hero-section">
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
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">🎉</div>
            <p>Events</p>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">📝</div>
            <p>Blogs</p>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">👥</div>
            <p>Clubs</p>
          </div>
          <div className="hero-image">
            <img src="images/reporterBoy.png" alt="Campus Events Icon" />
          </div>
        </div>
      </section>

      <div className="information-section" id="information">
        <div className="about-grid">
          {/* Existing cards remain unchanged */}
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
          
          {/* New enhanced content cards */}
          <div className="about-card">
            <div className="about-icon">🚀</div>
            <h3>Student Growth</h3>
            <p>Our platform is designed to foster holistic development by providing opportunities for skill enhancement, leadership development, and networking with peers and professionals across various domains.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🤝</div>
            <h3>Collaboration Hub</h3>
            <p>CampusConnect serves as a central hub where students can find collaborators for projects, form teams for competitions, and connect with like-minded individuals who share similar academic and extracurricular interests.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">💼</div>
            <h3>Career Preparation</h3>
            <p>Participate in workshops, hackathons, and industry interactions that build your resume and prepare you for future career opportunities while still in college.</p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">🌐</div>
            <h3>Campus Community</h3>
            <p>Join a vibrant digital campus community where you can stay updated with all campus activities, share achievements, and contribute to making your college experience more engaging and memorable.</p>
          </div>
        </div>
        
        {/* Detailed Event Information Section */}
        <div className="event-details">
          <h2>Explore Campus Events & Activities</h2>
          <div className="event-categories">
            <div className="event-category">
              <h3>💻 Hackathons & Coding Events</h3>
              <ul>
                <li><strong>24-Hour Codeathons:</strong> Intensive coding competitions where teams solve real-world problems</li>
                <li><strong>Algorithm Challenges:</strong> Weekly coding contests to sharpen problem-solving skills</li>
                <li><strong>Web Development Marathons:</strong> Build complete web applications in limited timeframes</li>
                <li><strong>AI/ML Competitions:</strong> Work on cutting-edge artificial intelligence projects</li>
                <li><strong>App Development Sprints:</strong> Create mobile applications for specific use cases</li>
              </ul>
              <p><strong>Benefits:</strong> Enhance technical skills, build portfolio projects, network with tech companies, win prizes and recognition.</p>
            </div>
            
            <div className="event-category">
              <h3>🎭 Cultural & Arts Events</h3>
              <ul>
                <li><strong>Dance Competitions:</strong> Various styles including contemporary, hip-hop, classical, and fusion</li>
                <li><strong>Music Festivals:</strong> Band performances, solo singing, instrumental competitions</li>
                <li><strong>Drama & Theater:</strong> Stage plays, street plays, improvisation workshops</li>
                <li><strong>Art Exhibitions:</strong> Showcasing paintings, sculptures, digital art, and photography</li>
                <li><strong>Literary Events:</strong> Poetry slams, debate competitions, creative writing workshops</li>
              </ul>
              <p><strong>Benefits:</strong> Express creativity, relieve academic stress, discover hidden talents, build confidence in performance.</p>
            </div>
            
            <div className="event-category">
              <h3>⚽ Sports & Fitness Events</h3>
              <ul>
                <li><strong>Inter-College Tournaments:</strong> Cricket, football, basketball, volleyball championships</li>
                <li><strong>Individual Sports:</strong> Badminton, table tennis, chess, athletics competitions</li>
                <li><strong>Adventure Sports:</strong> Trekking, rock climbing, marathon runs</li>
                <li><strong>Fitness Challenges:</strong> Yoga sessions, zumba workshops, fitness bootcamps</li>
                <li><strong>E-Sports:</strong> Gaming tournaments featuring popular competitive video games</li>
              </ul>
              <p><strong>Benefits:</strong> Maintain physical health, develop teamwork skills, learn sportsmanship, compete at various levels.</p>
            </div>
            
            <div className="event-category">
              <h3>🔬 Academic & Technical Events</h3>
              <ul>
                <li><strong>Technical Workshops:</strong> Hands-on sessions on emerging technologies</li>
                <li><strong>Research Symposiums:</strong> Present and discuss academic research projects</li>
                <li><strong>Guest Lectures:</strong> Industry experts and alumni sharing insights</li>
                <li><strong>Project Exhibitions:</strong> Showcase innovative student projects</li>
                <li><strong>Case Study Competitions:</strong> Solve real business and technical challenges</li>
              </ul>
              <p><strong>Benefits:</strong> Deepen subject knowledge, gain practical skills, interact with experts, enhance academic credentials.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <section className="section events-section">
        <div className="section-header">
          <h2>Upcoming Events</h2>
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
      </section>

      {/* Latest Blogs */}
      <section className="section blogs-section">
        <div className="section-header">
          <h2>Latest Blogs & Announcements</h2>
          <div className="underline"></div>
        </div>
        {safeBlogs.length > 0 ? (
          <div className="blogs-grid">
            {safeBlogs.map((blog) => (
              <div key={blog._id} className="blog-card">
                <div className="blog-image">
                  {blog.image ? (
                    <img src={blog.image} alt="Blog" />
                  ) : (
                    <img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Blog" />
                  )}
                </div>
                <div className="blog-content">
                  <h3>{blog.title}</h3>
                  <p>{blog.content?.substring(0, 100)}...</p>
                  <Link to={`/blogs`} className="read-more">Read More →</Link>
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
      </section>

      {/* Join Club Section */}
      <section className="section clubs-section">
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
                  {club.image ? (
                    <img 
                      src={club.image} 
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
                  
                  {club.description && (
                    <div className="club-description">
                      <p>{club.description}</p>
                    </div>
                  )}
                  
                  {club.purpose && (
                    <div className="club-purpose">
                      <h4>Purpose</h4>
                      <p>{club.purpose}</p>
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
        <div className="section-header">
          <h2>Contact Us</h2>
          <div className="underline"></div>
        </div>
        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div className="contact-details">
              <h4>Address</h4>
              <p>ABC University, City, State</p>
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
      </section>
    </div>
  );
}
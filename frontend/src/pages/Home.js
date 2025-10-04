// Home.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import "./Home.css";

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
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to <span className="brand">CampusBuzz</span></h1>
          <p>Your one-stop platform for campus activities, events, clubs, and more.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Explore Events</Link>
            <Link to="/blogs" className="btn-outline">Read Blogs</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="images/reporterBoy.png" alt="Campus Events Icon" />
        </div>
      </section>

      {/* About Section */}
      <section id="information" className="section about-section">
        <div className="section-header">
          <h2>About CampusBuzz</h2>
          <div className="underline"></div>
        </div>
        <div className="about-content">
          <p>
            CampusBuzz is your one-stop platform for staying updated with all campus 
            activities. From cultural events to hackathons, student blogs to club 
            announcements, we bring everything together in one place.
          </p>
          <p>
            Students can register for events, join clubs, and explore blogs, while 
            clubs and admins manage activities with ease. CampusBuzz helps in 
            connecting the entire campus community.
          </p>
        </div>
      </section>

      {/* Student Profile Summary */}
      {profile && (
        <section className="section profile-section">
          <div className="section-header">
            <h2>Your Profile</h2>
            <div className="underline"></div>
          </div>
          <div className="profile-card">
            <div className="profile-avatar">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Profile" />
            </div>
            <div className="profile-info">
              <h3>{profile.name}</h3>
              <p><span className="label">Department:</span> {profile.department}</p>
              <p><span className="label">Year:</span> {profile.year}</p>
            </div>
          </div>
        </section>
      )}

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
                </div>
                <div className="event-content">
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                  <div className="event-details">
                    <span className="event-date">📅 {new Date(e.date).toLocaleString()}</span>
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
        <div className="club-join">
          <div className="club-selector">
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="club-dropdown"
            >
              <option value="">-- Select a Club --</option>
              {safeClubs.length > 0 ? (
                safeClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option disabled>No clubs available</option>
              )}
            </select>
            <button
              className="btn-primary"
              disabled={!selectedClub}
              onClick={() => applyJoinClub(selectedClub)}
            >
              Apply to Join
            </button>
          </div>
          <p className="club-help-text">Select a club from the list and apply to become a member</p>
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
            <p>ABC University, City, State</p>
          </div>
          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <p>+91 9876543210</p>
          </div>
          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <p>support@campusbuzz.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
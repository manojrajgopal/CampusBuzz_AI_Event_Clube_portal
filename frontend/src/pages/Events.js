import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    API.get("/events").then((res) => {
      setEvents(res.data);
      setLoading(false);
    });
  }, []);

  async function register(eventId) {
    try {
      await API.post(`/events/${eventId}/register`, { event_id: eventId });
      alert("Registered successfully!");
    } catch {
      alert("Registration failed");
    }
  }

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

  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <div className="events-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-gradient">Upcoming Events</span>
            <div className="title-underline"></div>
          </h1>
          <p className="hero-subtitle">
            Discover and register for amazing events happening around you
          </p>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search events..." 
              className="search-input"
            />
            <button className="search-btn">
              <span className="search-icon">🔍</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading events...</p>
          </div>
        ) : safeEvents.length > 0 ? (
          <div className="events-grid">
            {safeEvents.map((e, index) => (
              <div 
                key={e.id}
                className={`event-card ${hoveredCard === e.id ? 'card-hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(e.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card Header with Image */}
                <div className="card-header">
                  <div className="card-image">
                    <img 
                      src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                      alt="Event" 
                    />
                    <div className="image-overlay"></div>
                  </div>
                  <div className="card-badges">
                    <span className="badge featured">Featured</span>
                    <span className="badge category">Conference</span>
                  </div>
                  <div className="card-date">
                    <span className="date-day">
                      {new Date(e.date).getDate()}
                    </span>
                    <span className="date-month">
                      {new Date(e.date).toLocaleString('en-US', { month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3 className="event-title">{e.title}</h3>
                  <p className="event-description">{e.description}</p>
                  
                  <div className="event-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⏰</span>
                      <span className="meta-text">
                        {new Date(e.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span className="meta-text">{e.venue}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span className="meta-text">120 Attendees</span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                    <span className="progress-text">75% Booked</span>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="btn btn-primary register-btn"
                      onClick={() => registerEvent(e.id)}
                    >
                      <span className="btn-icon">🎯</span>
                      Register Now
                    </button>
                    <button className="btn btn-secondary">
                      <span className="btn-icon">❤️</span>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3 className="empty-title">No Events Available</h3>
            <p className="empty-description">
              We're working on bringing you amazing events soon. Check back later!
            </p>
            <div className="empty-actions">
              <button className="btn btn-primary">Notify Me</button>
              <button className="btn btn-outline">Browse Categories</button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🎉</div>
            <div className="stat-number">500+</div>
            <div className="stat-label">Events Hosted</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Attendees</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-number">4.9</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-card">
            <div className="cta-content">
              <h3>Never Miss an Event</h3>
              <p>Subscribe to our newsletter and get notified about upcoming events</p>
              <div className="cta-form">
                <input type="email" placeholder="Enter your email" className="cta-input" />
                <button className="btn btn-primary">Subscribe</button>
              </div>
            </div>
            <div className="cta-image">
              <div className="cta-graphic">📧</div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .events-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 100px;
          height: 100px;
          bottom: 10%;
          left: 15%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        .hero-section {
          position: relative;
          padding: 80px 20px 60px;
          text-align: center;
          color: white;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1rem;
          position: relative;
        }

        .title-gradient {
          background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-underline {
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #ff6b6b, #ffd93d);
          margin: 1rem auto;
          border-radius: 2px;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .search-bar {
          display: flex;
          max-width: 500px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          padding: 5px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 15px 20px;
          color: white;
          font-size: 1rem;
          outline: none;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .search-btn {
          background: linear-gradient(135deg, #ff6b6b, #ffd93d);
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .search-btn:hover {
          transform: scale(1.05);
        }

        .main-content {
          position: relative;
          z-index: 1;
          padding: 0 20px 0px;
        }

        .loading-container {
          text-align: center;
          padding: 4rem;
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .event-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: cardEntrance 0.6s ease-out;
          animation-fill-mode: both;
        }

        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .event-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .event-card:hover .card-image img {
          transform: scale(1.1);
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%);
        }

        .card-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .badge.featured {
          background: linear-gradient(135deg, #ff6b6b, #ffd93d);
          color: white;
        }

        .badge.category {
          background: rgba(255, 255, 255, 0.9);
          color: #333;
        }

        .card-date {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 0.8rem;
          border-radius: 12px;
          text-align: center;
          min-width: 60px;
        }

        .date-day {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .date-month {
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
        }

        .card-content {
          padding: 1.5rem;
        }

        .event-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.8rem;
          line-height: 1.4;
        }

        .event-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-bottom: 1.5rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .meta-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
        }

        .meta-text {
          color: #555;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .progress-bar {
          background: #e0e0e0;
          border-radius: 10px;
          height: 8px;
          margin-bottom: 1rem;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
        }

        .card-actions {
          display: flex;
          gap: 0.8rem;
        }

        .btn {
          padding: 0.8rem 1.2rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .btn-outline {
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-outline:hover {
          background: #667eea;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .empty-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1rem;
        }

        .empty-description {
          color: #666;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .empty-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 4rem 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-weight: 500;
        }

        .cta-section {
          margin-top: 4rem;
        }

        .cta-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 3rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          color: white;
        }

        .cta-content {
          flex: 1;
        }

        .cta-content h3 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .cta-content p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .cta-form {
          display: flex;
          gap: 1rem;
          max-width: 400px;
        }

        .cta-input {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
        }

        .cta-image {
          flex: 0 0 150px;
        }

        .cta-graphic {
          font-size: 6rem;
          text-align: center;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .events-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }

          .cta-card {
            flex-direction: column;
            text-align: center;
          }

          .cta-form {
            flex-direction: column;
          }

          .empty-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            min-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }

          .card-content {
            padding: 1rem;
          }

          .cta-card {
            padding: 2rem 1.5rem;
          }

          .stats-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
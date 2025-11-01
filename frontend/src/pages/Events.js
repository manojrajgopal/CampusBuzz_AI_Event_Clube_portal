// frontend/src/pages/Events.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    API.get("/events").then((res) => {
      setEvents(res.data);
      setLoading(false);
    });
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

  const safeEvents = Array.isArray(events) ? events : [];

  // Filter events by category
  const filteredEvents = activeFilter === "all" 
    ? safeEvents 
    : safeEvents.filter(event => event.category === activeFilter);

  return (
    <div className="events-page">
      {/* Background with high-quality image */}
      <div className="page-background">
        <div className="background-image"></div>
        <div className="background-overlay"></div>
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      {/* Header Section */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-badge">Campus Events</div>
          <h1 className="page-title">
            Discover Amazing Events
          </h1>
          <p className="page-subtitle">
            Join thousands of students in unforgettable campus experiences, workshops, and social gatherings
          </p>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{safeEvents.length}+</span>
              <span className="stat-label">Upcoming Events</span>
            </div>
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Students</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Event Categories</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Filter Section */}
        <section className="filter-section">
          <div className="filter-container">
            <h3 className="filter-title">Filter by Category</h3>
            <div className="filter-buttons">
              {["all", "workshop", "social", "academic", "sports", "cultural"].map((filter) => (
                <button
                  key={filter}
                  className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="events-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading amazing events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onRegister={registerEvent}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3 className="empty-title">No Events Found</h3>
              <p className="empty-description">
                {activeFilter === "all" 
                  ? "We're working on bringing you amazing events soon. Check back later!"
                  : `No ${activeFilter} events available at the moment. Try another category!`
                }
              </p>
              <div className="empty-actions">
                <button className="btn btn-primary" onClick={() => setActiveFilter("all")}>
                  View All Events
                </button>
                <Link to="/" className="btn btn-outline">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Events Highlights */}
        <EventsHighlights />
      </main>

      <style jsx>{`
        .events-page {
          min-height: 100vh;
          background: #000;
          position: relative;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
        }

        /* Background Styles */
        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.6) 50%,
            rgba(0, 0, 0, 0.8) 100%
          );
        }

        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .particle:nth-child(1) {
          width: 80px;
          height: 80px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle:nth-child(2) {
          width: 120px;
          height: 120px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .particle:nth-child(3) {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: 4s;
        }

        .particle:nth-child(4) {
          width: 100px;
          height: 100px;
          top: 40%;
          right: 20%;
          animation-delay: 1s;
        }

        .particle:nth-child(5) {
          width: 70px;
          height: 70px;
          bottom: 20%;
          right: 30%;
          animation-delay: 3s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Header Section */
        .page-header {
          position: relative;
          z-index: 1;
          padding: 120px 2rem 80px;
          text-align: center;
          background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
        }

        .header-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .header-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .page-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          font-size: 1.3rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 3rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }

        .header-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-top: 2rem;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #007AFF;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Main Content */
        .main-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        /* Filter Section */
        .filter-section {
          margin-bottom: 3rem;
        }

        .filter-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filter-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: white;
          text-align: center;
        }

        .filter-buttons {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-btn {
          padding: 0.8rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 25px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .filter-btn.active {
          background: #007AFF;
          color: white;
          border-color: #007AFF;
        }

        /* Loading State */
        .loading-container {
          text-align: center;
          padding: 4rem;
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #007AFF;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Events Grid */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.7;
        }

        .empty-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
        }

        .empty-description {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          font-size: 1.1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .empty-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: #007AFF;
          color: white;
        }

        .btn-primary:hover {
          background: #0056CC;
          transform: translateY(-2px);
        }

        .btn-outline {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .page-header {
            padding: 100px 1.5rem 60px;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .header-stats {
            gap: 2rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .main-content {
            padding: 0 1.5rem 3rem;
          }

          .events-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .filter-buttons {
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 1rem;
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
          .page-title {
            font-size: 2rem;
          }

          .page-subtitle {
            font-size: 1.1rem;
          }

          .header-stats {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

// Event Card Component
function EventCard({ event, onRegister, index }) {
  const handleRegister = () => {
    onRegister(event.id);
  };

  const eventCategories = {
    workshop: { color: '#007AFF', icon: '💼' },
    social: { color: '#FF2D55', icon: '🎉' },
    academic: { color: '#34C759', icon: '📚' },
    sports: { color: '#FF9500', icon: '⚽' },
    cultural: { color: '#AF52DE', icon: '🎭' }
  };

  const category = event.category || 'workshop';
  const categoryInfo = eventCategories[category] || eventCategories.workshop;

  return (
    <div 
      className="event-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-header">
        <div className="card-image">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"} 
            alt={event.title}
          />
          <div className="image-overlay"></div>
          <div className="event-category" style={{ backgroundColor: categoryInfo.color }}>
            <span className="category-icon">{categoryInfo.icon}</span>
            <span className="category-text">{category}</span>
          </div>
        </div>
        <div className="card-date">
          <span className="date-day">
            {new Date(event.date).getDate()}
          </span>
          <span className="date-month">
            {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
          </span>
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>
        
        <div className="event-meta">
          <div className="meta-item">
            <span className="meta-icon">⏰</span>
            <span className="meta-text">
              {new Date(event.date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span className="meta-text">{event.venue}</span>
          </div>

          {event.capacity && (
            <div className="meta-item">
              <span className="meta-icon">👥</span>
              <span className="meta-text">{event.capacity} spots</span>
            </div>
          )}
        </div>

        <div className="card-actions">
          <button 
            className="register-btn"
            onClick={handleRegister}
          >
            <span className="btn-icon">🎯</span>
            Register Now
          </button>
        </div>
      </div>

      <style jsx>{`
        .event-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: cardEntrance 0.6s ease-out;
          animation-fill-mode: both;
          position: relative;
        }

        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .event-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .event-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #007AFF, #34C759);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .event-card:hover::before {
          transform: scaleX(1);
        }

        .card-header {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
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

        .event-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: #007AFF;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .card-date {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem;
          border-radius: 15px;
          text-align: center;
          min-width: 70px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
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
          text-transform: uppercase;
        }

        .card-content {
          padding: 2rem;
        }

        .event-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .event-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .meta-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
          opacity: 0.7;
        }

        .meta-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .card-actions {
          display: flex;
          gap: 1rem;
        }

        .register-btn {
          flex: 2;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .register-btn:hover {
          background: #0056CC;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 122, 255, 0.4);
        }

        .details-btn {
          flex: 1;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .details-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      `}</style>
    </div>
  );
}

// Events Highlights Component
function EventsHighlights() {
  const highlights = [
    {
      icon: "🎉",
      number: "500+",
      label: "Events Hosted"
    },
    {
      icon: "👥",
      number: "10K+",
      label: "Happy Attendees"
    },
    {
      icon: "⭐",
      number: "4.9",
      label: "Average Rating"
    },
    {
      icon: "🌍",
      number: "50+",
      label: "Cities Covered"
    }
  ];

  return (
    <section className="highlights-section">
      <div className="highlights-content">
        <h2 className="highlights-title">Why Choose Our Events?</h2>
        <p className="highlights-subtitle">
          We're committed to delivering exceptional experiences that bring people together and create lasting memories.
        </p>
        
        <div className="highlights-grid">
          {highlights.map((highlight, index) => (
            <div 
              key={index}
              className="highlight-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="highlight-icon">{highlight.icon}</div>
              <div className="highlight-number">{highlight.number}</div>
              <div className="highlight-label">{highlight.label}</div>
            </div>
          ))}
        </div>

        <div className="highlights-cta">
          <h3>Never Miss an Event</h3>
          <p>Subscribe to our newsletter and get notified about upcoming events</p>
          <div className="cta-form">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="cta-input" 
            />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .highlights-section {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 4rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 4rem;
        }

        .highlights-content {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .highlights-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #007AFF 0%, #34C759 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .highlights-subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .highlight-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 2.5rem 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .highlight-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .highlight-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .highlight-number {
          font-size: 2.2rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .highlight-label {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          font-size: 1rem;
        }

        .highlights-cta {
          background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
          border-radius: 20px;
          padding: 3rem;
          color: white;
          margin-top: 2rem;
        }

        .highlights-cta h3 {
          font-size: 1.8rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .highlights-cta p {
          opacity: 0.9;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .cta-form {
          display: flex;
          gap: 1rem;
          max-width: 400px;
          margin: 0 auto;
        }

        .cta-input {
          flex: 1;
          padding: 1rem 1.2rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          background: rgba(255, 255, 255, 0.9);
        }

        @media (max-width: 768px) {
          .highlights-section {
            padding: 3rem 1.5rem;
            margin-top: 3rem;
          }

          .highlights-title {
            font-size: 2rem;
          }

          .highlights-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .cta-form {
            flex-direction: column;
          }

          .highlight-card {
            padding: 2rem 1rem;
          }

          .highlights-cta {
            padding: 2.5rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .highlights-grid {
            grid-template-columns: 1fr;
          }

          .highlights-cta h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
}
// frontend/src/pages/Events.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="events-page">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="gradient-overlay"></div>
      </div>

      {/* Header Section */}
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-text">Upcoming Events</span>
            <div className="title-underline"></div>
          </h1>
          <p className="page-subtitle">
            Discover and register for amazing events happening around you
          </p>
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
            {safeEvents.map((event, index) => (
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

        {/* Events Highlights Section */}
        <EventsHighlights />
      </main>

      <style jsx>{`
        .events-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Animated Background */
        .animated-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 8s ease-in-out infinite;
        }

        .shape-1 {
          width: 120px;
          height: 120px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 80px;
          height: 80px;
          top: 60%;
          right: 8%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 10%;
          animation-delay: 4s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          top: 30%;
          right: 15%;
          animation-delay: 6s;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.15) 0%, transparent 50%);
          animation: gradientShift 12s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-20px) translateX(10px) rotate(120deg); 
          }
          66% { 
            transform: translateY(10px) translateX(-15px) rotate(240deg); 
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Header Section */
        .page-header {
          position: relative;
          z-index: 1;
          padding: 5rem 2rem 3rem;
          text-align: center;
          color: white;
        }

        .header-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          position: relative;
        }

        .title-text {
          background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-underline {
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #ff6b6b, #ffd93d);
          margin: 1rem auto;
          border-radius: 2px;
        }

        .page-subtitle {
          font-size: 1.3rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Main Content */
        .main-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
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

        .loading-text {
          font-size: 1.1rem;
          color: white;
        }

        /* Events Grid */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        /* Empty State */
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
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
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

        @media (max-width: 768px) {
          .page-header {
            padding: 4rem 1.5rem 2rem;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .main-content {
            padding: 0 1.5rem 3rem;
          }

          .events-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
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

  return (
    <div 
      className="event-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-header">
        <div className="card-image">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"} 
            alt={event.title}
          />
          <div className="image-overlay"></div>
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
          transform: translateY(-8px);
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
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 100%);
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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .date-day {
          display: block;
          font-size: 1.4rem;
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
          -webkit-line-clamp: 3;
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

        .card-actions {
          display: flex;
          gap: 0.8rem;
        }

        .register-btn {
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.8rem 1.2rem;
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
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .highlights-content {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .highlights-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .highlights-subtitle {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .highlight-card {
          background: rgba(255, 255, 255, 0.8);
          padding: 2rem 1rem;
          border-radius: 16px;
          border: 1px solid rgba(102, 126, 234, 0.1);
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
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.15);
        }

        .highlight-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .highlight-number {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .highlight-label {
          color: #666;
          font-weight: 500;
        }

        .highlights-cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 2.5rem;
          color: white;
          margin-top: 2rem;
        }

        .highlights-cta h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .highlights-cta p {
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .cta-form {
          display: flex;
          gap: 1rem;
          max-width: 400px;
          margin: 0 auto;
        }

        .cta-input {
          flex: 1;
          padding: 0.8rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
        }

        @media (max-width: 768px) {
          .highlights-section {
            padding: 2rem 1.5rem;
          }

          .highlights-title {
            font-size: 1.8rem;
          }

          .highlights-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .cta-form {
            flex-direction: column;
          }

          .highlight-card {
            padding: 1.5rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .highlights-grid {
            grid-template-columns: 1fr;
          }

          .highlights-cta {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </section>
  );
}
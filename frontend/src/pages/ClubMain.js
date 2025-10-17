// Combined ClubMain.js with EventCreate.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "./ClubMain.css";

// Import the background image
import backgroundImage from "../assets/images/2.png";

// EventCreate Component (merged from EventCreate.js)
function EventCreate({ onSuccess, onCancel }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [poster, setPoster] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

  const clubId = localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const token = localStorage.getItem("token");
  const clubName = localStorage.getItem("club_name");

  // Convert uploaded file to Base64 with preview
  function handlePosterUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Base64 conversion for backend
    const base64Reader = new FileReader();
    base64Reader.onloadend = () => {
      setPoster(base64Reader.result);
    };
    base64Reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      await API.post(
        "/events/",
        {
          title,
          date,
          venue,
          description,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          poster,
          isPaid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success animation and redirect
      document.querySelector('.event-create-container').classList.add('success-animation');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          alert("✅ Event created successfully!");
          navigate("/club/main");
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error creating event", err);
      document.querySelector('.event-create-container').classList.add('error-shake');
      setTimeout(() => {
        document.querySelector('.event-create-container').classList.remove('error-shake');
      }, 500);
      alert("❌ Failed to create event");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    document.querySelector('.event-create-container').classList.add('exit-animation');
    setTimeout(() => {
      if (onCancel) {
        onCancel();
      } else {
        navigate("/club/main");
      }
    }, 300);
  }

  return (
    <div className="event-create-wrapper">
      <div className="background-overlay-create"></div>
      
      <div className="event-create-container">
        <div className="create-header">
          <div className="header-icon">🎉</div>
          <h2>Create New Event</h2>
          <p className="club-name">For <span className="club-highlight">{clubName}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="event-create-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-input"
                placeholder="Enter event title..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                className="form-input"
                placeholder="Enter venue..."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows="4"
                placeholder="Describe your event..."
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="form-input"
                placeholder="music, workshop, social (separate with commas)"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Event Poster</label>
              <div className="file-upload-section">
                <label className="file-upload-label">
                  <div className="upload-content">
                    <span className="upload-icon">📷</span>
                    <div className="upload-text">
                      <span className="upload-title">
                        {previewImage ? "Poster Uploaded Successfully" : "Upload Event Poster"}
                      </span>
                      <span className="upload-subtitle">
                        {previewImage ? "Click to change" : "PNG, JPG up to 5MB"}
                      </span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePosterUpload} 
                    className="file-input"
                  />
                </label>
                
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Poster preview" />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => {
                        setPreviewImage(null);
                        setPoster(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Event Type</label>
              <div className="payment-toggle">
                <button
                  type="button"
                  className={`toggle-option ${isPaid ? 'active' : ''}`}
                  onClick={() => setIsPaid(true)}
                >
                  <span className="toggle-icon">💰</span>
                  <span className="toggle-text">Paid Event</span>
                </button>
                <button
                  type="button"
                  className={`toggle-option ${!isPaid ? 'active' : ''}`}
                  onClick={() => setIsPaid(false)}
                >
                  <span className="toggle-icon">🎫</span>
                  <span className="toggle-text">Free Event</span>
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  Creating Event...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Create Event
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <span className="btn-icon">←</span>
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ClubMain Component (original code)
export default function ClubMain() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const clubId =
    localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const fetchedRef = useRef(false);

  // Handle approve request function
  async function handleApproveRequest(id) {
    try {
      await API.post(`/clubs/${clubId}/join-requests/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Request approved!");
      fetchClubData(); // refresh members and requests
    } catch (err) {
      console.error(err);
      alert("Failed to approve request");
    }
  }

  // Handle reject request function
  async function handleRejectRequest(id) {
    try {
      await API.post(`/clubs/${clubId}/join-requests/${id}/reject`, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("❌ Request rejected!");
      fetchClubData(); // refresh requests
    } catch (err) {
      console.error(err);
      alert("Failed to reject request");
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (role !== "club" || !token || !clubId) {
      navigate("/club/login");
      return;
    }

    fetchClubData();
    fetchEvents();
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  async function fetchClubData() {
    try {
      if (!clubId || clubId === "undefined") return;
      const res = await API.get(`/clubs/${clubId}`);
      setClub(res.data);
    } catch (err) {
      console.error("Error fetching club data", err);
    }
  }

  async function fetchEvents() {
    try {
      const res = await API.get(`/events/?clubId=${clubId}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  }

  async function fetchParticipants(eventId) {
    if (!eventId) return;
    try {
      const res = await API.get(`/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParticipants((prev) => ({ ...prev, [eventId]: res.data }));
      setActiveEvent(eventId);
    } catch (err) {
      console.error("Error fetching participants", err);
    }
  }

  async function markAttendance(eventId, participantId) {
    try {
      await API.post(
        `/events/${eventId}/participants/${participantId}/checkin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh participants after check-in
      fetchParticipants(eventId);
    } catch (err) {
      console.error("Error marking attendance", err);
      alert("Failed to mark attendance");
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!eventId) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await API.delete(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Event deleted!");
      fetchEvents();
    } catch (err) {
      console.error("❌ Error deleting event", err);
      alert("Failed to delete event");
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2>Loading Club Dashboard...</h2>
      </div>
    );
  }

  if (!club) return <div>Loading club info..</div>;

  return (
    <div className="club-dashboard">
      {/* Background Image with Overlay */}
      <div className="background-container">
        <img src={backgroundImage} alt="Background" className="background-image" />
        <div className="background-overlay"></div>
      </div>
      
      {/* Header */}
      <div className="club-header">
        <div className="club-info">
          <h1>{club.name}</h1>
          <p className="club-description">{club.description}</p>
          <div className={`club-status ${club.approved ? 'approved' : 'pending'}`}>
            {club.approved ? "✅ Approved" : "⏳ Pending Approval"}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        {/* Sidebar */}
        <div className="club-sidebar">
          <div className="sidebar-section glass-card">
            <div className="section-header-icon">
              <span className="icon">👑</span>
              <h3>Club Leadership</h3>
            </div>
            <div className="leader-card">
              <div className="leader-header">
                <span className="leader-icon">⭐</span>
                <h4>Leader</h4>
              </div>
              <div className="leader-info">
                <p className="leader-name">{club.leader ? club.leader.name : "Not assigned"}</p>
                <p className="leader-contact">{club.leader ? club.leader.email : ""}</p>
                <p className="leader-contact">{club.leader && club.leader.mobile ? club.leader.mobile : ""}</p>
              </div>
            </div>
            <div className="leader-card">
              <div className="leader-header">
                <span className="leader-icon">🌟</span>
                <h4>Sub-Leader</h4>
              </div>
              <div className="leader-info">
                <p className="leader-name">{club.subleader ? club.subleader.name : "Not assigned"}</p>
                <p className="leader-contact">{club.subleader ? club.subleader.email : ""}</p>
                <p className="leader-contact">{club.subleader && club.subleader.mobile ? club.subleader.mobile : ""}</p>
              </div>
            </div>
          </div>

          <div className="sidebar-section glass-card">
            <div className="section-header-icon">
              <span className="icon">👥</span>
              <h3>Members ({club.members ? club.members.length : 0})</h3>
            </div>
            <div className="members-list">
              {club.members && club.members.length > 0 ? (
                club.members.map((m) => (
                  <div key={m.id || m.email} className="member-item">
                    <div className="member-avatar">
                      {m.name ? m.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="member-details">
                      <span className="member-name">{m.name || "Unknown"}</span>
                      <p className="member-email">{m.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-message">
                  <span className="empty-icon">😔</span>
                  <p>No members yet</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="sidebar-section glass-card">
            <div className="section-header-icon">
              <span className="icon">📨</span>
              <h3>Join Requests ({club.requests ? club.requests.length : 0})</h3>
            </div>
            <div className="requested-list">
              {club.requests && club.requests.length > 0 ? (
                club.requests.map((r) => (
                  <div key={r.id || r.email} className="request-item">
                    <div className="member-avatar">
                      {r.name ? r.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="request-details">
                      <span className="request-name">{r.name || "Unknown"}</span>
                      <p className="request-email">{r.email}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleApproveRequest(r.id)}
                        title="Approve Request"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectRequest(r.id)}
                        title="Reject Request"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-message">
                  <span className="empty-icon">📭</span>
                  <p>No requests yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section glass-card">
            <div className="section-header-icon">
              <span className="icon">👨‍🏫</span>
              <h3>Teachers ({club.teachers ? club.teachers.length : 0})</h3>
            </div>
            {club.teachers && club.teachers.length > 0 ? (
              <div className="teachers-list">
                {club.teachers.map((t) => (
                  <div key={t.email} className="teacher-item">
                    <div className="teacher-avatar">👨‍🏫</div>
                    <div className="teacher-details">
                      <h4 className="teacher-name">{t.name}</h4>
                      <p className="teacher-email">{t.email}</p>
                      <p className="teacher-mobile">{t.mobile}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-message">
                <span className="empty-icon">📚</span>
                <p>No teacher assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="club-main">
          <div className="events-section">
            <div className="section-header-main">
              <div className="section-title">
              
              
              </div>
              {!showCreateForm ? (
                <button className="btn-create-event" onClick={() => setShowCreateForm(true)}>
                  <span className="btn-icon">+</span>
                  Create New Event
                </button>
              ) : (
                <EventCreate
                  clubId={clubId}
                  token={token}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    fetchEvents();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}
            </div>

            {events.length > 0 ? (
              <div className="events-grid">
                {events.map((e) => (
                  <div key={e._id} className="event-card glass-card">
                    <div className="event-header">
                      <div className="event-title-section">
                        <h3 className="event-title">{e.title}</h3>
                        <span className="event-date-badge">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        className="btn-delete-event" 
                        onClick={() => handleDeleteEvent(e._id)}
                        title="Delete event"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="event-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{new Date(e.date).toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <span className="detail-label">Venue:</span>
                        <span className="detail-value">{e.venue}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📝</span>
                        <span className="detail-label">Description:</span>
                        <span className="detail-value">{e.description}</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <button 
                        className="btn-view-participants" 
                        onClick={() => fetchParticipants(e._id)}
                      >
                        <span className="btn-icon">👥</span>
                        View Participants ({e.participantCount || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-events glass-card">
                <div className="empty-events-icon">🎉</div>
                <h3>No Events Created Yet</h3>
                <p>Start by creating your first event to engage with members!</p>
                <button 
                  className="btn-create-first-event" 
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Your First Event
                </button>
              </div>
            )}
          </div>

          {/* Participants Modal */}
          {activeEvent && participants[activeEvent] && participants[activeEvent].length > 0 && (
            <div className="participants-modal">
              <div className="modal-overlay" onClick={() => setActiveEvent(null)}></div>
              <div className="modal-content glass-card">
                <div className="modal-header">
                  <h3>
                    <span className="modal-icon">📋</span>
                    Participants for {events.find(e => e._id === activeEvent)?.title}
                  </h3>
                  <button className="btn-close" onClick={() => setActiveEvent(null)}>×</button>
                </div>
                <div className="participants-list">
                  {participants[activeEvent].map((p) => (
                    <div key={p._id} className="participant-item">
                      <div className="participant-info">
                        <div className="participant-avatar">
                          {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="participant-details">
                          <h4 className="participant-name">{p.name}</h4>
                          <p className="participant-email">{p.email}</p>
                        </div>
                      </div>
                      <div className="participant-status">
                        <span className={`status-badge ${p.checked_in ? 'checked-in' : 'not-checked-in'}`}>
                          {p.checked_in ? "✅ Checked In" : "⏳ Not Checked In"}
                        </span>
                        {!p.checked_in && (
                          <button 
                            className="btn-check-in"
                            onClick={() => markAttendance(activeEvent, p._id)}
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
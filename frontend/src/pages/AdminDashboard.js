// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import API from "../api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [editTeacher, setEditTeacher] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("clubs");
  const [isLoading, setIsLoading] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    mobile: "",
    club_id: "",
  });

  // ------------------- LOAD DATA -------------------
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setIsLoading(true);
      await Promise.all([loadEvents(), loadTeachers(), loadClubs(), loadApplications()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadEvents() {
    const res = await API.get("/admin/events");
    setEvents(res.data);
  }

  async function loadTeachers() {
    const res = await API.get("/admin/teachers");
    setTeachers(res.data);
  }

  async function loadClubs() {
    const res = await API.get("/admin/clubs", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setClubs(res.data);
  }

  // ------------------- CLUB APPLICATIONS -------------------
  async function loadApplications() {
    try {
      const res = await API.get("/clubs/applications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApplications(res.data);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }

  async function handleApproveApplication(appId) {
    try {
      await API.post(`/clubs/applications/${appId}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApplications(applications.filter((app) => app._id !== appId));
    } catch (error) {
      console.error("Error approving application:", error);
    }
  }

  async function handleRejectApplication(appId) {
    if (!window.confirm("Reject this application?")) return;
    try {
      await API.delete(`/clubs/applications/${appId}/reject`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApplications(applications.filter((app) => app._id !== appId));
    } catch (error) {
      console.error("Error rejecting application:", error);
    }
  }

  // ------------------- EVENTS -------------------
  async function loadParticipants(eventId) {
    try {
      const res = await API.get(`/events/${eventId}/participants`);
      setParticipants(res.data);
      setSelectedEvent(eventId);
      setShowParticipantsModal(true);

      // Update participantCount in events
      setEvents(events.map(ev => 
        ev._id === eventId ? { ...ev, participantCount: res.data.length } : ev
      ));
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  }

  async function markAttendance(userId) {
    try {
      await API.post(`/events/${selectedEvent}/checkin/${userId}`);
      loadParticipants(selectedEvent);
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  }

  // ------------------- TEACHERS -------------------
  async function handleDeleteTeacher(id) {
    if (!window.confirm("Delete this teacher?")) return;
    try {
      await API.delete(`/admin/teachers/${id}`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  }

  async function handleUpdateTeacher() {
    if (!editTeacher) return;
    try {
      await API.put(`/admin/teachers/${editTeacher._id}`, editTeacher);
      // Reload teachers to get the updated club assignment
      await loadTeachers();
      setEditTeacher(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  }

  async function addTeacher() {
    try {
      const res = await API.post("/admin/teachers", newTeacher, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("✅ Teacher added successfully");
      setNewTeacher({ name: "", email: "", mobile: "", club_id: "" });
      setShowTeacherModal(false);
      loadTeachers();
    } catch (err) {
      alert("❌ Failed to add teacher");
      console.error(err);
    }
  }

  // ------------------- CLUBS -------------------
  async function handleApproveClub(id) {
    try {
      await API.put(`/admin/clubs/${id}/approve`);
      setClubs(clubs.map((c) => (c.id === id ? { ...c, approved: true } : c)));
    } catch (error) {
      console.error("Error approving club:", error);
    }
  }

  async function handleRejectClub(id) {
    if (!window.confirm("Reject/Delete this club?")) return;
    try {
      await API.delete(`/admin/clubs/${id}`);
      setClubs(clubs.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error rejecting club:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner"></div>
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-welcome">
          <p>Welcome, Administrator</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={activeTab === "clubs" ? "admin-tab active" : "admin-tab"} 
          onClick={() => setActiveTab("clubs")}
        >
          Clubs
        </button>
        <button 
          className={activeTab === "events" ? "admin-tab active" : "admin-tab"} 
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
        <button 
          className={activeTab === "teachers" ? "admin-tab active" : "admin-tab"} 
          onClick={() => setActiveTab("teachers")}
        >
          Teachers
        </button>
        <button 
          className={activeTab === "applications" ? "admin-tab active" : "admin-tab"} 
          onClick={() => setActiveTab("applications")}
        >
          Applications
        </button>
      </div>

      {/* Clubs Section */}
      {activeTab === "clubs" && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Club Management</h2>
            <p>Approve or reject club applications</p>
          </div>
          
          {clubs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No clubs found</h3>
              <p>There are no clubs to manage at this time</p>
            </div>
          ) : (
            <div className="clubs-grid">
              {clubs.map((club) => (
                <div key={club.id} className="club-card">
                  <div className="club-card-header">
                    <h3>{club.name}</h3>
                    <span className={`status-badge ${club.approved ? 'approved' : 'pending'}`}>
                      {club.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="club-details">
                    <p><span className="detail-label">Leader:</span> {club.leader?.name || "N/A"}</p>
                    <p><span className="detail-label">Email:</span> {club.leader?.email || "N/A"}</p>
                    <p><span className="detail-label">Description:</span> {club.description || "No description"}</p>
                  </div>
                  <div className="club-actions">
                    {!club.approved && (
                      <button 
                        className="btn-primary sm"
                        onClick={() => handleApproveClub(club.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="btn-outline sm danger"
                      onClick={() => handleRejectClub(club.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Section */}
      {activeTab === "events" && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Event Management</h2>
            <p>View events and manage participants</p>
          </div>
          
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>No events found</h3>
              <p>There are no events to manage at this time</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((ev) => (
                <div key={ev._id} className="event-card">
                  <div className="event-card-header">
                    <h3>{ev.title}</h3>
                    <span className="participant-count">
                      {ev.participantCount || 0} participants
                    </span>
                  </div>
                  <div className="event-details">
                    <p><span className="detail-label">Date:</span> {new Date(ev.date).toLocaleString()}</p>
                    <p><span className="detail-label">Venue:</span> {ev.venue}</p>
                    <p><span className="detail-label">Description:</span> {ev.description}</p>
                  </div>
                  <div className="event-actions">
                    <button 
                      className="btn-primary sm"
                      onClick={() => loadParticipants(ev._id)}
                    >
                      View Participants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teachers Section */}
      {activeTab === "teachers" && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Teacher Management</h2>
            <p>Add and manage teacher accounts</p>
            <button 
              className="btn-primary"
              onClick={() => setShowTeacherModal(true)}
            >
              + Add Teacher
            </button>
          </div>
          
          {teachers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👨‍🏫</div>
              <h3>No teachers found</h3>
              <p>Add teachers to get started</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map((t) => (
                <div key={t._id} className="teacher-card">
                  {editTeacher && editTeacher._id === t._id ? (
                    <div className="teacher-edit-form">
                      <input
                        value={editTeacher.name}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, name: e.target.value })
                        }
                        placeholder="Name"
                      />
                      <input
                        value={editTeacher.email}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, email: e.target.value })
                        }
                        placeholder="Email"
                      />
                      <input
                        value={editTeacher.mobile}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, mobile: e.target.value })
                        }
                        placeholder="Mobile"
                      />
                      <select
                        value={editTeacher.club_id || ""}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, club_id: e.target.value })
                        }
                      >
                        <option value="">-- Select Club --</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="edit-actions">
                        <button className="btn-primary sm" onClick={handleUpdateTeacher}>Save</button>
                        <button className="btn-outline sm" onClick={() => setEditTeacher(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="teacher-info">
                        <h3>{t.name}</h3>
                        <p><span className="detail-label">Email:</span> {t.email}</p>
                        <p><span className="detail-label">Mobile:</span> {t.mobile}</p>
                        <p><span className="detail-label">Club:</span> {t.club_name || "Unassigned"}</p>
                      </div>
                      <div className="teacher-actions">
                        <button 
                          className="btn-outline sm"
                          onClick={() => setEditTeacher(t)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-outline sm danger"
                          onClick={() => handleDeleteTeacher(t._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Section */}
      {activeTab === "applications" && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Club Applications</h2>
            <p>Approve or reject club registration requests</p>
          </div>
          
          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No pending applications</h3>
              <p>There are no club applications to review</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app._id} className="application-card">
                  <div className="application-info">
                    <h3>{app.club_name}</h3>
                    <p><span className="detail-label">Email:</span> {app.club_email}</p>
                    <p><span className="detail-label">Applied on:</span> {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="application-actions">
                    <button 
                      className="btn-primary sm"
                      onClick={() => handleApproveApplication(app._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn-outline sm danger"
                      onClick={() => handleRejectApplication(app._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="admin-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                Participants for {events.find(e => e._id === selectedEvent)?.title}
              </h3>
              <button className="btn-close" onClick={() => setShowParticipantsModal(false)}>×</button>
            </div>
            <div className="participants-list">
              {participants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No participants</h3>
                  <p>No one has registered for this event yet</p>
                </div>
              ) : (
                participants.map((p) => (
                  <div key={p._id} className="participant-item">
                    <div className="participant-info">
                      <h4>{p.name}</h4>
                      <p>{p.email}</p>
                    </div>
                    <div className="participant-status">
                      <span className={`status ${p.checked_in ? 'checked-in' : 'not-checked-in'}`}>
                        {p.checked_in ? "Checked In" : "Not Checked In"}
                      </span>
                      {!p.checked_in && (
                        <button 
                          className="btn-primary sm"
                          onClick={() => markAttendance(p.user_id)}
                        >
                          Check-in
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showTeacherModal && (
        <div className="admin-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Teacher</h3>
              <button className="btn-close" onClick={() => setShowTeacherModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <input
                type="text"
                placeholder="Name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, email: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Mobile"
                value={newTeacher.mobile}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, mobile: e.target.value })
                }
              />
              <select
                value={newTeacher.club_id}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, club_id: e.target.value })
                }
              >
                <option value="">-- Select Club --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button className="btn-primary" onClick={addTeacher}>Add Teacher</button>
                <button className="btn-outline" onClick={() => setShowTeacherModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ClubMain.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import EventCreate from "./EventCreate";
import "./ClubMain.css";

export default function ClubMain() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const threeContainerRef = useRef(null);

  const navigate = useNavigate();

  const clubId =
    localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const fetchedRef = useRef(false);

  // ------------------- THREE.JS BACKGROUND -------------------
  useEffect(() => {
    // Initialize Three.js scene
    const initThreeScene = () => {
      if (typeof window !== "undefined" && threeContainerRef.current) {
        const THREE = window.THREE;
        
        if (!THREE) {
          console.error("Three.js not loaded");
          return;
        }

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        threeContainerRef.current.appendChild(renderer.domElement);
        
        // Create floating geometric shapes
        const shapes = [];
        const geometryTypes = [
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.SphereGeometry(0.7, 32, 32),
          new THREE.ConeGeometry(0.7, 1.5, 8),
          new THREE.TorusGeometry(0.7, 0.3, 16, 100)
        ];
        
        const materials = [
          new THREE.MeshPhongMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.7 }),
          new THREE.MeshPhongMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.7 }),
          new THREE.MeshPhongMaterial({ color: 0x45b7d1, transparent: true, opacity: 0.7 }),
          new THREE.MeshPhongMaterial({ color: 0x96ceb4, transparent: true, opacity: 0.7 })
        ];
        
        // Add multiple shapes
        for (let i = 0; i < 15; i++) {
          const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
          const material = materials[Math.floor(Math.random() * materials.length)];
          const shape = new THREE.Mesh(geometry, material);
          
          shape.position.x = (Math.random() - 0.5) * 20;
          shape.position.y = (Math.random() - 0.5) * 20;
          shape.position.z = (Math.random() - 0.5) * 10;
          
          shape.rotation.x = Math.random() * Math.PI;
          shape.rotation.y = Math.random() * Math.PI;
          
          scene.add(shape);
          shapes.push(shape);
        }
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        camera.position.z = 5;
        
        // Mouse movement
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
          mouseX = (event.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Animation
        const clock = new THREE.Clock();
        
        const animate = () => {
          requestAnimationFrame(animate);
          
          const elapsedTime = clock.getElapsedTime();
          
          // Update shapes
          shapes.forEach((shape, i) => {
            shape.rotation.x += 0.01;
            shape.rotation.y += 0.01;
            
            // Float up and down
            shape.position.y += Math.sin(elapsedTime + i) * 0.003;
            
            // Move slightly with mouse
            shape.position.x += mouseX * 0.01;
            shape.position.y += mouseY * 0.01;
          });
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          if (threeContainerRef.current && renderer.domElement) {
            threeContainerRef.current.removeChild(renderer.domElement);
          }
        };
      }
    };

    // Load Three.js dynamically
    if (!window.THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = initThreeScene;
      document.head.appendChild(script);
    } else {
      initThreeScene();
    }
  }, []);

  async function handleApproveRequest(id) {
    try {
      await API.post(`/clubs/${clubId}/join-requests/${id}/approve`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Request approved!");
      fetchClubData(); // refresh members and requests
    } catch (err) {
      console.error(err);
      alert("Failed to approve request");
    }
  }

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
      {/* Three.js Background */}
      <div ref={threeContainerRef} className="three-background"></div>
      
      {/* Header */}
      <div className="club-header">
        <div className="club-info">
          <h1>{club.name}</h1>
          <p className="club-description">{club.description}</p>
          <div className={`club-status ${club.approved ? 'approved' : 'pending'}`}>
            {club.approved ? "Approved" : "Pending Approval ❌"}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        {/* Sidebar */}
        <div className="club-sidebar">
          <div className="sidebar-section">
            <h3>Club Leadership</h3>
            <div className="leader-card">
              <h4>Leader</h4>
              <p>{club.leader ? club.leader.name : "Not assigned"}</p>
              <p>{club.leader ? club.leader.email : ""}</p>
              <p>{club.leader && club.leader.mobile ? club.leader.mobile : ""}</p>
            </div>
            <div className="leader-card">
              <h4>Sub-Leader</h4>
              <p>{club.subleader ? club.subleader.name : "Not assigned"}</p>
              <p>{club.subleader ? club.subleader.email : ""}</p>
              <p>{club.subleader && club.subleader.mobile ? club.subleader.mobile : ""}</p>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Members</h3>
            <div className="members-list">
              {club.members && club.members.length > 0 ? (
                club.members.map((m) => (
                  <div key={m.id || m.email} className="member-item">
                    <div className="member-avatar">
                      {m.name ? m.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="member-details">
                      <span>{m.name || "Unknown"}</span>
                      <p className="member-email">{m.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No members yet</p>
              )}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Requested to Join</h3>
            <div className="requested-list">
              {club.requests && club.requests.length > 0 ? (
                club.requests.map((r) => (
                  <div key={r.id || r.email} className="request-item">
                    <div className="member-avatar">
                      {r.name ? r.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="request-details">
                      <span>{r.name || "Unknown"}</span>
                      <p className="request-email">{r.email}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn-primary sm"
                        onClick={() => handleApproveRequest(r.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-outline sm"
                        onClick={() => handleRejectRequest(r.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No requests yet</p>
              )}

            </div>
          </div>

          <div className="sidebar-section">
            <h3>Teachers</h3>
            {club.teachers && club.teachers.length > 0 ? (
              <div className="teachers-list">
                {club.teachers.map((t) => (
                  <div key={t.email} className="teacher-item">
                    <h4>{t.name}</h4>
                    <p>{t.email}</p>
                    <p>{t.mobile}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No teacher assigned yet</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="club-main">
          <div className="events-section">
            <div className="section-header">
              <h2>Events</h2>
              {!showCreateForm ? (
                <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                  + Create Event
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
                  <div key={e._id} className="event-card">
                    <div className="event-header">
                      <h3>{e.title}</h3>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteEvent(e._id)}
                        title="Delete event"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="event-details">
                      <p><span className="detail-label">Date:</span> {new Date(e.date).toLocaleString()}</p>
                      <p><span className="detail-label">Venue:</span> {e.venue}</p>
                      <p><span className="detail-label">Description:</span> {e.description}</p>
                    </div>
                    <div className="event-actions">
                      <button 
                        className="btn-outline" 
                        onClick={() => fetchParticipants(e._id)}
                      >
                        👥 View Participants ({e.participantCount || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>No events yet</h3>
                <p>Create your first event to get started!</p>
              </div>
            )}
          </div>

          {/* Participants Modal */}
          {activeEvent && participants[activeEvent] && participants[activeEvent].length > 0 && (
            <div className="participants-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Participants for {events.find(e => e._id === activeEvent)?.title}</h3>
                  <button className="btn-close" onClick={() => setActiveEvent(null)}>×</button>
                </div>
                <div className="participants-list">
                  {participants[activeEvent].map((p) => (
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
                            onClick={() => markAttendance(activeEvent, p._id)}
                          >
                            Check-in
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
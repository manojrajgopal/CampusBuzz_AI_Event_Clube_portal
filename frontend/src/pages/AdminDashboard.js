// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [editTeacher, setEditTeacher] = useState(null);
  const [applications, setApplications] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    mobile: "",
    club_id: "",
  });

// ------------------- CLUB APPLICATIONS -------------------
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

// call inside useEffect
useEffect(() => {
  loadApplications();
}, []);

  // ------------------- LOAD DATA -------------------
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    await loadEvents();
    await loadTeachers();
    await loadClubs();
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
    const res = await API.get("/admin/clubs");
    setClubs(res.data);
  }

  // ------------------- EVENTS -------------------
  async function loadParticipants(eventId) {
    const res = await API.get(`/events/${eventId}/participants`);
    setParticipants(res.data);
    setSelectedEvent(eventId);
  }

  async function markAttendance(userId) {
    await API.post(`/events/${selectedEvent}/checkin/${userId}`);
    loadParticipants(selectedEvent);
  }

  // ------------------- TEACHERS -------------------
  async function handleDeleteTeacher(id) {
    if (!window.confirm("Delete this teacher?")) return;
    await API.delete(`/admin/teachers/${id}`);
    setTeachers(teachers.filter((t) => t._id !== id));
  }

  async function handleUpdateTeacher() {
    if (!editTeacher) return;
    const res = await API.put(`/admin/teachers/${editTeacher._id}`, editTeacher);
    setTeachers(teachers.map((t) => (t._id === res.data._id ? res.data : t)));
    setEditTeacher(null);
  }

  async function addTeacher() {
    try {
      const res = await API.post("/admin/teachers", newTeacher, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("✅ Teacher added successfully");
      setNewTeacher({ name: "", email: "", mobile: "", club_id: "" });
      loadTeachers();
    } catch (err) {
      alert("❌ Failed to add teacher");
      console.error(err);
    }
  }

  // ------------------- CLUBS -------------------
  async function handleApproveClub(id) {
    await API.put(`/admin/clubs/${id}/approve`);
    setClubs(clubs.map((c) => (c.id === id ? { ...c, approved: true } : c)));
  }

  async function handleRejectClub(id) {
    if (!window.confirm("Reject/Delete this club?")) return;
    await API.delete(`/admin/clubs/${id}`);
    setClubs(clubs.filter((c) => c.id !== id));
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

      {/* ---------- CLUBS ---------- */}
      <h3>Clubs</h3>
      {clubs.map((club) => (
        <div key={club.id} style={{ marginBottom: "10px" }}>
          {club.name} | Leader: {club.leader?.name || "N/A"} | Approved:{" "}
          {club.approved ? "✅ Yes" : "❌ No"}
          {!club.approved && (
            <button onClick={() => handleApproveClub(club.id)}>Approve</button>
          )}
          <button onClick={() => handleRejectClub(club.id)}>Reject</button>
        </div>
      ))}

      {/* ---------- EVENTS ---------- */}
      <h3>Events</h3>
      {events.map((ev) => (
        <button key={ev._id} onClick={() => loadParticipants(ev._id)}>
          {ev.title}
        </button>
      ))}

      {participants.length > 0 && (
        <div>
          <h3>Participants</h3>
          {participants.map((p) => (
            <div key={p._id}>
              <span>
                {p.name} ({p.email})
              </span>
              <span> | Checked-in: {p.checked_in ? "Yes" : "No"}</span>
              {!p.checked_in && (
                <button onClick={() => markAttendance(p._id)}>Check-in</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------- TEACHERS ---------- */}
      <h3>Teachers</h3>

      {/* Add Teacher Form */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Add Teacher</h4>
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
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <button onClick={addTeacher}>Add Teacher</button>
      </div>

      {/* Existing Teachers */}
      {teachers.map((t) => (
        <div key={t._id} style={{ marginBottom: "10px" }}>
          {editTeacher && editTeacher._id === t._id ? (
            <div>
              <input
                value={editTeacher.name}
                onChange={(e) =>
                  setEditTeacher({ ...editTeacher, name: e.target.value })
                }
              />
              <input
                value={editTeacher.email}
                onChange={(e) =>
                  setEditTeacher({ ...editTeacher, email: e.target.value })
                }
              />
              <input
                value={editTeacher.mobile}
                onChange={(e) =>
                  setEditTeacher({ ...editTeacher, mobile: e.target.value })
                }
              />
              <select
                value={editTeacher.club_id || ""}
                onChange={(e) =>
                  setEditTeacher({ ...editTeacher, club_id: e.target.value })
                }
              >
                <option value="">-- Select Club --</option>
                {clubs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={handleUpdateTeacher}>Save</button>
              <button onClick={() => setEditTeacher(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              {t.name} | {t.email} | {t.mobile} | Club:{" "}
              {t.club_name || "Unassigned"}
              <button onClick={() => setEditTeacher(t)}>Edit</button>
              <button onClick={() => handleDeleteTeacher(t._id)}>Delete</button>
            </div>
          )}
        </div>
      ))}

<h3>Club Applications</h3>
{applications.length === 0 ? (
  <p>No pending applications</p>
) : (
  applications.map((app) => (
    <div key={app._id} style={{ marginBottom: "10px" }}>
      <strong>{app.club_name}</strong> | Email: {app.club_email}
      <button onClick={() => handleApproveApplication(app._id)}>Approve</button>
      <button onClick={() => handleRejectApplication(app._id)}>Reject</button>
    </div>
  ))
)}
    </div>
  );
}

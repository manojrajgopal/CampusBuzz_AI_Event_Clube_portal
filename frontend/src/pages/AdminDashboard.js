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

  // ------------------- LOAD DATA -------------------
  useEffect(() => {
    API.get("/admin/events").then((res) => setEvents(res.data));
    API.get("/admin/teachers").then((res) => setTeachers(res.data));
    API.get("/admin/clubs").then((res) => setClubs(res.data));
  }, []);

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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

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
    </div>
  );
}
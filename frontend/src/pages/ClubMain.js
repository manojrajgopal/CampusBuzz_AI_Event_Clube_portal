// ClubMain.js
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import EventCreate from "./EventCreate"; // ✅ import component

export default function ClubMain() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const navigate = useNavigate();

  const clubId =
    localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (role !== "club" || !token || !clubId) {
      navigate("/club/login");
      return;
    }

    fetchClubData();
    fetchEvents();
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

  if (!club) return <div>Loading club info..</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{club.name}</h2>
      <p>
        <b>Description:</b> {club.description}
      </p>
      <p>
        <b>Status:</b> {club.approved ? "Approved ✅" : "Pending ❌"}
      </p>

      <h3>Members</h3>
      <ul>
        {club.members.map((member) => (
          <li key={member.id || member._id}>{member.name}</li>
        ))}
      </ul>

      <h3>Club Leadership</h3>
      <p>
        <b>Leader:</b>{" "}
        {club.leader
          ? `${club.leader.name} | ${club.leader.email}${
              club.leader.mobile ? " | " + club.leader.mobile : ""
            }`
          : "Not assigned"}
      </p>
      <p>
        <b>Sub-Leader:</b>{" "}
        {club.subleader
          ? `${club.subleader.name} | ${club.subleader.email}${
              club.subleader.mobile ? " | " + club.subleader.mobile : ""
            }`
          : "Not assigned"}
      </p>

      <h3>Teachers</h3>
      {club.teachers && club.teachers.length > 0 ? (
        <ul>
          {club.teachers.map((t) => (
            <li key={t.email}>
              {t.name} | {t.email} | {t.mobile}
            </li>
          ))}
        </ul>
      ) : (
        <p>No teacher assigned yet</p>
      )}

      <h3>Events</h3>
      {!showCreateForm ? (
        <button onClick={() => setShowCreateForm(true)}>+ Create Event</button>
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

      {events.length > 0 ? (
        <ul>
          {events.map((e) => (
            <li key={e._id} style={{ marginBottom: "10px" }}>
              <button
                onClick={() => fetchParticipants(e._id)}
                style={{ marginRight: "10px" }}
              >
                👥 View Participants
              </button>
              <strong>{e.title}</strong> |{" "}
              {new Date(e.date).toLocaleString()} | {e.venue}
              <button
                onClick={() => handleDeleteEvent(e._id)}
                style={{ marginLeft: "10px" }}
              >
                Delete
              </button>

              {participants[e._id] && participants[e._id].length > 0 && (
                <div style={{ marginTop: "10px", marginLeft: "20px" }}>
                  <h3>Participants</h3>
                  {participants[e._id].map((p) => (
                    <div key={p._id}>
                      <span>
                        {p.name} ({p.email})
                      </span>
                      <span>
                        {" "}
                        | Checked-in: {p.checked_in ? "Yes" : "No"}
                      </span>
                      {!p.checked_in && (
                        <button onClick={() => markAttendance(e._id, p._id)}>
                          Check-in
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events created yet</p>
      )}
    </div>
  );
}

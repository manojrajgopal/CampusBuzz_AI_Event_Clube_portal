import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  useEffect(() => {
    API.get("/events").then((res) => setEvents(res.data));
  }, []);

  async function loadParticipants(eventId) {
    const res = await API.get(`/events/${eventId}/participants`);
    setParticipants(res.data);
    setSelectedEvent(eventId);
  }

  async function markAttendance(userId) {
    await API.post(`/events/${selectedEvent}/checkin/${userId}`);
    loadParticipants(selectedEvent); // refresh list
  }

  return (
    <div>
      <h2>Admin / Club Dashboard</h2>
      <h3>Events</h3>
      {events.map((ev) => (
        <button key={ev.id} onClick={() => loadParticipants(ev.id)}>
          {ev.title}
        </button>
      ))}

      {participants.length > 0 && (
        <div>
          <h3>Participants</h3>
          {participants.map((p) => (
            <div key={p.id}>
              <span>User ID: {p.user_id}</span>
              <span> | Checked-in: {p.checked_in ? "Yes" : "No"}</span>
              {!p.checked_in && (
                <button onClick={() => markAttendance(p.user_id)}>Check-in</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

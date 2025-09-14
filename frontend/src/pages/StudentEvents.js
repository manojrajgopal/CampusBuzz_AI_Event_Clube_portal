import React, { useEffect, useState } from "react";
import API from "../api";

export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  async function fetchEvents() {
    try {
      const res = await API.get("/events");
      setEvents(res.data);
    } catch (err) {

    }
  }

  async function fetchRegistrations() {
    try {
      const res = await API.get("/registrations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const registeredIds = res.data.map((r) => r.event_id);
      setRegisteredEvents(registeredIds);
    } catch (err) {

    }
  }

  async function registerEvent(eventId) {
    try {
      await API.post(`/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Registered successfully!");
      setRegisteredEvents([...registeredEvents, eventId]);
    } catch (err) {
      alert(err.response?.data?.detail || "Error registering");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Events</h2>
      {events.map((e) => (
        <div key={e.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <h3>{e.title}</h3>
          <p>{e.description}</p>
          <p>Date: {new Date(e.date).toLocaleString()}</p>
          {registeredEvents.includes(e.id) ? (
            <button disabled>Registered</button>
          ) : (
            <button onClick={() => registerEvent(e.id)}>Register</button>
          )}
        </div>
      ))}
    </div>
  );
}

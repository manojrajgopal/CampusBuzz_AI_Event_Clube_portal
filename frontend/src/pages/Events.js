import React, { useEffect, useState } from "react";
import API from "../api";

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then((res) => setEvents(res.data));
  }, []);

  async function register(eventId) {
    try {
      await API.post("/events/register", { event_id: eventId });
      alert("Registered successfully!");
    } catch {
      alert("Registration failed");
    }
  }

  return (
    <div>
      <h2>Events</h2>
      {events.map((ev) => (
        <div key={ev.id}>
          <h3>{ev.title}</h3>
          <p>{ev.description}</p>
          <p>Status: {ev.checked_in ? "Checked-in" : "Not Checked-in"}</p>
          {!ev.checked_in && (
            <button onClick={() => register(ev.id)}>Register</button>
          )}
        </div>
      ))}
    </div>
  );
}
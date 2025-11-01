import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function EventParticipants() {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const res = await API.get(`/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setParticipants(res.data);
    } catch (err) {
      
    }
  }

  async function checkIn(userId) {
    try {
      await API.post(`/events/${eventId}/checkin/${userId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Checked-in successfully!");
      fetchParticipants();
    } catch (err) {
      alert(err.response?.data?.detail || "Error checking in");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Participants</h2>
      {participants.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px", color: "black" }}>
          <p>User ID: {p.user_id}</p>
          <p>Checked-in: {p.checked_in ? "Yes" : "No"}</p>
          {!p.checked_in && <button onClick={() => checkIn(p.user_id)}>Check-in</button>}
        </div>
      ))}
    </div>
  );
}

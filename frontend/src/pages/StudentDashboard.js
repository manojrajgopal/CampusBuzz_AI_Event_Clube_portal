// frontend/src/pages/StudentDashboard.js
import React, { useEffect, useState } from "react";
import API from "../api";

export default function StudentDashboard() {
  const [clubRecs, setClubRecs] = useState("");   // Store AI club recs
  const [eventRecs, setEventRecs] = useState(""); // Store AI event recs
  const studentId = localStorage.getItem("userId"); // get logged-in student ID

  useEffect(() => {
    async function fetchRecs() {
      try {
        // Fetch club recommendations
        const clubRes = await API.get(`/recommendations/clubs/${studentId}`);
        setClubRecs(clubRes.data.recommendations);

        // Fetch event recommendations
        const eventRes = await API.get(`/recommendations/events/${studentId}`);
        setEventRecs(eventRes.data.recommendations);
      } catch (err) {
        console.error("Error fetching recommendations", err);
      }
    }
    fetchRecs();
  }, [studentId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome to Student Dashboard</h2>

      {/* Club Recommendations */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Recommended Clubs for You</h3>
        <p>{clubRecs}</p>
      </div>

      {/* Event Recommendations */}
      <div>
        <h3>Recommended Events for You</h3>
        <p>{eventRecs}</p>
      </div>
    </div>
  );
}

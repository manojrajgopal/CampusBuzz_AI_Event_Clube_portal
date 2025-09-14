// frontend/src/pages/ClubMain.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ClubMain() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  // ✅ Backend returns "club_id", so make sure we retrieve it correctly
  const clubId = localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (role !== "club" || !token || !clubId) {
      navigate("/club/login");
      return;
    }
    fetchClubData();
    fetchEvents();
    fetchTeachers();
  }, [clubId, role, token]);

  async function fetchClubData() {
    try {
      const res = await API.get(`/clubs/${clubId}`);
      setClub(res.data);
    } catch (err) {
      console.error("Error fetching club data", err);
    }
  }

  async function fetchEvents() {
    try {
      const res = await API.get(`/events?clubId=${clubId}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  }

  async function fetchTeachers() {
    try {
      const res = await API.get(`/clubs/${clubId}/teachers`);
      setTeachers(res.data);
    } catch (err) {
      console.error("Error fetching teachers", err);
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  if (!club) return <div>Loading club info...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{club.name}</h2>
      <p><b>Description:</b> {club.description}</p>
      <p><b>Status:</b> {club.approved ? "Approved ✅" : "Pending ❌"}</p>
      <p><b>Members:</b> {club.members?.length || 0}</p>

      <h3>Club Leadership</h3>
      <p>
        <b>Leader:</b>{" "}
        {club.leader
          ? `${club.leader.name} | ${club.leader.email} | ${club.leader.mobile}`
          : "Not assigned"}
      </p>
      <p>
        <b>Sub-Leader:</b>{" "}
        {club.subLeader
          ? `${club.subLeader.name} | ${club.subLeader.email} | ${club.subLeader.mobile}`
          : "Not assigned"}
      </p>

      <h3>Teachers</h3>
      {teachers.length > 0 ? (
        <ul>
          {teachers.map((t) => (
            <li key={t._id}>
              {t.name} | {t.email} | {t.mobile}
            </li>
          ))}
        </ul>
      ) : (
        <p>No teacher assigned yet</p>
      )}

      <h3>Events</h3>
      {events.length > 0 ? (
        <ul>
          {events.map((e) => (
            <li key={e._id}>
              <strong>{e.title}</strong> |{" "}
              {new Date(e.date).toLocaleString()} | {e.venue}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events created yet</p>
      )}

      <h3>About This Project</h3>
      <p>
        This portal is designed to manage student clubs, events, and teacher
        assignments. Each club has a leader, sub-leader, and assigned teachers.
        Students can join clubs, apply for events, and administrators can
        approve clubs and manage activities.
      </p>

      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}

// Home.js
import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const role = localStorage.getItem("role");

  // ✅ make selectedClub a state (default from localStorage)
  const [selectedClub, setSelectedClub] = useState(
    localStorage.getItem("selectedClub") || ""
  );

  // keep localStorage updated when state changes
  useEffect(() => {
    localStorage.setItem("selectedClub", selectedClub);
  }, [selectedClub]);

  // Fetch events, blogs, reviews
  useEffect(() => {
    API.get("/events")
      .then((res) => setEvents(res.data.slice(0, 3)))
      .catch(() => setEvents([]));

    API.get("/blogs")
      .then((res) => setBlogs(res.data.slice(0, 3)))
      .catch(() => setBlogs([]));

    setReviews([
      { id: 1, name: "Alice", review: "Great platform for students!" },
      { id: 2, name: "Bob", review: "I enjoyed participating in events." },
      { id: 3, name: "Charlie", review: "Very smooth process and helpful team." },
    ]);

    if (role === "student") {
      API.get("/student/profile")
        .then((res) => setProfile(res.data))
        .catch((err) => console.log("Profile not found", err));

      API.get("/clubs")
        .then((res) => setClubs(res.data))
        .catch(() => setClubs([]));
    }
  }, [role]);

  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await API.get("/clubs");
        setClubs(res.data);
      } catch (err) {
        console.error("Error fetching clubs:", err);
      }
    }
    fetchClubs();
  }, []);

  async function registerEvent(eventId) {
    try {
      await API.post(`/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Registered successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error registering");
    }
  }

  async function applyJoinClub(clubId) {
    try {
      await API.post("/clubs/apply/join", { club_id: clubId });
      alert("Join request submitted ✅");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to apply");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Main Intro */}
      <section style={{ marginBottom: "30px" }}>
        <h1>Welcome to CampusBuzz</h1>
        <p>Explore Events, Clubs, Blogs, and more.</p>
      </section>

      {/* About Section */}
      <section id="information" style={{ marginBottom: "30px" }}>
        <h2>About CampusBuzz</h2>
        <p>
          CampusBuzz is your one-stop platform for staying updated with all campus 
          activities. From cultural events to hackathons, student blogs to club 
          announcements, we bring everything together in one place.
        </p>
        <p>
          Students can register for events, join clubs, and explore blogs, while 
          clubs and admins manage activities with ease. CampusBuzz helps in 
          connecting the entire campus community.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ marginBottom: "30px" }}>
        <h2>Contact Us</h2>
        <p>📍 Address: ABC University, City, State</p>
        <p>📞 Phone: +91 9876543210</p>
        <p>📧 Email: support@campusbuzz.com</p>
      </section>

      {/* Reviews Section */}
      <section style={{ marginBottom: "30px" }}>
        <h3>What Students Say</h3>
        {reviews.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ccc", margin: "5px", padding: "10px" }}>
            <strong>{r.name}</strong>
            <p>{r.review}</p>
          </div>
        ))}
      </section>

      {/* Student Profile Summary */}
      {profile && (
        <section style={{ marginBottom: "30px" }}>
          <h3>Your Profile</h3>
          <div style={{ border: "1px solid #ccc", padding: "10px" }}>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p><strong>Year:</strong> {profile.year}</p>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Upcoming Events</h2>
        {events.length > 0 ? (
          events.map((e) => (
            <div key={e.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
              <h3>{e.title}</h3>
              <p>{e.description}</p>
              <p>Date: {new Date(e.date).toLocaleString()}</p>
              <button onClick={() => registerEvent(e.id)}>Register</button>
            </div>
          ))
        ) : (
          <p>No events available.</p>
        )}
        <Link to="/events">👉 View All Events</Link>
      </section>

      {/* Latest Blogs */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Latest Blogs & Announcements</h2>
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <div key={blog._id} style={{ border: "1px solid #ccc", margin: "5px", padding: "10px" }}>
              <h3>{blog.title}</h3>
              <p>{blog.content.substring(0, 100)}...</p>
              {blog.image && <img src={blog.image} alt="blog" width="200" style={{ marginTop: "10px" }} />}
            </div>
          ))
        ) : (
          <p>No blogs available.</p>
        )}
        <Link to="/blogs">👉 View All Blogs</Link>
      </section>

      {/* Join Club Section */}
      <div style={{ padding: "20px" }}>
        <h2>Join a Club</h2>
        <select
          value={selectedClub}
          onChange={(e) => setSelectedClub(e.target.value)}
        >
          <option value="">-- Select a Club --</option>
          {clubs.length > 0 ? (
            clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          ) : (
            <option disabled>No clubs available</option>
          )}
        </select>
        <button
          style={{ marginLeft: "10px" }}
          disabled={!selectedClub}
          onClick={() => applyJoinClub(selectedClub)}
        >
          Apply
        </button>
      </div>

    </div>
  );
}

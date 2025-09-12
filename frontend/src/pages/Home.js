import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const role = localStorage.getItem("role");

  // Fetch events, blogs, reviews
  useEffect(() => {
    // Latest 3 events
    API.get("/events")
      .then((res) => setEvents(res.data.slice(0, 3)))
      .catch(() => setEvents([]));

    // Latest 3 blogs
    API.get("/blogs")
      .then((res) => setBlogs(res.data.slice(0, 3)))
      .catch(() => setBlogs([]));

    // Dummy reviews
    setReviews([
      { id: 1, name: "Alice", review: "Great platform for students!" },
      { id: 2, name: "Bob", review: "I enjoyed participating in events." },
      { id: 3, name: "Charlie", review: "Very smooth process and helpful team." },
    ]);

    // Fetch student profile if logged in
    if (role === "student") {
      API.get("/student/profile")
        .then((res) => setProfile(res.data))
        .catch((err) => console.log("Profile not found", err));
    }
  }, [role]);

  // Dummy event registration function
  function registerEvent(eventId) {
    alert(`Registered for event ID: ${eventId}`);
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
          events.map((event) => (
            <div key={event._id} style={{ border: "1px solid #ccc", margin: "5px", padding: "10px" }}>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>

              {/* Event registration */}
              {role === "student" ? (
                profile ? (
                  <button onClick={() => registerEvent(event._id)}>Register</button>
                ) : (
                  <p>Please complete your profile to register</p>
                )
              ) : null}
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

      {/* Student login/register button */}
      {!role && (
        <section style={{ marginBottom: "20px" }}>
          <Link to="/student/login">Student Login / Register</Link>
        </section>
      )}
    </div>
  );
}

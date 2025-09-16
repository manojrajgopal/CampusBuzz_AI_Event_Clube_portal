// frontend/src/pages/EventCreate.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function EventCreate() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [poster, setPoster] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  const navigate = useNavigate();

  const clubId =
    localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const token = localStorage.getItem("token");
  const clubName = localStorage.getItem("club_name"); // ✅ display only

  // Convert uploaded file to Base64
  function handlePosterUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPoster(reader.result); // Base64 string
    };
    reader.readAsDataURL(file);
  }

  // ✅ Works fully inside EventCreate.js
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await API.post(
        "/events/",
        {
          title,
          date,
          venue,
          description,
          tags: tags
            ? tags.split(",").map((t) => t.trim())
            : [],
          poster,
          isPaid,

        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Event created successfully!");
      navigate("/club/main");
    } catch (err) {
      console.error("Error creating event", err);
      alert("❌ Failed to create event");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create New Event</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Event Title: </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Date: </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Venue: </label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description: </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label>Tags (comma separated): </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div>
          <label>Poster: </label>
          <input type="file" accept="image/*" onChange={handlePosterUpload} />
          {poster && <p>✅ Poster uploaded</p>}
        </div>

        <div>
          <label>Paid Event? </label>
          <div>
            <button
              type="button"
              style={{
                marginRight: "10px",
                backgroundColor: isPaid ? "green" : "lightgray",
                color: "white",
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => setIsPaid(true)}
            >
              Yes
            </button>
            <button
              type="button"
              style={{
                backgroundColor: !isPaid ? "red" : "lightgray",
                color: "white",
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => setIsPaid(false)}
            >
              No
            </button>
          </div>
        </div>


        <button type="submit">Create Event</button>
        <button type="button" onClick={() => navigate("/club/main")}>
          Cancel
        </button>
      </form>
    </div>
  );
}

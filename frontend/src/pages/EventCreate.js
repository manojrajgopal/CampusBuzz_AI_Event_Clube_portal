// frontend/src/pages/EventCreate.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./EventCreate.css";

export default function EventCreate({ onSuccess, onCancel }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [poster, setPoster] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

  const clubId = localStorage.getItem("club_id") || localStorage.getItem("clubId");
  const token = localStorage.getItem("token");
  const clubName = localStorage.getItem("club_name");

  // Convert uploaded file to Base64 with preview
  function handlePosterUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Base64 conversion for backend
    const base64Reader = new FileReader();
    base64Reader.onloadend = () => {
      setPoster(base64Reader.result);
    };
    base64Reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      await API.post(
        "/events/",
        {
          title,
          date,
          venue,
          description,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          poster,
          isPaid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success animation and redirect
      document.querySelector('.event-create-container').classList.add('success-animation');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          alert("✅ Event created successfully!");
          navigate("/club/main");
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error creating event", err);
      document.querySelector('.event-create-container').classList.add('error-shake');
      setTimeout(() => {
        document.querySelector('.event-create-container').classList.remove('error-shake');
      }, 500);
      alert("❌ Failed to create event");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    document.querySelector('.event-create-container').classList.add('exit-animation');
    setTimeout(() => {
      if (onCancel) {
        onCancel();
      } else {
        navigate("/club/main");
      }
    }, 300);
  }

  return (
    <div className="event-create-wrapper">
      <div className="three-background-create"></div>
      
      <div className="event-create-container">
        <div className="create-header">
          <h2>Create New Event</h2>
          <p className="club-name">For {clubName}</p>
        </div>

        <form onSubmit={handleSubmit} className="event-create-form">
          <div className="form-grid">
            <div className="form-group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="floating-input"
                placeholder="Event Title"
              />
              <div className="input-underline"></div>
            </div>

            <div className="form-group">
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="floating-input"
              />
              <div className="input-underline"></div>
            </div>

            <div className="form-group">
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                className="floating-input"
                placeholder="Venue"
              />
              <div className="input-underline"></div>
            </div>

            <div className="form-group full-width">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="floating-textarea"
                rows="4"
                placeholder="Description"
              />
              <div className="input-underline"></div>
            </div>

            <div className="form-group full-width">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="floating-input"
                placeholder="music, workshop, social..."
              />
              <div className="input-underline"></div>
            </div>

            <div className="form-group full-width">
              <label className="file-upload-label">
                <span className="upload-icon">📷</span>
                <span className="upload-text">
                  {previewImage ? "Poster Uploaded ✓" : "Upload Event Poster"}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePosterUpload} 
                  className="file-input"
                />
              </label>
              
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Poster preview" />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={() => {
                      setPreviewImage(null);
                      setPoster(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label className="payment-label">Paid Event?</label>
              <div className="payment-toggle">
                <button
                  type="button"
                  className={`toggle-option ${isPaid ? 'active' : ''}`}
                  onClick={() => setIsPaid(true)}
                >
                  <span className="toggle-icon">💰</span>
                  Yes
                </button>
                <button
                  type="button"
                  className={`toggle-option ${!isPaid ? 'active' : ''}`}
                  onClick={() => setIsPaid(false)}
                >
                  <span className="toggle-icon">🎫</span>
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Create Event
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
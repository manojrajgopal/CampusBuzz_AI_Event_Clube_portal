// Blogs.js
import React, { useEffect, useState } from "react";
import API from "../api";
import "./Blogs.css";

const fallbackMedia = ["/images/Achivement.jpg", "/images/fashion.jpg", "/images/programming'.jpg", "/images/reporterBoy.png", "/images/song (1).mp4"];

function getRandomFallback() {
  return fallbackMedia[Math.floor(Math.random() * fallbackMedia.length)];
}

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    image: "",
    imageType: "url",
  });
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/blogs");
      console.log("Fetched blogs:", res.data);
      setBlogs(res.data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (e.g., 5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        setFile(null);
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please select a valid image or video file");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  }

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  function resetForm() {
    setForm({ title: "", content: "", image: "", imageType: "url" });
    setFile(null);
    setEditingBlog(null);
    setShowForm(false);
    setError("");
  }

  function handleEdit(blog) {
    setEditingBlog(blog);
    setForm({
      title: blog.title,
      content: blog.content,
      image: blog.image || "",
      imageType: blog.image && blog.image.startsWith('data:') ? "file" : "url",
    });
    setFile(null);
    setShowForm(true);
  }

  // Create or Update blog
  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (form.imageType === "url" && form.image && !isValidUrl(form.image)) {
      setError("Please enter a valid URL");
      return;
    }

    if (form.imageType === "file" && !file && !editingBlog) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let media = form.image;
      let mediaType = form.imageType;

      if (form.imageType === "file" && file) {
        media = await fileToBase64(file);
        mediaType = "file";
      }

      const data = {
        title: form.title,
        content: form.content,
        media: media,
        mediaType: mediaType,
      };

      if (editingBlog) {
        await API.put(`/blogs/${editingBlog._id || editingBlog.id}/json`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await API.post("/blogs", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert(editingBlog ? "Blog updated!" : "Blog created!");
      resetForm();
      await fetchBlogs();
    } catch (err) {
      console.error("Error saving blog:", err);
      setError(err.response?.data?.detail || err.response?.data?.message || "Error saving blog");
    } finally {
      setLoading(false);
    }
  }

  // Delete blog
  async function deleteBlog(blogId) {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      await API.delete(`/blogs/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(blogs.filter((b) => (b._id || b.id) !== blogId));
      alert("Blog deleted successfully!");
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Error deleting blog: " + (err.response?.data?.detail || err.message));
    }
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

function renderImage(blog) {
  console.debug("[renderImage] called");
  console.debug("[renderImage] blog object:", blog);

  if (!blog.media) {
    console.warn("[renderImage] blog.media is missing, using random fallback");
    const fallbackUrl = getRandomFallback();
    const isVideo = /\.(mp4|webm|ogg)$/i.test(fallbackUrl);

    if (isVideo) {
      return (
        <div className="blog-media">
          <video
            controls
            className="blog-video"
            src={fallbackUrl}
            onPlay={() => console.debug("[renderImage] Fallback video started playing")}
            onPause={() => console.debug("[renderImage] Fallback video paused")}
            onError={(e) => console.error("[renderImage] Fallback video error", e)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="blog-media">
          <img
            src={fallbackUrl}
            alt="Blog media"
            className="blog-image"
            onLoad={() => console.debug("[renderImage] Fallback image loaded successfully")}
            onError={(e) => console.error("[renderImage] Fallback image failed to load", e)}
          />
        </div>
      );
    }
  }

  const mediaUrl = blog.media;
  console.debug("[renderImage] mediaUrl:", mediaUrl);

  const isVideo =
    /\.(mp4|webm|ogg)$/i.test(mediaUrl) ||
    mediaUrl.includes("youtube.com") ||
    mediaUrl.includes("vimeo.com") ||
    blog.mediaType === "video";

  console.debug("[renderImage] blog.mediaType:", blog.mediaType);
  console.debug("[renderImage] isVideo:", isVideo);

  if (isVideo) {
    console.debug("[renderImage] Rendering VIDEO");

    return (
      <div className="blog-media">
        <video
          controls
          className="blog-video"
          src={mediaUrl}
          onPlay={() => console.debug("[renderImage] Video started playing")}
          onPause={() => console.debug("[renderImage] Video paused")}
          onError={(e) => console.error("[renderImage] Video error", e)}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  } else {
    console.debug("[renderImage] Rendering IMAGE");

    const imageUrl =
      blog.mediaType === "file"
        ? `${API.defaults.baseURL}/uploads/blogs/${mediaUrl.split("/").pop()}`
        : mediaUrl;

    console.debug("[renderImage] Computed imageUrl:", imageUrl);

    return (
      <div className="blog-media">
        <img
          src={imageUrl}
          alt={blog.title}
          className="blog-image"
          onLoad={() => {
            console.debug("[renderImage] Image loaded successfully:", imageUrl);
          }}
          onError={(e) => {
            console.error("[renderImage] Image failed to load", { failedUrl: imageUrl, event: e });
          }}
        />
      </div>
    );
  }
}

  return (
    <div className="blogs-page">
      {/* Background with high-quality image */}
      <div className="page-background">
        <div className="background-image"></div>
        <div className="background-overlay"></div>
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      {/* Header Section */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-badge">Campus Insights</div>
          <h1 className="page-title">
            Blogs & Announcements
          </h1>
          <p className="page-subtitle">
            Stay updated with the latest campus news, events, and student insights
          </p>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{blogs.length}+</span>
              <span className="stat-label">Blog Posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Monthly Readers</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Active Writers</span>
            </div>
          </div>
          
          {(role === "admin" || role === "club") && (
            <div className="header-actions">
              <button 
                className={`btn-primary ${showForm ? 'btn-cancel' : ''}`}
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel" : "Create Blog Post"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Create/Edit Blog Form */}
        {showForm && (role === "admin" || role === "club") && (
          <section className="blog-form-section">
            <div className="blog-form-container">
              <div className="form-header">
                <h3>{editingBlog ? "Edit Blog Post" : "Create New Blog"}</h3>
                <p>Share your insights and announcements with the campus community</p>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    name="title"
                    placeholder="Enter blog title"
                    value={form.title}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Content *</label>
                  <textarea
                    name="content"
                    placeholder="Write your blog content here..."
                    value={form.content}
                    onChange={handleChange}
                    rows="6"
                    className="form-textarea"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Media Type</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="imageType"
                        value="url"
                        checked={form.imageType === "url"}
                        onChange={handleChange}
                      />
                      Use URL
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="imageType"
                        value="file"
                        checked={form.imageType === "file"}
                        onChange={handleChange}
                      />
                      Upload File
                    </label>
                  </div>
                </div>

                {form.imageType === "url" ? (
                  <div className="form-group full-width">
                    <label>Media URL</label>
                    <input
                      name="image"
                      placeholder="https://example.com/image.jpg"
                      value={form.image}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                ) : (
                  <div className="form-group full-width">
                    <label>Upload File (Max 5MB)</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="form-input"
                    />
                    {file && (
                      <div className="file-name">
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    <small className="file-hint">
                      Supported: JPEG, PNG, GIF, MP4, WebM, OGG
                    </small>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="btn-submit"
                >
                  {loading ? "Saving..." : (editingBlog ? "Update Blog" : "Create Blog")}
                </button>
                <button onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && !showForm && (
          <section className="loading-section">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <h3>Loading blogs...</h3>
              <p>Fetching the latest campus insights</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !showForm && (
          <section className="error-section">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3>{error}</h3>
              <button onClick={fetchBlogs} className="btn-primary">
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Blog List */}
        <section className="blogs-section">
          {blogs.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No blogs available</h3>
              <p>{role === "admin" || role === "club" ? "Create one to get started!" : "Check back later for new blogs!"}</p>
              {(role === "admin" || role === "club") && !showForm && (
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Create First Blog
                </button>
              )}
            </div>
          ) : (
            <div className="blogs-grid">
              {blogs.map((blog, index) => {
                const blogId = blog._id || blog.id;
                return (
                  <div key={blogId} className="blog-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    {/* Blog Image */}
                    {renderImage(blog)}
                    
                    <div className="blog-content">
                      <div className="blog-header">
                        <h3 className="blog-title">{blog.title}</h3>
                        {(role === "admin" || role === "club") && (
                          <div className="blog-actions">
                            <button 
                              onClick={() => handleEdit(blog)}
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteBlog(blogId)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <p className="blog-excerpt">
                        {blog.content?.substring(0, 150)}
                        {blog.content?.length > 150 ? "..." : ""}
                      </p>
                      
                      <div className="blog-meta">
                        {blog.author && <span className="blog-author">By {blog.author}</span>}
                        {blog.created_at && (
                          <span className="blog-date">
                            {new Date(blog.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="blog-footer">
                        <button className="read-more">Read Full Story →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Newsletter Section */}
        <section className="newsletter-section">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Get the latest blog posts and announcements delivered to your inbox</p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="newsletter-input"
              />
              <button className="btn-primary">Subscribe</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
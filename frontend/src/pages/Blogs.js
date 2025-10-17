// Blogs.js
import React, { useEffect, useState } from "react";
import API from "../api";
import "./Blogs.css";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    media: "",
    mediaType: "url",
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
      const res = await API.get("/blogs/");
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
    setFile(e.target.files[0]);
    setError("");
  }

  function resetForm() {
    setForm({ title: "", content: "", media: "", mediaType: "url" });
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
      media: blog.media || "",
      mediaType: blog.mediaType || "url",
    });
    setShowForm(true);
  }

  // Create or Update blog
  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (form.mediaType === "url" && form.media && !isValidUrl(form.media)) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (form.mediaType === "file" && file) {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("content", form.content);
        formData.append("file", file);

        if (editingBlog) {
          await API.put(`/blogs/upload/${editingBlog._id || editingBlog.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await API.post("/blogs", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        const data = {
          title: form.title,
          content: form.content,
          media: form.media,
          mediaType: "url",
        };

        if (editingBlog) {
          await API.put(`blogs/${editingBlog._id || editingBlog.id}`, data);
        } else {
          await API.post("blogs/", data);
        }
      }

      alert(editingBlog ? "Blog updated!" : "Blog created!");
      resetForm();
      await fetchBlogs();
    } catch (err) {
      console.error("Error saving blog:", err);
      setError(err.response?.data?.message || "Error saving blog");
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
      await API.delete(`/api/blogs/${blogId}`);
      setBlogs(blogs.filter((b) => (b._id || b.id) !== blogId));
      alert("Blog deleted successfully!");
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Error deleting blog");
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

  // Enhanced media rendering function
  function renderMedia(blog) {
    if (!blog.media) {
      return (
        <div className="blog-media">
          <img 
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
            alt="Blog default" 
            className="blog-image"
          />
        </div>
      );
    }

    const mediaUrl = blog.media;
    const isVideo = /\.(mp4|webm|ogg)$/i.test(mediaUrl) || 
                   mediaUrl.includes("youtube.com") || 
                   mediaUrl.includes("vimeo.com") ||
                   blog.mediaType === "video";

    if (isVideo) {
      return (
        <div className="blog-media">
          <video controls className="blog-video">
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="blog-media">
          <img src={mediaUrl} alt={blog.title} className="blog-image" />
        </div>
      );
    }
  }

  return (
    <div className="blogs-page">
      {/* Hero Section */}
      <section className="section blogs-hero">
        <div className="section-header">
          <h2>Blogs & Announcements</h2>
          <div className="underline"></div>
          <p>Stay updated with the latest campus news, events, and insights</p>
        </div>
        
        {(role === "admin" || role === "club") && (
          <div className="hero-actions">
            <button 
              className={`btn-primary ${showForm ? 'btn-cancel' : ''}`}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "Create Blog"}
            </button>
          </div>
        )}
      </section>

      {/* Create/Edit Blog Form */}
      {showForm && (role === "admin" || role === "club") && (
        <section className="section blog-form-section">
          <div className="blog-form-container">
            <h3>{editingBlog ? "Edit Blog" : "Create New Blog"}</h3>
            
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
                      name="mediaType"
                      value="url"
                      checked={form.mediaType === "url"}
                      onChange={handleChange}
                    />
                    Use URL
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="mediaType"
                      value="file"
                      checked={form.mediaType === "file"}
                      onChange={handleChange}
                    />
                    Upload File
                  </label>
                </div>
              </div>

              {form.mediaType === "url" ? (
                <div className="form-group full-width">
                  <label>Media URL</label>
                  <input
                    name="media"
                    placeholder="https://example.com/image.jpg"
                    value={form.media}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              ) : (
                <div className="form-group full-width">
                  <label>Upload File</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="form-input"
                  />
                  {file && <div className="file-name">Selected: {file.name}</div>}
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
        <section className="section">
          <div className="loading-state">
            <div className="spinner"></div>
            <h3>Loading blogs...</h3>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && !showForm && (
        <section className="section">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{error}</h3>
          </div>
        </section>
      )}

      {/* Blog List */}
      <section className="section blogs-section">
        {blogs.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No blogs available</h3>
            <p>{role === "admin" || role === "club" ? "Create one to get started!" : "Check back later for new blogs!"}</p>
          </div>
        ) : (
          <div className="blogs-grid">
            {blogs.map((blog) => {
              const blogId = blog._id || blog.id;
              return (
                <div key={blogId} className="blog-card">
                  {/* Blog Media */}
                  {renderMedia(blog)}
                  
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
                      {blog.createdAt && (
                        <span className="blog-date">
                          {new Date(blog.createdAt).toLocaleDateString()}
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
    </div>
  );
}
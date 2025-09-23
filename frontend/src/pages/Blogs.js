// Blogs.js
import React, { useEffect, useState } from "react";
import API from "../api";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    media: "",
    mediaType: "url",
  });
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Optional: store role in login

  // ✅ Fetch blogs on mount
  useEffect(() => {
    API.get("/blogs/").then((res) => {
      console.log("Blogs API response:", res.data);
      setBlogs(res.data);
    });
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  // ✅ Create blog
  async function createBlog() {
    try {
      if (form.mediaType === "file" && file) {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("content", form.content);
        formData.append("file", file);

        await API.post("/api/blogs/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const data = {
          title: form.title,
          content: form.content,
          media: form.media,
          mediaType: "url",
        };
        await API.post("/api/blogs/", data);
      }

      alert("Blog created!");
      setForm({ title: "", content: "", media: "", mediaType: "url" });
      setFile(null);

      const res = await API.get("/api/blogs/");
      setBlogs(res.data);
    } catch (err) {
      console.error("Error creating blog:", err);
      alert("Error creating blog");
    }
  }

  // ✅ Delete blog
  async function deleteBlog(blogId) {
    try {
      await API.delete(`/api/blogs/${blogId}`);
      setBlogs(blogs.filter((b) => (b._id || b.id) !== blogId));
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Error deleting blog");
    }
  }

  return (
    <div>
      <h2>Blogs / Announcements</h2>

      {/* Show Create Blog form only for Admin/Club */}
      {role === "admin" || role === "club" ? (
        <div>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Create Blog"}
          </button>

          {showForm && (
            <div>
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
              />
              <textarea
                name="content"
                placeholder="Content"
                value={form.content}
                onChange={handleChange}
              />

              {/* Media Type Selection */}
              <div>
                <label>
                  <input
                    type="radio"
                    name="mediaType"
                    value="url"
                    checked={form.mediaType === "url"}
                    onChange={handleChange}
                  />
                  Use URL
                </label>
                <label>
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

              {form.mediaType === "url" ? (
                <input
                  name="media"
                  placeholder="Media URL (Image/Video)"
                  value={form.media}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              )}

              <button onClick={createBlog}>Submit</button>
            </div>
          )}
        </div>
      ) : null}

      {/* Blog List */}
      <div>
        {blogs.map((b) => {
          const blogId = b._id || b.id; // ✅ Safe fallback
          return (
            <div
              key={blogId}
              style={{ border: "1px solid #ccc", margin: "5px", padding: "5px" }}
            >
              <h3>{b.title}</h3>
              <p>{b.content}</p>

              {/* Show Media */}
              {b.media &&
                (b.media.endsWith(".mp4") ||
                b.media.endsWith(".webm") ||
                b.media.includes("youtube.com") ? (
                  <video width="320" height="240" controls>
                    <source src={b.media} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img src={b.media} alt="blog media" width="200" />
                ))}

              {(role === "admin" || role === "club") && (
                <button onClick={() => deleteBlog(blogId)}>Delete</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Blogs.js
import React, { useEffect, useState } from "react";
import API from "../api";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", image: "" });
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Optional: store role in login

  useEffect(() => {
    API.get("/blogs").then((res) => setBlogs(res.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createBlog() {
    try {
      await API.post("/blogs", form);
      alert("Blog created!");
      setForm({ title: "", content: "", image: "" });
      const res = await API.get("/blogs");
      setBlogs(res.data);
    } catch (err) {
      alert("Error creating blog");
    }
  }

  async function deleteBlog(blogId) {
    try {
      await API.delete(`/blogs/${blogId}`);
      setBlogs(blogs.filter((b) => b.id !== blogId));
    } catch (err) {
      alert("Error deleting blog");
    }
  }

  return (
    <div>
      <h2>Blogs / Announcements</h2>

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
              <input
                name="image"
                placeholder="Image URL"
                value={form.image}
                onChange={handleChange}
              />
              <button onClick={createBlog}>Submit</button>
            </div>
          )}
        </div>
      ) : null}

      <div>
        {blogs.map((b) => (
          <div key={b.id} style={{ border: "1px solid #ccc", margin: "5px", padding: "5px" }}>
            <h3>{b.title}</h3>
            <p>{b.content}</p>
            {b.image && <img src={b.image} alt="blog" width="200" />}
            {(role === "admin" || role === "club") && (
              <button onClick={() => deleteBlog(b.id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

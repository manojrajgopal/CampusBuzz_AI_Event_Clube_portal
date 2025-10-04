import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function ClubDashboard() {
  const { clubId } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinRequests, setJoinRequests] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    media: "",
    mediaType: "url",
  });
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // -------- Fetch Club --------
  useEffect(() => {
    async function fetchClubData() {
      try {
        const res = await API.get(`/clubs/${clubId}`);
        setClub(res.data);

        if (role === "club" || role === "admin") {
          await fetchJoinRequests(res.data.id);
        }
      } catch (err) {
        console.error("Error fetching club:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClubData();
    fetchBlogs();
  }, [clubId, role]);

  async function fetchJoinRequests(club_id) {
    try {
      const res = await API.get(`/clubs/${club_id}/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJoinRequests(res.data);
    } catch (err) {
      console.error("Error fetching join requests:", err);
    }
  }

  // -------- Blogs Logic --------
  async function fetchBlogs() {
    try {
      const res = await API.get("/blogs/");
      setBlogs(res.data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

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
      fetchBlogs();
    } catch (err) {
      console.error("Error creating blog:", err);
      alert("Error creating blog");
    }
  }

  async function deleteBlog(blogId) {
    try {
      await API.delete(`/api/blogs/${blogId}`);
      setBlogs(blogs.filter((b) => (b._id || b.id) !== blogId));
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Error deleting blog");
    }
  }

  // -------- Student Join --------
  async function handleJoinClub() {
    try {
      await API.post(
        "/clubs/apply/join",
        { club_id: club.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Join request sent");
    } catch (err) {
      alert("❌ Failed to send join request");
      console.error(err);
    }
  }

  // -------- Club Actions --------
  async function approveRequest(requestId) {
    try {
      await API.post(
        `/clubs/${club.id}/join-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchJoinRequests(club.id);
    } catch (err) {
      console.error("Error approving request:", err);
    }
  }

  async function rejectRequest(requestId) {
    try {
      await API.delete(
        `/clubs/${club.id}/join-requests/${requestId}/reject`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchJoinRequests(club.id);
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  }

  // -------- UI --------
  if (loading) return <p>Loading club...</p>;
  if (!club) return <p>Club not found</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{club.name}</h1>
      <p className="text-gray-600 mb-6">{club.description}</p>

      {/* Leader Section - Changed text color */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Leader</h2>
        <p className="text-black">Name: {club.leader?.name || "N/A"}</p>
        <p className="text-black">Email: {club.leader?.email || "N/A"}</p>
        <p className="text-black">Mobile: {club.leader?.mobile || "N/A"}</p>
      </div>

      {/* Sub-Leader */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Sub-Leader</h2>
        <p className="text-black">Name: {club.subleader?.name || "N/A"}</p>
        <p className="text-black">Email: {club.subleader?.email || "N/A"}</p>
      </div>

      {/* Teachers */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Teacher(s)</h2>
        {club.teachers?.length > 0 ? (
          <ul className="list-disc pl-6">
            {club.teachers.map((t, idx) => (
              <li key={idx} className="text-black">
                {t.name} — {t.email}, {t.mobile}
              </li>
            ))}
          </ul>
        ) : (
          <p>No teachers assigned</p>
        )}
      </div>

      {/* Join Club Button for Students */}
      {role === "student" && (
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleJoinClub}>
          Join Club
        </button>
      )}

      {/* Join Requests (Admin/Club) */}
      {(role === "club" || role === "admin") && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Pending Join Requests</h2>
          {joinRequests?.length > 0 ? (
            <ul className="space-y-2">
              {joinRequests.map((req) => (
                <li key={req.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="text-black">
                      <strong>{req.name}</strong> ({req.email})
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => approveRequest(req.id)}
                      className="ml-3 px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="ml-2 px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No pending requests</p>
          )}
        </div>
      )}

      {/* Blogs Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Blogs / Announcements</h2>

        {(role === "club" || role === "admin") && (
          <div className="mb-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              {showForm ? "Cancel" : "Add Blog"}
            </button>

            {showForm && (
              <div className="mt-4 space-y-2">
                <input
                  name="title"
                  placeholder="Title"
                  value={form.title}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
                <textarea
                  name="content"
                  placeholder="Content"
                  value={form.content}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />

                <div>
                  <label className="mr-4">
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
                    className="border p-2 w-full"
                  />
                ) : (
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
                )}

                <button
                  onClick={createBlog}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Blog List */}
        <div>
          {blogs.map((b) => {
            const blogId = b._id || b.id;
            return (
              <div key={blogId} className="border p-4 mb-3 rounded bg-gray-100">
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p>{b.content}</p>

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

                {(role === "club" || role === "admin") && (
                  <button
                    onClick={() => deleteBlog(blogId)}
                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

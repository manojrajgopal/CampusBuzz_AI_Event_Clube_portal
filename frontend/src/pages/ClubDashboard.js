import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function ClubDashboard() {
  const { clubId } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinRequests, setJoinRequests] = useState([]);
  const role = localStorage.getItem("role"); // "student", "club", "admin"

  // ---------------- FETCH CLUB + REQUESTS ----------------
  useEffect(() => {
    async function fetchClubData() {
      try {
        const res = await API.get(`/clubs/${clubId}`);
        setClub(res.data);

        // If club leader/admin → also fetch join requests
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
  }, [clubId, role]);

  async function fetchJoinRequests(club_id) {
    try {
      const res = await API.get(`/clubs/${club_id}/join-requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setJoinRequests(res.data); // must include {id, name, email}
    } catch (err) {
      console.error("Error fetching join requests:", err);
    }
  }

  // ---------------- STUDENT ACTION ----------------
  async function handleJoinClub() {
    try {
      await API.post(
        "/clubs/apply/join",
        { club_id: club.id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("✅ Join request sent");
    } catch (err) {
      alert("❌ Failed to send join request");
      console.error(err);
    }
  }

  // ---------------- CLUB ACTIONS ----------------
  async function approveRequest(requestId) {
    try {
      await API.post(
        `/clubs/${club.id}/join-requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
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
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchJoinRequests(club.id);
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  }

  // ---------------- UI ----------------
  if (loading) return <p>Loading club...</p>;
  if (!club) return <p>Club not found</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{club.name}</h1>
      <p className="text-gray-600 mb-6">{club.description}</p>

      {/* Leader */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Leader</h2>
        <p>Name: {club.leader?.name || "N/A"}</p>
        <p>Email: {club.leader?.email || "N/A"}</p>
        <p>Mobile: {club.leader?.mobile || "N/A"}</p>
      </div>

      {/* Sub-Leader */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Sub-Leader</h2>
        <p>Name: {club.subleader?.name || "N/A"}</p>
        <p>Email: {club.subleader?.email || "N/A"}</p>
      </div>

      {/* Teacher(s) */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Teacher(s)</h2>
        {club.teachers?.length > 0 ? (
          <ul className="list-disc pl-6">
            {club.teachers.map((t, idx) => (
              <li key={idx}>
                {t.name} — {t.email}, {t.mobile}
              </li>
            ))}
          </ul>
        ) : (
          <p>No teachers assigned</p>
        )}
      </div>

      {/* Student - Join Button */}
      {role === "student" && (
        <button
          onClick={handleJoinClub}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Join Club
        </button>
      )}

      {/* Club Leader/Admin - Join Requests */}
      {(role === "club" || role === "admin") && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Pending Join Requests</h2>

          <div>
            {joinRequests?.length > 0 ? (
              <ul className="space-y-2">
                {joinRequests.map((req) => (
                  <li
                    key={req.id}
                    className="p-3 border rounded flex justify-between items-center"
                  >
                    <div>
                      <p>
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
        </div>
      )}
    </div>
  );
}

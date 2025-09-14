import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function ClubDashboard() {
  const { id } = useParams(); // club_id from route
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await API.get(`/clubs/${id}`);
        setClub(res.data);
      } catch (err) {
        console.error("Error fetching club:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [id]);

  if (loading) return <p>Loading club </p>;
  if (!club) return <p>Club not found</p>;

  return (
    <div className="p-6">
      {/* Club Name */}
      <h1 className="text-3xl font-bold mb-4">{club.name}</h1>
      <p className="text-gray-600 mb-6">{club.description}</p>

      {/* Leader */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Leader</h2>
        <p>Name: {club.leader_name || "N/A"}</p>
        <p>Email: {club.leader_email || "N/A"}</p>
        <p>Mobile: {club.leader_mobile || "N/A"}</p>
      </div>

      {/* Sub-Leader */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Sub-Leader</h2>
        <p>Name: {club.subleader_name || "N/A"}</p>
        <p>Email: {club.subleader_email || "N/A"}</p>
        <p>Mobile: {club.subleader_mobile || "N/A"}</p>
      </div>

      {/* Teacher(s) */}
      <div>
        <h2 className="text-xl font-semibold">Teacher(s)</h2>
        {club.teachers && club.teachers.length > 0 ? (
          <ul className="list-disc pl-6">
            {club.teachers.map((t) => (
              <li key={t.id}>
                {t.name} — {t.email}, {t.mobile}
              </li>
            ))}
          </ul>
        ) : (
          <p>No teachers assigned</p>
        )}
      </div>
    </div>
  );
}

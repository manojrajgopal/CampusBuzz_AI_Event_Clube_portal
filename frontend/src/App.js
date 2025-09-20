import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import StudentAuth from "./pages/StudentAuth";
import ClubMain from "./pages/ClubMain";

import Events from "./pages/Events";
import AdminDashboard from "./pages/AdminDashboard";
import Blogs from "./pages/Blogs";
import ClubLogin from "./pages/ClubLogin";
import AdminLogin from "./pages/AdminLogin";
import StudentEvents from "./pages/StudentEvents";
import EventParticipants from "./pages/EventParticipants";
import StudentProfile from "./pages/StudentProfile";
import ClubDashboard from "./pages/ClubDashboard";
import EventCreate from "./pages/EventCreate";
import ClubCreate from "./pages/ClubCreate";


function AppWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    // if (role === "student") navigate("/");
    // else if (role === "club") navigate("/clubs");
    // else if (role === "admin") navigate("/admin");
  }, [navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        {/* General */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/blogs" element={<Blogs />} />

        {/* Student */}
        <Route path="/student/login" element={<StudentAuth />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        {/* Club */}
        <Route path="/clubs" element={<ClubMain />} />
        <Route path="/club/login" element={<ClubLogin />} />
        <Route path="/clubs/:id" element={<ClubDashboard />} />
        {/* In club event create */}
        <Route path="/club/events/create" element={<EventCreate />} />
        
        {/* Admin */}
        <Route path="/club/create" element={<ClubCreate />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Add Routes */}
        <Route path="/student/events" element={<StudentEvents />} />
        <Route path="/events/:eventId/participants" element={<EventParticipants />} />
        <Route path="/profile" element={<StudentProfile />} />
      </Routes>

    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

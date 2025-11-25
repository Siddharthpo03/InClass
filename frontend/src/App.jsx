import React from "react";
import { Routes, Route } from "react-router-dom";

// Import pages from standard pages folder
import Homepage from "./pages/Homepage";
import InClassLogin from "./pages/Login/InClassLogin";
import InClassRegister from "./pages/Register/InClassRegister";
import InClassStudent from "./pages/Student/InClassStudent";
import InClassFaculty from "./pages/Faculty/InClassFaculty";
import InClassAdmin from "./pages/Admin/InClassAdmin";
import InClassForgotPass from "./pages/ForgotPass/InClassForgotPass";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Report from "./pages/Report";

function App() {
  return (
    <div className="app-main-content">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<InClassLogin />} />
        <Route path="/register" element={<InClassRegister />} />
        <Route path="/student/dashboard" element={<InClassStudent />} />
        <Route path="/faculty/dashboard" element={<InClassFaculty />} />
        <Route path="/admin/dashboard" element={<InClassAdmin />} />
        <Route path="/forgot" element={<InClassForgotPass />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </div>
  );
}

export default App;

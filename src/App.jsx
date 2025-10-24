import React from "react";
import { Routes, Route } from "react-router-dom";

// Standardizing component imports from dedicated pages folder
import InClassHomepage from "./Frontend/Homepage/InClassHomepage";
import InClassLogin from "./Frontend/Login/InClassLogin";
import InClassRegister from "./Frontend/Register/InClassRegister";
import InClassStudent from "./Frontend/Student/InClassStudent";
import InClassFaculty from "./Frontend/Faculty/InClassFaculty";
import InClassAdmin from "./Frontend/Admin/InClassAdmin";
import InClassForgotPass from "./Frontend/ForgotPass/InClassForgotPass";

function App() {
  return (
    <div className="app-main-content">
      <Routes>
        <Route path="/" element={<InClassHomepage />} />/
        <Route path="/login" element={<InClassLogin />} />
        <Route path="/register" element={<InClassRegister />} />
        <Route path="/student/dashboard" element={<InClassStudent />} />
        <Route path="/faculty/dashboard" element={<InClassFaculty />} />
        <Route path="/admin/dashboard" element={<InClassAdmin />} />
        <Route path="/forgot" element={<InClassForgotPass />} />
      </Routes>
    </div>
  );
}

export default App;

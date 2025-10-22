import React from "react";
import { Routes, Route } from "react-router-dom";

// Standardizing component imports from dedicated pages folder
import InClassHomepage from "./Homepage/InClassHomepage";
import InClassLogin from "./Login/InClassLogin";
import InClassRegister from "./Register/InClassRegister";
import InClassStudent from "./Student/InClassStudent";
import InClassFaculty from "./Faculty/InClassFaculty";

function App() {
  return (
    <div className="app-main-content">
      <Routes>
        {/* <Route path="/" element={<InClassHomepage />} />/ */}
        {/* <Route path="/login" element={<InClassLogin />} /> */}
        {/* <Route path="/register" element={<InClassRegister />} /> */}
        <Route path="/" element={<InClassStudent />} />
        {/* <Route path="/" element={<InClassFaculty />} /> */}
      </Routes>
    </div>
  );
}

export default App;

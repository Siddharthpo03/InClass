import React from "react";
import { Routes, Route } from "react-router-dom";

// Import pages from standard pages folder
import Homepage from "./pages/Homepage";
import InClassLogin from "./pages/Login/InClassLogin";
import InClassRegister from "./pages/Register/InClassRegister";
import OnboardBiometrics from "./pages/Onboard/OnboardBiometrics";
import InClassStudent from "./pages/Student/InClassStudent";
import InClassFaculty from "./pages/Faculty/InClassFaculty";
import InClassAdmin from "./pages/Admin/InClassAdmin";
import InClassForgotPass from "./pages/ForgotPass/InClassForgotPass";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Report from "./pages/Report";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Careers from "./pages/Careers";
import CookieDeclaration from "./pages/CookieDeclaration";
import JobApplication from "./pages/JobApplication";
import HelpCenter from "./pages/HelpCenter";
import Documentation from "./pages/Documentation";
import Blog from "./pages/Blog";
import Developers from "./pages/Developers";
import Support from "./pages/Support";
import Newsletter from "./pages/Newsletter";
import SocialMedia from "./pages/SocialMedia";
import Accessibility from "./pages/Accessibility";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import CookieConsent from "./components/CookieConsent";

function App() {
  return (
    <div className="app-main-content">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<InClassLogin />} />
        <Route path="/register" element={<InClassRegister />} />
        <Route path="/onboard/biometrics" element={<OnboardBiometrics />} />
        <Route path="/student/dashboard" element={<InClassStudent />} />
        <Route path="/faculty/dashboard" element={<InClassFaculty />} />
        <Route path="/admin/dashboard" element={<InClassAdmin />} />
        <Route path="/forgot" element={<InClassForgotPass />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/report" element={<Report />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/cookies" element={<CookieDeclaration />} />
        <Route path="/apply" element={<JobApplication />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/support" element={<Support />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/social" element={<SocialMedia />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/guidelines" element={<CommunityGuidelines />} />
      </Routes>
      <CookieConsent />
    </div>
  );
}

export default App;

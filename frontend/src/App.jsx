import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import LoadingSpinner from "./components/shared/LoadingSpinner";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages for better performance
const Homepage = lazy(() => import("./pages/Homepage"));
const InClassLogin = lazy(() => import("./pages/Login/InClassLogin"));
const InClassRegister = lazy(() => import("./pages/Register/InClassRegister"));
const OnboardBiometrics = lazy(() =>
  import("./pages/Onboard/OnboardBiometrics")
);
const InClassStudent = lazy(() => import("./pages/Student/InClassStudent"));
const InClassFaculty = lazy(() => import("./pages/Faculty/InClassFaculty"));
const InClassAdmin = lazy(() => import("./pages/Admin/InClassAdmin"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin"));
const InClassForgotPass = lazy(() =>
  import("./pages/ForgotPass/InClassForgotPass")
);
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Contact = lazy(() => import("./pages/Contact"));
const Report = lazy(() => import("./pages/Report"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Careers = lazy(() => import("./pages/Careers"));
const CookieDeclaration = lazy(() => import("./pages/CookieDeclaration"));
const JobApplication = lazy(() => import("./pages/JobApplication"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Blog = lazy(() => import("./pages/Blog"));
const Developers = lazy(() => import("./pages/Developers"));
const Support = lazy(() => import("./pages/Support"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Preview = lazy(() => import("./pages/Preview"));

// Lazy load new faculty pages
const FacultyCourses = lazy(() => import("./pages/Faculty/FacultyCourses"));
const CourseDetail = lazy(() => import("./pages/Faculty/CourseDetail"));
const SessionsList = lazy(() => import("./pages/Faculty/SessionsList"));
const SessionMonitor = lazy(() => import("./pages/Faculty/SessionMonitor"));
const ProfileEdit = lazy(() => import("./pages/Faculty/ProfileEdit"));
const BiometricOnboard = lazy(() => import("./pages/Faculty/BiometricOnboard"));

// Lazy load new student pages
const CourseRegistration = lazy(() =>
  import("./pages/Student/CourseRegistration")
);

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <div className="app-main-content">
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route
              path="/login"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <InClassLogin />
                </ErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <InClassRegister />
                </ErrorBoundary>
              }
            />
            <Route
              path="/onboard/biometrics"
              element={
                <ErrorBoundary
                  fallbackTitle="Face setup failed"
                  fallbackMessage="Camera or face verification failed. Please check permissions and try again."
                >
                  <OnboardBiometrics />
                </ErrorBoundary>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ErrorBoundary
                  fallbackMessage="Something went wrong. Please refresh the page."
                  homeUrl="/student/dashboard"
                >
                  <InClassStudent />
                </ErrorBoundary>
              }
            />
            <Route path="/preview/student" element={<InClassStudent previewMode />} />
            <Route
              path="/student/register-courses"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <CourseRegistration />
                </ErrorBoundary>
              }
            />
            <Route path="/faculty/dashboard" element={<InClassFaculty />} />
            <Route path="/preview/faculty" element={<InClassFaculty previewMode />} />
            <Route
              path="/faculty/onboard"
              element={
                <ErrorBoundary
                  fallbackTitle="Face setup failed"
                  fallbackMessage="Camera or face verification failed. Please check permissions and try again."
                >
                  <BiometricOnboard />
                </ErrorBoundary>
              }
            />
            <Route path="/faculty/courses" element={<FacultyCourses />} />
            <Route
              path="/faculty/courses/:courseId"
              element={<CourseDetail />}
            />
            <Route path="/faculty/sessions" element={<SessionsList />} />
            <Route
              path="/faculty/sessions/:sessionId"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <SessionMonitor />
                </ErrorBoundary>
              }
            />
            <Route path="/faculty/profile" element={<ProfileEdit />} />
            <Route
              path="/admin/dashboard"
              element={
                <ErrorBoundary
                  fallbackMessage="Something went wrong. Please refresh the page."
                  homeUrl="/admin/dashboard"
                >
                  <AdminDashboard />
                </ErrorBoundary>
              }
            />
            <Route path="/preview/admin" element={<AdminDashboard previewMode />} />
            <Route
              path="/inclass/admin/login"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <AdminLogin />
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/old"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <InClassAdmin />
                </ErrorBoundary>
              }
            />
            <Route
              path="/forgot"
              element={
                <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
                  <InClassForgotPass />
                </ErrorBoundary>
              }
            />
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
            <Route path="/preview" element={<Preview />} />
          </Routes>
        </Suspense>
        <CookieConsent />
      </div>
    </ErrorBoundary>
  );
}

export default App;

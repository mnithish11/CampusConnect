import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import "./App.css";
import VerifyEmail from "./pages/VerifyEmail";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import StudentProfile from "./pages/StudentProfile";
import Connections from "./pages/Connections";

import {
  ArrowRight,
  Globe2,
  GraduationCap,
  Lightbulb,
  Moon,
  Sun,
  Users,
  Code2,
  Rocket,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

type Theme = "light" | "dark";

function LandingPage() {
  const [theme, setTheme] = useState<Theme>(() => {
    return localStorage.getItem("campusconnect-theme") === "dark"
      ? "dark"
      : "light";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("campusconnect-theme", theme);
  }, [theme]);

  return (
    <main className={`app ${theme}`}>
      <header className="navbar">
        <a href="/" className="brand">
          <span className="brand-icon">
            <GraduationCap size={30} strokeWidth={2.5} />
          </span>
          <span>CampusConnect</span>
        </a>

        <nav className={mobileMenuOpen ? "nav-links open" : "nav-links"}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>
            Home
          </a>

          <a href="#features" onClick={() => setMobileMenuOpen(false)}>
            Features
          </a>

          <a href="#communities" onClick={() => setMobileMenuOpen(false)}>
            Communities
          </a>

          <a href="#hackathons" onClick={() => setMobileMenuOpen(false)}>
            Hackathons
          </a>

          <a href="#about" onClick={() => setMobileMenuOpen(false)}>
            About
          </a>
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === "light" ? "dark" : "light")
            }
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
            title="Switch theme"
          >
            {theme === "light" ? (
              <Moon size={19} />
            ) : (
              <Sun size={19} />
            )}
          </button>

          <a className="login-link" href="/login">
            Log in
          </a>

          <a className="button button-yellow nav-signup" href="/signup">
            Sign Up
          </a>

          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}

      <section className="hero panel" id="home">
        <div className="hero-copy">
          <span className="eyebrow">
            <Globe2 size={15} />
            GLOBAL STUDENT COMMUNITY
          </span>

          <h1>
            YOUR CAMPUS
            <br />
            IS JUST THE
            <br />
            <span className="highlight">BEGINNING.</span>
          </h1>

          <p className="hero-description">
            Connect with students worldwide, collaborate on projects,
            discover hackathons, and turn your ideas into reality.
          </p>

          <div className="hero-actions">
            <a href="/signup" className="button button-yellow">
              Join CampusConnect <ArrowRight size={19} />
            </a>

            <a href="#features" className="button button-outline">
              Explore Projects
            </a>
          </div>

          <div className="hero-social-proof">
            <div className="avatar-stack">
              <span>👨🏻‍💻</span>
              <span>👩🏽‍🎓</span>
              <span>👨🏾‍🎨</span>
              <span>👩🏻‍💻</span>
            </div>

            <span>One world. Thousands of possibilities.</span>
          </div>
        </div>

        {/* GLOBE ILLUSTRATION */}

        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="globe">
            <span className="continent continent-one" />
            <span className="continent continent-two" />
            <span className="continent continent-three" />

            <span className="globe-latitude" />
            <span className="globe-longitude" />
            <span className="globe-longitude globe-longitude-two" />
          </div>

          <div className="floating-card student-card student-one">
            <span className="student-emoji blue">👨🏻‍💻</span>

            <div>
              <strong>Alex Morgan</strong>
              <small>Computer Science</small>
            </div>

            <span className="online-dot" />
          </div>

          <div className="floating-card student-card student-two">
            <span className="student-emoji pink">👩🏽‍🎓</span>

            <div>
              <strong>Sophia Lee</strong>
              <small>UI/UX Designer</small>
            </div>

            <span className="online-dot" />
          </div>

          <div className="floating-card student-card student-three">
            <span className="student-emoji orange">👩🏻‍💻</span>

            <div>
              <strong>Maya Patel</strong>
              <small>AI Enthusiast</small>
            </div>
          </div>

          <div className="floating-label label-project">
            <Code2 size={18} />
            Build Projects
          </div>

          <div className="floating-label label-team">
            <Users size={18} />
            Find Teammates
          </div>

          <div className="floating-label label-hackathon">
            <Rocket size={18} />
            Explore Hackathons
          </div>

          <div className="floating-sticker sticker-bulb">
            <Lightbulb size={27} />
          </div>

          <div className="floating-sticker sticker-sparkle">
            <Sparkles size={23} />
          </div>

          <span className="doodle doodle-one">✳</span>
          <span className="doodle doodle-two">✦</span>
          <span className="doodle doodle-three">✧</span>
        </div>
      </section>

      {/* FEATURES SECTION */}

      <section className="features-section" id="features">
        <div className="section-heading">
          <span className="eyebrow">
            <Sparkles size={15} /> MADE FOR STUDENTS
          </span>

          <h2>Your next big thing starts here.</h2>

          <p>Everything you need to learn, build, and connect.</p>
        </div>

        <div className="feature-grid">
          <article className="feature-card lavender">
            <div className="feature-icon">
              <Users size={25} />
            </div>

            <h3>Discover Students</h3>

            <p>
              Find talented teammates from universities around the world.
            </p>

            <a href="/signup">
              Find your people <ArrowRight size={17} />
            </a>
          </article>

          <article className="feature-card yellow">
            <div className="feature-icon">
              <Code2 size={25} />
            </div>

            <h3>Explore Projects</h3>

            <p>
              Share ideas, build together, and show off what you create.
            </p>

            <a href="/signup">
              Start building <ArrowRight size={17} />
            </a>
          </article>

          <article className="feature-card pink">
            <div className="feature-icon">
              <Rocket size={25} />
            </div>

            <h3>Hackathons</h3>

            <p>
              Find opportunities to compete, experiment, and win.
            </p>

            <a href="#hackathons">
              Find opportunities <ArrowRight size={17} />
            </a>
          </article>

          <article className="feature-card mint" id="communities">
            <div className="feature-icon">
              <Globe2 size={25} />
            </div>

            <h3>Communities</h3>

            <p>
              Join conversations with students who share your interests.
            </p>

            <a href="/signup">
              Join a community <ArrowRight size={17} />
            </a>
          </article>
        </div>
      </section>

      {/* BOTTOM CALL TO ACTION */}

      <section className="bottom-cta panel" id="about">
        <div>
          <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>

          <h2>Your campus is just the beginning.</h2>

          <p>Meet your people. Build your ideas. Make your mark.</p>
        </div>

        <a href="/signup" className="button button-yellow">
          Join the community <ArrowRight size={19} />
        </a>
      </section>

      {/* FOOTER */}

      <footer className="footer" id="hackathons">
        <a href="/" className="brand">
          <GraduationCap size={25} />
          CampusConnect
        </a>

        <p>Built for students. Connected by possibilities. 🌍</p>

        <span>© 2026 CampusConnect</span>
      </footer>
    </main>
  );
}

/* APPLICATION ROUTES */

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/connections" element={<Connections />} />
    </Routes>
  );
}

export default App;
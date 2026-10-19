import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  GraduationCap,
  MapPin,
  Globe2,
  Code2,
  Trophy,
  Sparkles,
  Users,
  Mail,
  Pencil,
  Check,
  BriefcaseBusiness,
  ExternalLink,
} from "lucide-react";

type StudentProfileData = {
  fullName?: string;
  university?: string;
  degree?: string;
  branch?: string;
  year?: string;
  country?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  github?: string;
  linkedin?: string;
};



const projects = [
  {
    title: "AI Study Assistant",
    description:
      "An AI-powered learning assistant that helps students organize notes and understand complex topics.",
    tags: ["Python", "AI/ML"],
    color: "profile-project-lavender",
    icon: Sparkles,
  },
  {
    title: "Campus Connect",
    description:
      "A community platform that helps students connect, collaborate, and discover opportunities.",
    tags: ["React", "TypeScript"],
    color: "profile-project-mint",
    icon: Globe2,
  },
  {
    title: "Developer Portfolio",
    description:
      "A personal portfolio showcasing projects, technical skills, and achievements.",
    tags: ["HTML", "CSS"],
    color: "profile-project-pink",
    icon: Code2,
  },
];

function getSavedProfile(): StudentProfileData {
  try {
    const saved = localStorage.getItem("campusconnect-profile");

    if (saved) {
      const parsed = JSON.parse(saved) as StudentProfileData;

      return {
        ...parsed,
        skills: Array.isArray(parsed.skills)
          ? parsed.skills
          : [],
        interests: Array.isArray(parsed.interests)
          ? parsed.interests
          : [],
      };
    }
  } catch (error) {
    console.error("Unable to load student profile:", error);
  }

  return {};
}

function formatYear(year?: string): string {
  if (!year) return "Year not specified";

  const yearLabels: Record<string, string> = {
    "1": "1st Year",
    "2": "2nd Year",
    "3": "3rd Year",
    "4": "4th Year",
    "5+": "5th Year or Above",
    Postgraduate: "Postgraduate",
  };

  return yearLabels[year] ?? year;
}

export default function StudentProfile() {
  const [profile] = useState<StudentProfileData>(getSavedProfile);

  const [connected, setConnected] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const name = profile.fullName?.trim() || "Your Name";

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "YN";

  const university =
    profile.university?.trim() || "Add your university";

  const degree =
    profile.degree && profile.branch
      ? `${profile.degree} ${profile.branch}`
      : profile.degree || profile.branch || "Degree not specified";

  const year = formatYear(profile.year);

  const country = profile.country?.trim() || "Country not specified";

  const skills = profile.skills ?? [];
  const interests = profile.interests ?? [];

  const bio =
    profile.bio?.trim() ||
    "This student hasn't added a bio yet. Tell the community about your interests and what you love building!";

  const username = `@${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "student"}`;

  return (
    <main className="student-profile-page">
      <header className="student-profile-header">
        <Link to="/dashboard" className="student-profile-brand">
          <span className="student-profile-brand-icon">
            <GraduationCap size={24} />
          </span>

          <span>
            CAMPUS<span>CONNECT</span>
          </span>
        </Link>

        <div className="student-profile-header-actions">
          <Link to="/discover" className="student-profile-back">
            <ArrowLeft size={17} />
            Discover Students
          </Link>

          <Link
            to="/profile-setup"
            className="student-profile-edit"
          >
            <Pencil size={15} />
            Edit profile
          </Link>
        </div>
      </header>

      <div className="student-profile-content">
        <div className="student-profile-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Student Profile</span>
        </div>

        {/* Profile header */}
        <section className="student-profile-hero">
          <div className="student-profile-cover">
            <div className="profile-cover-decoration cover-decoration-one">
              ✳
            </div>

            <div className="profile-cover-decoration cover-decoration-two">
              +
            </div>

            <div className="profile-cover-label">
              STUDENT OF THE WORLD 🌎
            </div>
          </div>

          <div className="student-profile-main">
            <div className="student-profile-avatar">
              {initials}
              <span className="student-profile-online" />
            </div>

            <div className="student-profile-actions">
              <button
                className={`student-profile-connect ${
                  connected ? "is-connected" : ""
                }`}
                onClick={() => setConnected(!connected)}
              >
                {connected ? (
                  <Check size={17} />
                ) : (
                  <Users size={17} />
                )}

                {connected ? "Connected" : "Connect"}
              </button>

              <button
                className="student-profile-message"
                onClick={() => setShowEmail(!showEmail)}
              >
                <Mail size={17} />
                {showEmail ? "Hide contact" : "Contact"}
              </button>
            </div>

            <div className="student-profile-identity">
              <div className="student-profile-name-row">
                <h1>{name}</h1>

                <span className="student-profile-badge">
                  <Sparkles size={13} />
                  STUDENT
                </span>
              </div>

              <p className="student-profile-username">
                {username}
              </p>

              <p className="student-profile-bio">{bio}</p>

              {showEmail && (
                <div className="student-profile-contact-note">
                  <Mail size={17} />
                  Messaging and email contact will be available
                  when the CampusConnect backend is connected.
                </div>
              )}

              <div className="student-profile-meta">
                <span>
                  <GraduationCap size={17} />
                  {university}
                </span>

                <span>
                  <MapPin size={17} />
                  {country}
                </span>

                <span>
                  <Globe2 size={17} />
                  Open to global connections
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main profile layout */}
        <div className="student-profile-layout">
          <div className="student-profile-main-column">
            {/* About */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    A LITTLE ABOUT ME
                  </span>

                  <h2>About me.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-lavender">
                  <Sparkles size={22} />
                </span>
              </div>

              <p className="student-profile-about-text">
                I'm a {year.toLowerCase()} student pursuing {degree} at{" "}
                {university}. I'm passionate about technology, building
                meaningful projects, and learning from students around
                the world.
              </p>

              <p className="student-profile-about-text">
                {bio}
              </p>
            </section>

            {/* Projects */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    THINGS I'VE BUILT
                  </span>

                  <h2>Featured projects.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-mint">
                  <Code2 size={22} />
                </span>
              </div>

              <div className="student-profile-projects">
                {projects.map((project, index) => {
                  const ProjectIcon = project.icon;

                  return (
                    <article
                      className={`student-profile-project ${project.color}`}
                      key={project.title}
                    >
                      <div className="student-profile-project-top">
                        <span className="student-profile-project-number">
                          0{index + 1}
                        </span>

                        <ProjectIcon size={25} />
                      </div>

                      <h3>{project.title}</h3>

                      <p>{project.description}</p>

                      <div className="student-profile-project-tags">
                        {project.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>

                      <button
                        className="student-profile-project-link"
                        onClick={() =>
                          window.alert(
                            "Project links will be available when real project URLs are added.",
                          )
                        }
                      >
                        View project <ArrowUpRight size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Interests */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    WHAT I'M INTO
                  </span>

                  <h2>Interests.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-pink">
                  <Sparkles size={22} />
                </span>
              </div>

              {interests.length > 0 ? (
                <div className="student-profile-interests">
                  {interests.map((interest, index) => (
                    <span
                      key={interest}
                      className={`profile-interest interest-${index % 4}`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="student-profile-about-text">
                  No interests added yet. Edit your profile to select
                  the topics you enjoy.
                </p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="student-profile-side-column">
            {/* Education */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    MY JOURNEY
                  </span>

                  <h2>Education.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-yellow">
                  <GraduationCap size={22} />
                </span>
              </div>

              <div className="student-profile-education">
                <div className="student-profile-education-icon">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <h3>{university}</h3>
                  <p>{degree}</p>
                  <span>{year}</span>
                </div>
              </div>
            </section>

            {/* Skills */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    MY TOOLKIT
                  </span>

                  <h2>Skills.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-mint">
                  <Code2 size={22} />
                </span>
              </div>

              {skills.length > 0 ? (
                <div className="student-profile-skills">
                  {skills.map((skill, index) => (
                    <span
                      key={skill}
                      className={`profile-skill profile-skill-${index % 4}`}
                    >
                      <Code2 size={14} />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="student-profile-about-text">
                  No skills added yet. Edit your profile to add your
                  technical skills.
                </p>
              )}
            </section>

            {/* Social links */}
            <section className="student-profile-panel">
              <div className="student-profile-panel-heading">
                <div>
                  <span className="student-profile-eyebrow">
                    FIND ME ONLINE
                  </span>

                  <h2>Socials.</h2>
                </div>

                <span className="student-profile-heading-icon profile-icon-pink">
                  <Globe2 size={22} />
                </span>
              </div>

              <div className="student-profile-socials">
                <a
                  href={
                    profile.github?.trim() || "https://github.com/"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="profile-social-letter">GH</span>

                  <span>
                    <strong>GitHub</strong>
                    <small>Projects &amp; code</small>
                  </span>

                  <ExternalLink size={15} />
                </a>

                <a
                  href={
                    profile.linkedin?.trim() ||
                    "https://www.linkedin.com/"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="profile-social-letter">in</span>

                  <span>
                    <strong>LinkedIn</strong>
                    <small>Professional profile</small>
                  </span>

                  <ExternalLink size={15} />
                </a>
              </div>
            </section>

            {/* Opportunities */}
            <section className="student-profile-opportunity">
              <div className="student-profile-opportunity-icon">
                <Trophy size={24} />
              </div>

              <span>YOUR NEXT BIG THING</span>

              <h3>
                Great ideas start with great people.
              </h3>

              <p>
                Meet students who share your interests and build
                something awesome together.
              </p>

              <Link to="/discover">
                Find your people <ArrowUpRight size={17} />
              </Link>
            </section>
          </aside>
        </div>

        {/* Footer call to action */}
        <div className="student-profile-footer-cta">
          <BriefcaseBusiness size={23} />

          <div>
            <h3>Keep building. Keep connecting.</h3>

            <p>
              Your next opportunity could be one conversation away.
            </p>
          </div>

          <Link to="/discover">
            Explore community <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>

      <footer className="student-profile-footer">
        <span>© 2026 CAMPUSCONNECT</span>

        <span>BUILT FOR STUDENTS, EVERYWHERE. 🌎</span>
      </footer>
    </main>
  );
}
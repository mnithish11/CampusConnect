import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Globe2,
  Code2,
  Trophy,
  MessageCircle,
  Settings,
  Search,
  Bell,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Menu,
  X,
  LogOut,
  Plus,
  CalendarDays,
  Hash,
  Flame,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://localhost:5001";

type StudentProfile = {
  fullName?: string;
  university?: string;
  degree?: string;
  branch?: string;
  year?: string;
  country?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
};

type SavedUser = {
  id: string;
  name: string;
  email: string;
  university: string;
};

type ApiStudentProfile = {
  id: string;
  userId: string;
  degree: string;
  branch: string;
  year: string;
  country: string;
  bio: string;
  skills: string[];
  interests: string[];
  user: {
    id: string;
    name: string;
    email: string;
    university: string;
  };
};

type StudentCardData = {
  id: string;
  name: string;
  university: string;
  country: string;
  branch: string;
  skills: string[];
  avatar: string;
  color: string;
};

type ProfilesResponse = {
  success?: boolean;
  totalProfiles?: number;
  profiles?: unknown[];
  message?: string;
};

type MyProfileResponse = {
  success?: boolean;
  profile?: ApiStudentProfile | null;
  message?: string;
};

const studentColors = [
  "student-lavender",
  "student-pink",
  "student-mint",
  "student-sky",
];

const activities = [
  {
    icon: Code2,
    title: "AI Study Buddy",
    description: "A team is looking for a frontend developer.",
    time: "12 min ago",
    color: "activity-purple",
  },
  {
    icon: Trophy,
    title: "Global Hack Week",
    description: "Registration is open for student teams.",
    time: "1 hour ago",
    color: "activity-yellow",
  },
  {
    icon: Users,
    title: "Developers Worldwide",
    description: "A new discussion has started in the community.",
    time: "3 hours ago",
    color: "activity-pink",
  },
];

function readSavedUser(): SavedUser | null {
  try {
    const rawUser = localStorage.getItem("campusconnect-user");

    if (!rawUser) {
      return null;
    }

    const user = JSON.parse(rawUser) as Partial<SavedUser>;

    if (
      typeof user.id !== "string" ||
      typeof user.name !== "string"
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      university: user.university ?? "",
    };
  } catch (error) {
    console.error("Unable to load logged-in user:", error);
    return null;
  }
}

function createStudentCard(
  profile: ApiStudentProfile,
): StudentCardData {
  const name = profile.user.name || "Student";

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const colorIndex =
    profile.user.id
      .split("")
      .reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
      ) % studentColors.length;

  return {
    id: profile.user.id,
    name,
    university:
      profile.user.university || "University not specified",
    country: profile.country || "Location not specified",
    branch: profile.branch || profile.degree || "Student",
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    avatar: initials || "S",
    color: studentColors[colorIndex],
  };
}

function extractProfiles(data: unknown): ApiStudentProfile[] {
  let rawProfiles: unknown;

  if (Array.isArray(data)) {
    rawProfiles = data;
  } else if (
    typeof data === "object" &&
    data !== null &&
    "profiles" in data &&
    Array.isArray((data as ProfilesResponse).profiles)
  ) {
    rawProfiles = (data as ProfilesResponse).profiles;
  } else {
    throw new Error("Unexpected response from the profiles API.");
  }

  return (rawProfiles as unknown[]).filter(
    (item): item is ApiStudentProfile => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      if (!("user" in item)) {
        return false;
      }

      const user = item.user;

      return (
        typeof user === "object" &&
        user !== null &&
        "id" in user &&
        typeof user.id === "string" &&
        "name" in user &&
        typeof user.name === "string"
      );
    },
  );
}

function toStudentProfile(
  profile: ApiStudentProfile,
): StudentProfile {
  return {
    fullName: profile.user.name,
    university: profile.user.university,
    degree: profile.degree,
    branch: profile.branch,
    year: profile.year,
    country: profile.country,
    bio: profile.bio,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    interests: Array.isArray(profile.interests)
      ? profile.interests
      : [],
  };
}

function getApiError(
  data: unknown,
  fallback: string,
): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] =
    useState<SavedUser | null>(() => readSavedUser());

  const [profile, setProfile] = useState<StudentProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [students, setStudents] = useState<StudentCardData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Temporary UI-only connections.
  // These are not yet persisted in the database.
  const [connectedStudents, setConnectedStudents] = useState<string[]>(
    [],
  );

  const firstName =
    currentUser?.name.trim().split(/\s+/)[0] || "Student";

  // Fetch only the profile belonging to the currently logged-in user.
  const fetchMyProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setProfile({});
      setLoadingProfile(false);
      setProfileError("Please log in to view your profile.");
      return;
    }

    setLoadingProfile(true);
    setProfileError("");

    try {
      const response = await fetch(`${API_URL}/api/profiles/me`, {
        headers: {
          "x-user-id": currentUser.id,
        },
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Unable to load your profile."),
        );
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("profile" in data)
      ) {
        throw new Error("Unexpected profile response from server.");
      }

      const result = (data as MyProfileResponse).profile;

      if (!result) {
        setProfile({});
        setProfileError("Complete your profile to get started.");
        return;
      }

      // Critical check: never display a profile with another user's ID.
      if (
        result.userId !== currentUser.id ||
        result.user.id !== currentUser.id
      ) {
        throw new Error(
          "The returned profile does not match the logged-in user. Please log out and log in again.",
        );
      }

      const ownProfile = toStudentProfile(result);

      setProfile(ownProfile);

      // Cache the current user's profile only.
      localStorage.setItem(
        "campusconnect-profile",
        JSON.stringify(ownProfile),
      );

      localStorage.setItem(
        "campusconnect-profile-user-id",
        currentUser.id,
      );
    } catch (error) {
      console.error("Unable to load your profile:", error);

      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser]);


  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsError("");

    try {
      const response = await fetch(`${API_URL}/api/profiles`);
      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Unable to load student profiles."),
        );
      }

      const profiles = extractProfiles(data);

      const otherStudents = profiles
        .filter(
          (student) => student.user.id !== currentUser?.id,
        )
        .map(createStudentCard);

      setStudents(otherStudents);
    } catch (error) {
      console.error("Unable to fetch student profiles:", error);

      setStudentsError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setLoadingStudents(false);
    }
  }, [currentUser?.id]);
  // Load dashboard data whenever the logged-in account changes.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!currentUser?.id) {
        setProfile({});
        setStudents([]);
        setConnectedStudents([]);
        setLoadingProfile(false);
        setLoadingStudents(false);
        navigate("/login", { replace: true });
        return;
      }

      try {
        await Promise.all([
          fetchMyProfile(),
          fetchStudents(),
          (async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/connections/sent?userId=${encodeURIComponent(
                  currentUser.id,
                )}`,
              );

              const data: unknown = await response.json();

              if (!response.ok) {
                throw new Error(
                  "Unable to load sent connection requests.",
                );
              }

              if (
                typeof data !== "object" ||
                data === null ||
                !("requests" in data) ||
                !Array.isArray(data.requests)
              ) {
                throw new Error(
                  "Unexpected connection requests response.",
                );
              }

              const requestedStudentIds = data.requests
                .filter(
                  (request): request is {
                    receiverId: string;
                    status: string;
                  } =>
                    typeof request === "object" &&
                    request !== null &&
                    "receiverId" in request &&
                    typeof request.receiverId === "string" &&
                    "status" in request &&
                    request.status === "PENDING",
                )
                .map((request) => request.receiverId);

              if (!cancelled) {
                setConnectedStudents(requestedStudentIds);
              }
            } catch (error) {
              if (!cancelled) {
                console.error(
                  "Unable to load sent requests:",
                  error,
                );
              }
            }
          })(),
        ]);
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load dashboard:", error);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    currentUser?.id,
    fetchMyProfile,
    fetchStudents,
    navigate,
  ]);

  // Keep account state in sync if another browser tab changes login.
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === "campusconnect-user") {
        setCurrentUser(readSavedUser());
        setConnectedStudents([]);
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Refresh profile details when returning to this tab.
  useEffect(() => {
    function handleWindowFocus() {
      const savedUser = readSavedUser();

      if (savedUser?.id !== currentUser?.id) {
        setCurrentUser(savedUser);
      }
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [currentUser?.id]);

  const searchText = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(searchText) ||
      student.university.toLowerCase().includes(searchText) ||
      student.country.toLowerCase().includes(searchText) ||
      student.branch.toLowerCase().includes(searchText) ||
      student.skills.some((skill) =>
        skill.toLowerCase().includes(searchText),
      )
    );
  });

  function handleNavigation(label: string, path: string) {
    setActiveNav(label);
    setMobileMenuOpen(false);

    if (path !== "#") {
      navigate(path);
    } else {
      window.alert(`${label} will be available soon.`);
    }
  }

  async function handleConnect(studentId: string) {
  if (!currentUser?.id) {
    navigate("/login", { replace: true });
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: studentId,
      }),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : "Unable to send the connection request.";

      throw new Error(message);
    }

    window.alert("Connection request sent successfully!");

    setConnectedStudents((current) =>
      current.includes(studentId)
        ? current
        : [...current, studentId],
    );
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Unable to send the connection request.",
    );
  }
}

  function handleLogout() {
    localStorage.removeItem("campusconnect-user");
    localStorage.removeItem("campusconnect-profile");
    localStorage.removeItem("campusconnect-profile-user-id");

    setCurrentUser(null);
    setProfile({});
    setConnectedStudents([]);

    navigate("/login", { replace: true });
  }

  const navigation = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Discover Students",
      icon: Users,
      path: "/discover",
    },
    { label: "Communities", icon: Globe2, path: "#" },
    { label: "Projects", icon: Code2, path: "#" },
    { label: "Hackathons", icon: Trophy, path: "#" },
    { label: "Messages", icon: MessageCircle, path: "#" },
  ];

  return (
    <main className="dashboard-app">
      {mobileMenuOpen && (
        <button
          className="dashboard-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-icon">
            <GraduationCap size={25} strokeWidth={2.5} />
          </span>

          <span>
            Campus<span>Connect</span>
          </span>
        </Link>

        <div className="sidebar-section-label">YOUR SPACE</div>

        <nav className="dashboard-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`dashboard-nav-item ${
                  activeNav === item.label ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigation(item.label, item.path)
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.label === "Messages" && (
                  <span className="nav-count">2</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-community-card">
          <div className="sidebar-community-icon">
            <Sparkles size={20} />
          </div>

          <strong>Big ideas start together.</strong>

          <p>Find your people and build something amazing.</p>

          <button onClick={() => navigate("/discover")}>
            Find teammates <ArrowRight size={15} />
          </button>
        </div>

        <div className="dashboard-sidebar-bottom">
          <button
            className="dashboard-nav-item"
            onClick={() => handleNavigation("Settings", "#")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className="dashboard-profile-mini"
            onClick={() => navigate("/profile-setup")}
          >
            <span className="mini-avatar">
              {firstName.charAt(0).toUpperCase()}
            </span>

            <span className="mini-profile-text">
              <strong>
                {profile.fullName ||
                  currentUser?.name ||
                  "Your Profile"}
              </strong>

              <small>
                {profile.university ||
                  currentUser?.university ||
                  "Add your university"}
              </small>
            </span>

            <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="dashboard-breadcrumb">
            Your space <span>/</span> <strong>{activeNav}</strong>
          </div>

          <div className="dashboard-topbar-actions">
            <button
              className="dashboard-icon-button"
              aria-label="Notifications"
              onClick={() =>
                window.alert("Notifications will be available soon.")
              }
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <button
              className="dashboard-top-avatar"
              onClick={() => navigate("/profile-setup")}
              aria-label="Open profile"
            >
              {firstName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">
                <Sparkles size={15} /> YOUR GLOBAL CAMPUS
              </span>

              <h1>
                Hey, {firstName}
                <span>!</span> 👋
              </h1>

              <p>
                Your next great connection could be one click away.
              </p>

              {(profile.university ||
                profile.branch ||
                profile.country) && (
                <div className="dashboard-user-meta">
                  {profile.university && (
                    <span>
                      <GraduationCap size={15} />
                      {profile.university}
                    </span>
                  )}

                  {profile.branch && (
                    <span>
                      <Hash size={15} />
                      {profile.branch}
                    </span>
                  )}

                  {profile.country && (
                    <span>
                      <MapPin size={15} />
                      {profile.country}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="welcome-orbit" />
              <div className="welcome-globe">🌍</div>
              <Sparkles className="welcome-sparkle" size={27} />
            </div>
          </section>

          <section className="dashboard-search-section">
            <div className="dashboard-search">
              <Search size={20} />

              <input
                type="search"
                placeholder="Search students, skills, universities..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search students"
              />

              <span className="search-shortcut">⌘ K</span>
            </div>

            <button
              className="dashboard-create-button"
              onClick={() =>
                window.alert("Project creation will be added soon.")
              }
            >
              <Plus size={18} /> Create
            </button>
          </section>

          <section className="dashboard-stats">
            <article className="dashboard-stat-card stat-yellow">
              <span className="stat-icon">
                <Users size={22} />
              </span>

              <span className="stat-label">Connections</span>
              <strong>{connectedStudents.length}</strong>
              <small>Students you've connected with</small>
            </article>

            <article className="dashboard-stat-card stat-purple">
              <span className="stat-icon">
                <Code2 size={22} />
              </span>

              <span className="stat-label">Your skills</span>
              <strong>
                {loadingProfile ? "…" : profile.skills?.length || 0}
              </strong>
              <small>Skills on your profile</small>
            </article>

            <article className="dashboard-stat-card stat-pink">
              <span className="stat-icon">
                <Flame size={22} />
              </span>

              <span className="stat-label">Your interests</span>
              <strong>
                {loadingProfile
                  ? "…"
                  : profile.interests?.length || 0}
              </strong>
              <small>Things you love exploring</small>
            </article>
          </section>

          {profileError && (
            <div className="dashboard-empty-state">
              <strong>{profileError}</strong>

              <button
                className="student-connect-button"
                onClick={() => void fetchMyProfile()}
              >
                Reload my profile
              </button>
            </div>
          )}

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  <Users size={15} /> PEOPLE TO KNOW
                </span>

                <h2>Meet your people.</h2>

                <p>
                  Students who could become your next teammates.
                </p>
              </div>

              <button
                className="dashboard-text-link"
                onClick={() => navigate("/discover")}
              >
                Discover all <ArrowRight size={16} />
              </button>
            </div>

            {loadingStudents ? (
              <div className="dashboard-empty-state">
                <RefreshCw size={25} />
                <strong>Finding your people...</strong>
                <p>
                  Loading student profiles from CampusConnect.
                </p>
              </div>
            ) : studentsError ? (
              <div className="dashboard-empty-state">
                <Users size={25} />
                <strong>We couldn't load student profiles</strong>
                <p>{studentsError}</p>

                <button
                  className="student-connect-button"
                  onClick={() => void fetchStudents()}
                >
                  Try again
                </button>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="recommended-students">
                {filteredStudents.map((student) => {
                  const connected = connectedStudents.includes(student.id);

                  return (
                    <article
                      className="recommended-student"
                      key={student.id}
                    >
                      <div
                        className={`recommended-student-avatar ${student.color}`}
                      >
                        {student.avatar}
                      </div>

                      <span className="student-location">
                        <MapPin size={13} />
                        {student.country}
                      </span>

                      <h3>{student.name}</h3>

                      <p className="student-university">
                        {student.university}
                      </p>

                      <p className="student-branch">
                        {student.branch}
                      </p>

                      <div className="student-skill-list">
                        {student.skills.length > 0 ? (
                          student.skills.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))
                        ) : (
                          <span>No skills added</span>
                        )}
                      </div>

                      <button
                        className={`student-connect-button ${
                          connected ? "connected" : ""
                        }`}
                        onClick={() => handleConnect(student.id)}
                      >
                        {connected ? "Request Sent ✓" : "Connect"}
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <Users size={25} />

                <strong>
                  {searchText
                    ? "No students found"
                    : "Your campus network is just getting started"}
                </strong>

                <p>
                  {searchText
                    ? "Try searching for a different name, skill, or university."
                    : "When other students complete their profiles, they will appear here."}
                </p>

                {searchText ? (
                  <button
                    className="student-connect-button"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    className="student-connect-button"
                    onClick={() => void fetchStudents()}
                  >
                    Refresh profiles
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-panel activity-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    <Flame size={15} /> WHAT'S HAPPENING
                  </span>

                  <h2>Community pulse</h2>
                </div>

                <button
                  className="dashboard-icon-button"
                  aria-label="View community activity"
                  onClick={() =>
                    window.alert(
                      "More community activity will be added soon.",
                    )
                  }
                >
                  <ArrowUpRight size={19} />
                </button>
              </div>

              <div className="activity-list">
                {activities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      className="activity-item"
                      key={activity.title}
                    >
                      <span
                        className={`activity-icon ${activity.color}`}
                      >
                        <Icon size={19} />
                      </span>

                      <div className="activity-copy">
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                        <small>{activity.time}</small>
                      </div>

                      <ArrowUpRight
                        className="activity-arrow"
                        size={17}
                      />
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="dashboard-panel profile-progress-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    <Sparkles size={15} /> YOUR PROFILE
                  </span>

                  <h2>Make it yours.</h2>
                </div>

                <UserProfileIcon />
              </div>

              <p className="progress-description">
                A complete profile helps the right people find you.
              </p>

              {(() => {
                const completed = [
                  Boolean(profile.fullName || currentUser?.name),
                  Boolean(
                    profile.university || currentUser?.university,
                  ),
                  Boolean(profile.degree),
                  Boolean(profile.branch),
                  Boolean(profile.year),
                  Boolean(profile.country),
                  Boolean(profile.bio),
                  Boolean(profile.skills?.length),
                  Boolean(profile.interests?.length),
                ].filter(Boolean).length;

                const progress = Math.round(
                  (completed / 9) * 100,
                );

                return (
                  <>
                    <div className="profile-progress-label">
                      <strong>{progress}% complete</strong>
                      <span>{completed} of 9 items</span>
                    </div>

                    <div
                      className="profile-progress-track"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="profile-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                );
              })()}

              <button
                className="dashboard-edit-profile"
                onClick={() => navigate("/profile-setup")}
              >
                Edit your profile <ArrowRight size={17} />
              </button>
            </article>
          </section>

          <section className="dashboard-event-banner">
            <div className="event-banner-icon">
              <CalendarDays size={26} />
            </div>

            <div className="event-banner-copy">
              <span>YOUR NEXT OPPORTUNITY</span>
              <h2>Build something extraordinary.</h2>

              <p>
                Find teammates and turn your ideas into real projects.
              </p>
            </div>

            <button onClick={() => navigate("/discover")}>
              Find teammates <ArrowRight size={17} />
            </button>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 CampusConnect</span>

            <span>
              Built for students. Connected by possibilities. 🌍
            </span>

            <button onClick={handleLogout}>
              <LogOut size={14} /> Log out
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function UserProfileIcon() {
  return (
    <span className="profile-progress-icon">
      <GraduationCap size={23} />
    </span>
  );
}
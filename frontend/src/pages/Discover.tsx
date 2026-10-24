import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Globe2,
  Code2,
  Users,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Clock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
// ==================================================
// TYPES
// ==================================================

type Student = {
  id: string;
  name: string;
  initials: string;
  university: string;
  branch: string;
  country: string;
  year: string;
  bio: string;
  skills: string[];
  interests: string[];
  color: string;
};

type SavedUser = {
  id: string;
  name: string;
  email?: string;
  university?: string;
};

type ApiStudentProfile = {
  id: string;
  userId: string;
  degree: string;
  branch: string;
  country: string;
  year: string;
  bio: string;
  skills: string[];
  interests: string[];
  user: {
    id: string;
    name: string;
    email?: string;
    university: string;
  };
};

type ConnectionRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  profiles?: unknown[];
  requests?: ConnectionRequest[];
  connections?: {
    student?: {
      id?: string;
    };
  }[];
};

type RequestState =
  | "none"
  | "pending"
  | "connected"
  | "processing";

// ==================================================
// COLORS
// ==================================================

const studentColors = [
  "lavender",
  "pink",
  "mint",
  "blue",
  "yellow",
];

// ==================================================
// HELPER FUNCTIONS
// ==================================================

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST"
  );
}

function formatYear(year?: string): string {
  if (!year) {
    return "Year not specified";
  }

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

function loadCurrentUser(): SavedUser | null {
  try {
    const saved = localStorage.getItem("campusconnect-user");

    if (!saved) {
      return null;
    }

    const user = JSON.parse(saved) as Partial<SavedUser>;

    if (
      typeof user.id !== "string" ||
      typeof user.name !== "string"
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
    };
  } catch (error) {
    console.error("Unable to load current user:", error);
    return null;
  }
}

function extractProfiles(data: unknown): ApiStudentProfile[] {
  let rawProfiles: unknown;

  if (Array.isArray(data)) {
    rawProfiles = data;
  } else if (
    typeof data === "object" &&
    data !== null &&
    "profiles" in data &&
    Array.isArray(data.profiles)
  ) {
    rawProfiles = data.profiles;
  } else {
    throw new Error(
      "The server returned an unexpected profiles response."
    );
  }

  return (rawProfiles as unknown[]).filter(
    (item): item is ApiStudentProfile => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      if (!("user" in item)) {
        return false;
      }

      const profile = item as Partial<ApiStudentProfile>;

      return (
        typeof profile.user?.id === "string" &&
        typeof profile.user?.name === "string"
      );
    }
  );
}

function createStudent(profile: ApiStudentProfile): Student {
  const name = profile.user.name || "Student";

  const colorIndex =
    profile.user.id
      .split("")
      .reduce(
        (total, character) =>
          total + character.charCodeAt(0),
        0
      ) % studentColors.length;

  return {
    id: profile.user.id,
    name,
    initials: getInitials(name),
    university:
      profile.user.university || "University not specified",
    branch:
      profile.branch || profile.degree || "Not specified",
    country: profile.country || "Country not specified",
    year: formatYear(profile.year),
    bio:
      profile.bio?.trim() ||
      "This student is building their CampusConnect profile.",
    skills: Array.isArray(profile.skills)
      ? profile.skills
      : [],
    interests: Array.isArray(profile.interests)
      ? profile.interests
      : [],
    color: studentColors[colorIndex],
  };
}

async function readApiResponse(
  response: Response
): Promise<ApiResponse> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("The server returned an invalid response.");
  }

  const result = data as ApiResponse;

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "The request failed. Please try again."
    );
  }

  return result;
}

// ==================================================
// DISCOVER PAGE
// ==================================================

export default function Discover() {
  const [currentUser] = useState<SavedUser | null>(
    loadCurrentUser
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [skill, setSkill] = useState("All Skills");

  const [requestStates, setRequestStates] = useState<
    Record<string, RequestState>
  >({});

  const [processingIds, setProcessingIds] = useState<string[]>(
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [notice, setNotice] = useState("");

  const [noticeType, setNoticeType] = useState<
    "success" | "error"
  >("success");

  // ==================================================
  // LOAD STUDENT PROFILES
  // ==================================================

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/profiles`);

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Unable to load student profiles.");
      }

      const profiles = extractProfiles(data);

      const otherStudents = profiles
        .filter(
          (profile) => profile.user.id !== currentUser?.id
        )
        .map(createStudent);

      setStudents(otherStudents);
    } catch (err) {
      console.error("Unable to fetch student profiles:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to CampusConnect."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // ==================================================
  // LOAD CONNECTION STATES
  // ==================================================

  async function loadConnectionStates(
    userId: string
  ): Promise<void> {
    const encodedUserId = encodeURIComponent(userId);

    const [sentResponse, receivedResponse, acceptedResponse] =
      await Promise.all([
        fetch(
          `${API_URL}/api/connections/sent?userId=${encodedUserId}`
        ),
        fetch(
          `${API_URL}/api/connections/requests?userId=${encodedUserId}`
        ),
        fetch(
          `${API_URL}/api/connections?userId=${encodedUserId}`
        ),
      ]);

    const [sentData, receivedData, acceptedData] =
      await Promise.all([
        readApiResponse(sentResponse),
        readApiResponse(receivedResponse),
        readApiResponse(acceptedResponse),
      ]);

    const nextStates: Record<string, RequestState> = {};

    // Requests sent by the current student.
    for (const request of sentData.requests ?? []) {
      nextStates[request.receiverId] = "pending";
    }

    // Requests received by the current student.
    for (const request of receivedData.requests ?? []) {
      nextStates[request.senderId] = "pending";
    }

    // Existing accepted connections.
    for (const connection of acceptedData.connections ?? []) {
      const connectedStudentId = connection.student?.id;

      if (connectedStudentId) {
        nextStates[connectedStudentId] = "connected";
      }
    }

    setRequestStates(nextStates);
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      await fetchStudents();

      if (cancelled || !currentUser?.id) {
        return;
      }

      try {
        await loadConnectionStates(currentUser.id);
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Unable to load connection states:",
            err
          );
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [fetchStudents, currentUser?.id]);

  // ==================================================
  // REFRESH CONNECTION STATES
  // ==================================================

  async function refreshConnectionStates(): Promise<void> {
    if (!currentUser?.id) {
      setRequestStates({});
      return;
    }

    try {
      await loadConnectionStates(currentUser.id);
    } catch (err) {
      console.error("Unable to refresh connection states:", err);
    }
  }

  // ==================================================
  // SEND CONNECTION REQUEST
  // ==================================================

  async function sendConnectionRequest(
    student: Student
  ): Promise<void> {
    if (!currentUser?.id) {
      setNoticeType("error");
      setNotice(
        "Please log in before sending connection requests."
      );
      return;
    }

    if (currentUser.id === student.id) {
      setNoticeType("error");
      setNotice("You cannot connect with yourself.");
      return;
    }

    const currentState =
      requestStates[student.id] ?? "none";

    if (
      currentState === "pending" ||
      currentState === "connected" ||
      currentState === "processing" ||
      processingIds.includes(student.id)
    ) {
      return;
    }

    setNotice("");
    setProcessingIds((previous) => [
      ...previous,
      student.id,
    ]);

    setRequestStates((previous) => ({
      ...previous,
      [student.id]: "processing",
    }));

    try {
      const response = await fetch(
        `${API_URL}/api/connections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: student.id,
          }),
        }
      );

      const data = await readApiResponse(response);

      setRequestStates((previous) => ({
        ...previous,
        [student.id]: "pending",
      }));

      setNoticeType("success");
      setNotice(
        data.message ||
          `Connection request sent to ${student.name}!`
      );
    } catch (err) {
      console.error("Unable to send connection request:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to send the connection request.";

      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("already connected")
      ) {
        await refreshConnectionStates();
      } else {
        setRequestStates((previous) => ({
          ...previous,
          [student.id]: "none",
        }));
      }

      setNoticeType("error");
      setNotice(message);
    } finally {
      setProcessingIds((previous) =>
        previous.filter((id) => id !== student.id)
      );
    }
  }

  // ==================================================
  // FILTER OPTIONS
  // ==================================================

  const countries = useMemo(
    () => [
      "All Countries",
      ...Array.from(
        new Set(students.map((student) => student.country))
      )
        .filter((item) => item !== "Country not specified")
        .sort(),
    ],
    [students]
  );

  const skills = useMemo(
    () => [
      "All Skills",
      ...Array.from(
        new Set(students.flatMap((student) => student.skills))
      ).sort(),
    ],
    [students]
  );

  // ==================================================
  // SEARCH AND FILTER
  // ==================================================

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.university,
          student.branch,
          student.country,
          student.bio,
          ...student.skills,
          ...student.interests,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCountry =
        country === "All Countries" ||
        student.country === country;

      const matchesSkill =
        skill === "All Skills" ||
        student.skills.includes(skill);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesSkill
      );
    });
  }, [students, search, country, skill]);

  // ==================================================
  // CLEAR FILTERS
  // ==================================================

  function clearFilters(): void {
    setSearch("");
    setCountry("All Countries");
    setSkill("All Skills");
  }

  // ==================================================
  // STATISTICS
  // ==================================================

  const uniqueCountries = new Set(
    students
      .map((student) => student.country)
      .filter((item) => item !== "Country not specified")
  ).size;

  const uniqueSkills = new Set(
    students.flatMap((student) => student.skills)
  ).size;

  // ==================================================
  // CONNECTION BUTTON CONTENT
  // ==================================================

  function renderConnectionButton(student: Student) {
    const state = requestStates[student.id] ?? "none";

    const processing =
      state === "processing" ||
      processingIds.includes(student.id);

    if (processing) {
      return (
        <>
          <RefreshCw
            size={17}
            className="discover-spinning"
          />
          Sending request...
        </>
      );
    }

    if (state === "connected") {
      return (
        <>
          <Check size={17} />
          Connected
        </>
      );
    }

    if (state === "pending") {
      return (
        <>
          <Clock size={17} />
          Request pending
        </>
      );
    }

    return (
      <>
        Connect with {student.name.split(" ")[0]}
        <ArrowRight size={17} />
      </>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="discover-page">
      {/* HEADER */}

      <header className="discover-header">
        <Link to="/dashboard" className="discover-brand">
          <span className="discover-brand-icon">
            <GraduationCap size={25} />
          </span>

          <span>
            CAMPUS
            <span className="discover-brand-accent">
              CONNECT
            </span>
          </span>
        </Link>

        <Link to="/dashboard" className="discover-back">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>
      </header>

      {/* MAIN CONTENT */}

      <section className="discover-content">
        <div className="discover-eyebrow">
          <Globe2 size={16} />
          YOUR WORLD, EXPANDED
        </div>

        <div className="discover-title-row">
          <div>
            <h1>
              FIND YOUR
              <br />
              <span>PEOPLE.</span>
            </h1>

            <p className="discover-subtitle">
              Great things happen when students connect.
              <br />
              Discover your next collaborator, friend, or co-founder.
            </p>
          </div>

          <div
            className="discover-illustration"
            aria-hidden="true"
          >
            <div className="discover-illustration-circle">
              <Globe2 size={65} strokeWidth={1.5} />
            </div>

            <span className="discover-sticker sticker-one">
              HELLO!
            </span>

            <span className="discover-sticker sticker-two">
              <Sparkles size={20} />
            </span>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="discover-stats">
          <div>
            <Users size={20} />
            <strong>{students.length}</strong>
            <span>Featured students</span>
          </div>

          <div>
            <Globe2 size={20} />
            <strong>{uniqueCountries}</strong>
            <span>Countries represented</span>
          </div>

          <div>
            <Code2 size={20} />
            <strong>{uniqueSkills}</strong>
            <span>Skills to explore</span>
          </div>
        </div>

        {/* DIRECTORY */}

        <section className="discover-directory">
          <div className="discover-section-heading">
            <div>
              <span className="discover-small-label">
                THE COMMUNITY
              </span>

              <h2>Meet your next teammate.</h2>
            </div>

            <span className="discover-result-count">
              {loading
                ? "LOADING..."
                : `${filteredStudents.length} STUDENT${
                    filteredStudents.length === 1 ? "" : "S"
                  }`}
            </span>
          </div>

          {/* SEARCH */}

          <div className="discover-toolbar">
            <div className="discover-search">
              <Search size={20} />

              <input
                type="search"
                placeholder="Search names, universities, skills..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search students"
              />

              {search && (
                <button
                  className="discover-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              className={`discover-filter-toggle ${
                showFilters ? "is-active" : ""
              }`}
              onClick={() =>
                setShowFilters((previous) => !previous)
              }
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
          </div>

          {/* FILTER PANEL */}

          {showFilters && (
            <div className="discover-filter-panel">
              <label>
                <span>COUNTRY</span>

                <select
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                >
                  {countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>SKILL</span>

                <select
                  value={skill}
                  onChange={(event) =>
                    setSkill(event.target.value)
                  }
                >
                  {skills.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="discover-reset"
                onClick={clearFilters}
              >
                Reset filters
              </button>
            </div>
          )}

          {/* ACTIVE FILTERS */}

          <div className="discover-active-filters">
            <button
              className={
                country === "All Countries" ? "selected" : ""
              }
              onClick={() => setCountry("All Countries")}
            >
              <Globe2 size={15} />
              All countries
            </button>

            {country !== "All Countries" && (
              <button
                className="selected"
                onClick={() => setCountry("All Countries")}
              >
                {country}
                <X size={14} />
              </button>
            )}

            {skill !== "All Skills" && (
              <button
                className="selected"
                onClick={() => setSkill("All Skills")}
              >
                {skill}
                <X size={14} />
              </button>
            )}
          </div>

          {/* FEEDBACK MESSAGE */}

          {notice && (
            <div
              role="status"
              className={`discover-notice ${
                noticeType === "success"
                  ? "discover-notice-success"
                  : "discover-notice-error"
              }`}
            >
              {noticeType === "success" ? (
                <Check size={18} />
              ) : (
                <X size={18} />
              )}

              <span>{notice}</span>

              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* LOADING, ERROR, AND STUDENT CARDS */}

          {loading ? (
            <div className="discover-empty">
              <RefreshCw
                size={35}
                className="discover-spinning"
              />

              <h3>Finding your people...</h3>

              <p>
                Loading student profiles from CampusConnect.
              </p>
            </div>
          ) : error ? (
            <div className="discover-empty">
              <Users size={35} />

              <h3>We couldn't load student profiles</h3>

              <p>{error}</p>

              <button
                onClick={() => {
                  void fetchStudents();

                  if (currentUser?.id) {
                    void refreshConnectionStates();
                  }
                }}
              >
                Try again
              </button>
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="discover-grid">
              {filteredStudents.map((student) => {
                const state =
                  requestStates[student.id] ?? "none";

                const isPending = state === "pending";
                const isConnected = state === "connected";

                const isProcessing =
                  state === "processing" ||
                  processingIds.includes(student.id);

                const isDisabled =
                  isPending || isConnected || isProcessing;

                return (
                  <article
                    className={`discover-card card-${student.color}`}
                    key={student.id}
                  >
                    <div className="discover-card-top">
                      <span className="discover-student-year">
                        {student.year}
                      </span>

                      <button
                        className={`discover-connect-icon ${
                          isPending || isConnected
                            ? "connected"
                            : ""
                        }`}
                        disabled={isDisabled}
                        onClick={() =>
                          void sendConnectionRequest(student)
                        }
                        aria-label={
                          isConnected
                            ? `Connected with ${student.name}`
                            : isPending
                              ? `Request pending for ${student.name}`
                              : `Connect with ${student.name}`
                        }
                      >
                        {isProcessing ? (
                          <RefreshCw
                            size={18}
                            className="discover-spinning"
                          />
                        ) : isConnected ? (
                          <Check size={18} />
                        ) : isPending ? (
                          <Clock size={18} />
                        ) : (
                          <ArrowRight size={18} />
                        )}
                      </button>
                    </div>

                    <div className="discover-avatar-row">
                      <div className="discover-avatar">
                        {student.initials}
                      </div>

                      <div>
                        <h3>{student.name}</h3>

                        <p className="discover-branch">
                          {student.branch}
                        </p>
                      </div>
                    </div>

                    <div className="discover-university">
                      <GraduationCap size={16} />
                      <span>{student.university}</span>
                    </div>

                    <div className="discover-location">
                      <MapPin size={15} />
                      {student.country}
                    </div>

                    <p className="discover-bio">
                      {student.bio}
                    </p>

                    <div className="discover-tags">
                      {student.skills.map((item) => (
                        <button
                          key={item}
                          onClick={() => setSkill(item)}
                          title={`Find students with ${item} skills`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <div className="discover-interests">
                      {student.interests.slice(0, 2).map((interest) => (
                        <span key={interest}>
                          #{interest.replaceAll(" ", "")}
                        </span>
                      ))}
                    </div>

                    <button
                      className={`discover-connect-button ${
                        isPending || isConnected ? "connected" : ""
                      }`}
                      disabled={isDisabled}
                      onClick={() =>
                        void sendConnectionRequest(student)
                      }
                    >
                      {renderConnectionButton(student)}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="discover-empty">
              <Search size={35} />

              <h3>
                {search ||
                country !== "All Countries" ||
                skill !== "All Skills"
                  ? "No students found!"
                  : "Your community is just getting started"}
              </h3>

              <p>
                {search ||
                country !== "All Countries" ||
                skill !== "All Skills"
                  ? "Try a different search or reset your filters."
                  : "Other students will appear here after they complete their profiles."}
              </p>

              {(search ||
                country !== "All Countries" ||
                skill !== "All Skills") && (
                <button onClick={clearFilters}>
                  Clear all filters
                </button>
              )}

              {!search &&
                country === "All Countries" &&
                skill === "All Skills" && (
                  <button
                    onClick={() => {
                      void fetchStudents();

                      if (currentUser?.id) {
                        void refreshConnectionStates();
                      }
                    }}
                  >
                    Refresh profiles
                  </button>
                )}
            </div>
          )}

          {/* BOTTOM CTA */}

          <div className="discover-bottom-cta">
            <div className="discover-cta-icon">
              <Sparkles size={25} />
            </div>

            <div>
              <h3>Your people are out there.</h3>

              <p>
                Keep exploring. Your next big idea might start
                with a connection.
              </p>
            </div>

            <Link to="/dashboard">
              Dashboard <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </section>

      {/* FOOTER */}

      <footer className="discover-footer">
        <span>© 2026 CAMPUSCONNECT</span>

        <span>
          MADE FOR STUDENTS, EVERYWHERE.{" "}
          <Globe2 size={14} />
        </span>
      </footer>
    </main>
  );
}
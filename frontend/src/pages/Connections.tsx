import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserPlus,
  Check,
  X,
  RefreshCw,
  GraduationCap,
  MapPin,
  Code2,
  Inbox,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

type SavedUser = {
  id: string;
  name: string;
  email?: string;
  university?: string;
};

type Student = {
  id: string;
  name: string;
  university: string;
  profile?: {
    degree?: string;
    branch?: string;
    year?: string;
    country?: string;
    bio?: string;
    skills?: string[];
    interests?: string[];
  } | null;
};

type IncomingRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: Student;
};

type Connection = {
  connectionId: string;
  connectedAt: string;
  student: Student;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  requests?: T[];
  connections?: T[];
};

const cardColors = [
  "student-lavender",
  "student-pink",
  "student-mint",
  "student-sky",
];

function getSavedUser(): SavedUser | null {
  try {
    const raw = localStorage.getItem("campusconnect-user");

    if (!raw) return null;

    const user = JSON.parse(raw) as Partial<SavedUser>;

    if (typeof user.id !== "string" || typeof user.name !== "string") {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
    };
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "S"
  );
}

function getCardColor(id: string): string {
  const total = id
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return cardColors[total % cardColors.length];
}

async function readResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data as T;
}

export default function Connections() {
  const navigate = useNavigate();

  const [user] = useState<SavedUser | null>(() => getSavedUser());

  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [activeTab, setActiveTab] = useState<"requests" | "connections">(
    "requests",
  );

  const loadConnections = useCallback(async () => {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const encodedUserId = encodeURIComponent(user.id);

      const [requestsResponse, connectionsResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/connections/requests?userId=${encodedUserId}`,
        ),
        fetch(`${API_URL}/api/connections?userId=${encodedUserId}`),
      ]);

      const requestsData =
        await readResponse<ApiResponse<IncomingRequest>>(requestsResponse);

      const connectionsData =
        await readResponse<ApiResponse<Connection>>(connectionsResponse);

      setRequests(requestsData.requests ?? []);
      setConnections(connectionsData.connections ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your connections.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadConnections();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [loadConnections]);

  async function handleRequest(
    requestId: string,
    action: "accept" | "reject",
  ) {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    setActionId(requestId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/connections/${encodeURIComponent(requestId)}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        },
      );

      await readResponse<{ success?: boolean; message?: string }>(response);

      await loadConnections();

      if (action === "accept") {
        setActiveTab("connections");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update this request.",
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <main className="dashboard-app">
      <section className="dashboard-main" style={{ width: "100%" }}>
        <header className="dashboard-topbar">
          <Link
            to="/dashboard"
            className="dashboard-icon-button"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="dashboard-breadcrumb">
            Your space <span>/</span> <strong>Connections</strong>
          </div>

          <button
            className="dashboard-icon-button"
            onClick={() => void loadConnections()}
            aria-label="Refresh connections"
            disabled={loading}
          >
            <RefreshCw size={18} />
          </button>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">
                <Users size={15} /> YOUR NETWORK
              </span>

              <h1>
                Your people<span>.</span>
              </h1>

              <p>
                Manage your requests and connect with students around the
                world.
              </p>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="welcome-globe">🤝</div>
            </div>
          </section>

          <section className="dashboard-stats">
            <article className="dashboard-stat-card stat-yellow">
              <span className="stat-icon">
                <UserPlus size={22} />
              </span>
              <span className="stat-label">Incoming requests</span>
              <strong>{loading ? "…" : requests.length}</strong>
              <small>Waiting for your response</small>
            </article>

            <article className="dashboard-stat-card stat-purple">
              <span className="stat-icon">
                <UserCheck size={22} />
              </span>
              <span className="stat-label">My connections</span>
              <strong>{loading ? "…" : connections.length}</strong>
              <small>Students in your network</small>
            </article>
          </section>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              margin: "28px 0",
            }}
          >
            <button
              className={`student-connect-button ${
                activeTab === "requests" ? "connected" : ""
              }`}
              onClick={() => setActiveTab("requests")}
            >
              <Inbox size={17} /> Incoming Requests ({requests.length})
            </button>

            <button
              className={`student-connect-button ${
                activeTab === "connections" ? "connected" : ""
              }`}
              onClick={() => setActiveTab("connections")}
            >
              <Users size={17} /> My Connections ({connections.length})
            </button>
          </div>

          {error && (
            <div className="dashboard-empty-state">
              <strong>Something went wrong</strong>
              <p>{error}</p>

              <button
                className="student-connect-button"
                onClick={() => void loadConnections()}
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="dashboard-empty-state">
              <RefreshCw size={25} />
              <strong>Loading your network...</strong>
              <p>Getting your connection requests and connections.</p>
            </div>
          ) : activeTab === "requests" ? (
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    <UserPlus size={15} /> PEOPLE REACHING OUT
                  </span>
                  <h2>Connection requests</h2>
                  <p>Choose who you'd like to connect with.</p>
                </div>
              </div>

              {requests.length === 0 ? (
                <div className="dashboard-empty-state">
                  <Inbox size={28} />
                  <strong>No incoming requests yet</strong>
                  <p>
                    When another student sends you a request, it will appear
                    here.
                  </p>

                  <button
                    className="student-connect-button"
                    onClick={() => navigate("/discover")}
                  >
                    Discover students
                  </button>
                </div>
              ) : (
                <div className="recommended-students">
                  {requests.map((request) => {
                    const student = request.sender;
                    const busy = actionId === request.id;

                    return (
                      <article
                        className="recommended-student"
                        key={request.id}
                      >
                        <div
                          className={`recommended-student-avatar ${getCardColor(
                            student.id,
                          )}`}
                        >
                          {getInitials(student.name)}
                        </div>

                        <h3>{student.name}</h3>

                        <p className="student-university">
                          {student.university}
                        </p>

                        {student.profile?.branch && (
                          <p className="student-branch">
                            {student.profile.branch}
                            {student.profile.year
                              ? ` · Year ${student.profile.year}`
                              : ""}
                          </p>
                        )}

                        {student.profile?.country && (
                          <p className="student-location">
                            <MapPin size={13} />
                            {student.profile.country}
                          </p>
                        )}

                        {student.profile?.bio && (
                          <p className="student-branch">
                            {student.profile.bio}
                          </p>
                        )}

                        <div className="student-skill-list">
                          {student.profile?.skills?.length ? (
                            student.profile.skills
                              .slice(0, 5)
                              .map((skill) => (
                                <span key={skill}>{skill}</span>
                              ))
                          ) : (
                            <span>Student</span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            width: "100%",
                            marginTop: 12,
                          }}
                        >
                          <button
                            className="student-connect-button"
                            disabled={busy}
                            onClick={() =>
                              void handleRequest(request.id, "accept")
                            }
                          >
                            <Check size={16} />
                            {busy ? "Please wait..." : "Accept"}
                          </button>

                          <button
                            className="student-connect-button"
                            disabled={busy}
                            onClick={() =>
                              void handleRequest(request.id, "reject")
                            }
                            style={{
                              background: "#f6c5ce",
                            }}
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    <UserCheck size={15} /> YOUR COMMUNITY
                  </span>
                  <h2>My connections</h2>
                  <p>Students you've mutually connected with.</p>
                </div>
              </div>

              {connections.length === 0 ? (
                <div className="dashboard-empty-state">
                  <Users size={28} />
                  <strong>Your network is growing</strong>
                  <p>
                    Accept a connection request or send one from Discover
                    Students.
                  </p>

                  <button
                    className="student-connect-button"
                    onClick={() => navigate("/discover")}
                  >
                    Find students
                  </button>
                </div>
              ) : (
                <div className="recommended-students">
                  {connections.map((connection) => {
                    const student = connection.student;

                    return (
                      <article
                        className="recommended-student"
                        key={connection.connectionId}
                      >
                        <div
                          className={`recommended-student-avatar ${getCardColor(
                            student.id,
                          )}`}
                        >
                          {getInitials(student.name)}
                        </div>

                        <h3>{student.name}</h3>

                        <p className="student-university">
                          {student.university}
                        </p>

                        {student.profile?.branch && (
                          <p className="student-branch">
                            {student.profile.branch}
                          </p>
                        )}

                        {student.profile?.country && (
                          <p className="student-location">
                            <MapPin size={13} />
                            {student.profile.country}
                          </p>
                        )}

                        <div className="student-skill-list">
                          {student.profile?.skills?.length ? (
                            student.profile.skills
                              .slice(0, 5)
                              .map((skill) => (
                                <span key={skill}>{skill}</span>
                              ))
                          ) : (
                            <span>No skills added</span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 14,
                            fontWeight: 700,
                          }}
                        >
                          <GraduationCap size={17} />
                          Connected
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <section className="dashboard-event-banner">
            <div className="event-banner-icon">
              <Code2 size={25} />
            </div>

            <div className="event-banner-copy">
              <span>GROW YOUR NETWORK</span>
              <h2>Great things happen together.</h2>
              <p>Discover students with skills and ideas like yours.</p>
            </div>

            <button onClick={() => navigate("/discover")}>
              Discover students
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
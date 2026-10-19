import { Link, useNavigate } from "react-router";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      // Save basic user information for the frontend.
      localStorage.setItem(
        "campusconnect-user",
        JSON.stringify(data.user)
      );

      // Continue to profile setup if the student has not completed it.
      const existingProfile = localStorage.getItem("campusconnect-profile");

      if (existingProfile) {
        navigate("/dashboard");
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link to="/" className="auth-logo">
        <GraduationCap size={30} strokeWidth={2.5} />
        <span>CampusConnect</span>
      </Link>

      <section className="auth-card">
        <div className="auth-badge">WELCOME BACK, STUDENT!</div>

        <h1>
          Let's connect<span>.</span>
        </h1>

        <p className="auth-description">
          Your global student community is waiting for you.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="loginEmail">College email</label>

          <input
            id="loginEmail"
            name="email"
            type="email"
            placeholder="you@university.edu"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="loginPassword">Password</label>

          <input
            id="loginPassword"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <p className="auth-switch">
          New to CampusConnect? <Link to="/signup">Create an account</Link>
        </p>

        <p className="auth-note">
          Connect with students. Discover opportunities. Build your future.
        </p>
      </section>
    </main>
  );
}
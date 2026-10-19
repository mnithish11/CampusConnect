import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  Mail,
} from "lucide-react";

type VerificationStatus = "loading" | "success" | "error" | "waiting";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "loading" : "waiting"
  );

  const [message, setMessage] = useState(
    token
      ? "Verifying your email address..."
      : "Check your inbox for the verification link sent by CampusConnect."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verifyEmail() {
      try {
        const response = await fetch(
          `http://localhost:5001/api/auth/verify-email?token=${encodeURIComponent(
            token!
          )}`
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setStatus("error");
          setMessage(
            data.message ||
              "We couldn't verify your email. The link may be invalid or expired."
          );
          return;
        }

        setStatus("success");
        setMessage(
          data.message || "Your email has been verified successfully!"
        );
      } catch {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          "Unable to connect to CampusConnect. Please ensure the backend is running and try again."
        );
      }
    }

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="auth-page">
      <Link to="/" className="auth-logo">
        <GraduationCap size={30} strokeWidth={2.5} />
        <span>CampusConnect</span>
      </Link>

      <section className="auth-card otp-card">
        <div className="otp-icon">
          {status === "success" ? (
            <CheckCircle size={30} />
          ) : (
            <Mail size={30} />
          )}
        </div>

        <div className="auth-badge">
          {status === "success"
            ? "EMAIL VERIFIED"
            : status === "loading"
              ? "PLEASE WAIT"
              : status === "error"
                ? "VERIFICATION FAILED"
                : "ONE QUICK STEP"}
        </div>

        <h1>
          {status === "success"
            ? "You're verified"
            : status === "loading"
              ? "Verifying email"
              : status === "error"
                ? "Verification failed"
                : "Check your email"}
          <span>.</span>
        </h1>

        <p className="auth-description" role="status" aria-live="polite">
          {message}
        </p>

        {status === "loading" && (
          <p className="otp-message">
            Please wait while we verify your account.
          </p>
        )}

        {status === "waiting" && (
          <>
            <div className="otp-resend">
              <p>
                Open the email from CampusConnect and click{" "}
                <strong>Verify My Email</strong>.
              </p>
            </div>

            <button
              className="auth-submit"
              type="button"
              onClick={() => window.location.reload()}
            >
              Refresh Page <ArrowRight size={19} />
            </button>
          </>
        )}

        {status === "success" && (
          <button
            className="auth-submit"
            type="button"
            onClick={() => navigate("/login")}
          >
            Continue to Login <ArrowRight size={19} />
          </button>
        )}

        {status === "error" && (
          <button
            className="auth-submit"
            type="button"
            onClick={() => navigate("/signup")}
          >
            Back to Sign Up <ArrowRight size={19} />
          </button>
        )}

        <button
          className="otp-back"
          type="button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <p className="auth-note">
          Your student journey is just getting started. 🌍
        </p>
      </section>
    </main>
  );
}
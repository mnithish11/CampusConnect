import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  GraduationCap,
  UserRound,
  MapPin,
  Code2,
  Sparkles,
} from "lucide-react";

const API_URL = "http://localhost:5001";

const skillOptions = [
  "C++",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "AI / ML",
  "UI / UX",
  "Cybersecurity",
  "Cloud Computing",
  "Data Science",
];

const interestOptions = [
  "Hackathons",
  "Web Development",
  "Artificial Intelligence",
  "Open Source",
  "Startups",
  "Research",
  "Competitive Programming",
  "Design",
];

type SavedProfile = {
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

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [savedProfile] = useState<SavedProfile>(() => {
    try {
      const saved = localStorage.getItem("campusconnect-profile");

      if (saved) {
        return JSON.parse(saved) as SavedProfile;
      }
    } catch (error) {
      console.error("Unable to load saved profile:", error);
    }

    return {};
  });

  const [skills, setSkills] = useState<string[]>(
    Array.isArray(savedProfile.skills) ? savedProfile.skills : []
  );

  const [interests, setInterests] = useState<string[]>(
    Array.isArray(savedProfile.interests)
      ? savedProfile.interests
      : []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleItem(
    item: string,
    selected: string[],
    setSelected: (items: string[]) => void
  ) {
    setSelected(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item]
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const savedUser = localStorage.getItem("campusconnect-user");

    if (!savedUser) {
      setError("Please log in before creating your profile.");
      return;
    }

    let user: {
      id?: string;
      name?: string;
      email?: string;
      university?: string;
    };

    try {
      user = JSON.parse(savedUser);
    } catch {
      setError("Your saved login information is invalid. Please log in again.");
      return;
    }

    if (!user.id) {
      setError("Your account information is incomplete. Please log in again.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const profile: SavedProfile = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      university: String(formData.get("university") ?? "").trim(),
      degree: String(formData.get("degree") ?? ""),
      branch: String(formData.get("branch") ?? "").trim(),
      year: String(formData.get("year") ?? ""),
      country: String(formData.get("country") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
      skills,
      interests,
    };

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          degree: profile.degree,
          branch: profile.branch,
          year: profile.year,
          country: profile.country,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save your profile."
        );
      }

      // Cache profile details for the existing frontend components.
      localStorage.setItem(
        "campusconnect-profile",
        JSON.stringify({
          ...profile,
          fullName: user.name ?? profile.fullName,
          university: user.university ?? profile.university,
        })
      );

      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="auth-page profile-page">
      <Link to="/" className="auth-logo">
        <GraduationCap size={30} strokeWidth={2.5} />
        <span>CampusConnect</span>
      </Link>

      <section className="auth-card profile-card">
        <div className="profile-heading-icon">
          <UserRound size={27} />
        </div>

        <div className="auth-badge">LET'S GET TO KNOW YOU</div>

        <h1>
          Build your profile<span>.</span>
        </h1>

        <p className="auth-description">
          Tell the community who you are, what you study,
          and what you love building.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <div className="profile-field full-width">
              <label htmlFor="fullName">Full name *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                defaultValue={savedProfile.fullName ?? ""}
                required
              />
            </div>

            <div className="profile-field full-width">
              <label htmlFor="university">University *</label>
              <input
                id="university"
                name="university"
                type="text"
                placeholder="Your university or college"
                defaultValue={savedProfile.university ?? ""}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="degree">Degree *</label>
              <select
                id="degree"
                name="degree"
                required
                defaultValue={savedProfile.degree ?? ""}
              >
                <option value="" disabled>
                  Select degree
                </option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E.">B.E.</option>
                <option value="B.Sc.">B.Sc.</option>
                <option value="BCA">BCA</option>
                <option value="M.Tech">M.Tech</option>
                <option value="M.Sc.">M.Sc.</option>
                <option value="MBA">MBA</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="branch">Branch *</label>
              <input
                id="branch"
                name="branch"
                type="text"
                placeholder="e.g. CSE"
                defaultValue={savedProfile.branch ?? ""}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="year">Year of study *</label>
              <select
                id="year"
                name="year"
                required
                defaultValue={savedProfile.year ?? ""}
              >
                <option value="" disabled>
                  Select year
                </option>
                <option value="1">1st year</option>
                <option value="2">2nd year</option>
                <option value="3">3rd year</option>
                <option value="4">4th year</option>
                <option value="5+">5th year or above</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="country">
                <MapPin size={14} /> Country *
              </label>
              <input
                id="country"
                name="country"
                type="text"
                placeholder="Your country"
                autoComplete="country-name"
                defaultValue={savedProfile.country ?? ""}
                required
              />
            </div>
          </div>

          <div className="profile-section">
            <h3>
              <Code2 size={18} />
              Your skills
            </h3>

            <p>Select the skills you have or are learning.</p>

            <div className="profile-chip-list">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`profile-chip ${
                    skills.includes(skill) ? "selected" : ""
                  }`}
                  aria-pressed={skills.includes(skill)}
                  onClick={() =>
                    toggleItem(skill, skills, setSkills)
                  }
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <h3>
              <Sparkles size={18} />
              Your interests
            </h3>

            <p>
              Choose what you'd like to explore with other students.
            </p>

            <div className="profile-chip-list">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`profile-chip ${
                    interests.includes(interest) ? "selected" : ""
                  }`}
                  aria-pressed={interests.includes(interest)}
                  onClick={() =>
                    toggleItem(interest, interests, setInterests)
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="bio">A little about you</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={300}
              placeholder="Tell other students what you're passionate about..."
              defaultValue={savedProfile.bio ?? ""}
            />
          </div>

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
            {loading ? "Saving your profile..." : "Continue to CampusConnect"}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <p className="auth-note">
          Your profile helps students with shared interests find you.
        </p>
      </section>
    </main>
  );
}
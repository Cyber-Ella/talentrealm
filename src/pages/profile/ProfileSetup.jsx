import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createProfileFromAnswers } from "../../services/gemini";
import {
  completeProfileSetup,
  getProfile,
} from "../../services/profile";

const INITIAL_ANSWERS = {
  interests: "",
  skills: "",
  lookingFor: "",
  about: "",
};

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getProfile(user.uid);
        if (!data) throw new Error("Your account profile could not be found.");
        if (!active) return;
        if (data.profileSetupComplete) {
          navigate("/profile", { replace: true });
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error(err);
        if (active) {
          setError("We couldn't load your profile. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [navigate, user.uid]);

  function updateAnswer(event) {
    const { name, value } = event.target;
    setAnswers((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const generated = await createProfileFromAnswers(profile, answers);
      await completeProfileSetup(user.uid, generated);
      navigate("/profile", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't create your profile. Check your connection and try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-setup-page">
        <p className="pf-state">Getting your profile ready…</p>
      </main>
    );
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">
        <p className="profile-setup-eyebrow">WELCOME TO TALENTREALM</p>
        <h1 className="profile-setup-title">
          Let’s introduce you to campus
        </h1>
        <p className="profile-setup-description">
          Answer a few questions and Gemini will turn your answers into a
          profile bio and suggest what you can offer and what you’re looking
          for. Your answers are used to describe you, not to make assumptions.
        </p>

        <form className="profile-setup-form" onSubmit={handleSubmit}>
          <div className="profile-setup-field">
            <label htmlFor="setup-interests">
              What do you enjoy or care about?
            </label>
            <textarea
              id="setup-interests"
              name="interests"
              value={answers.interests}
              onChange={updateAnswer}
              placeholder="For example: I enjoy fashion, music, and helping classmates with projects."
              required
              rows={3}
              maxLength={500}
              disabled={generating}
            />
          </div>

          <div className="profile-setup-field">
            <label htmlFor="setup-skills">
              What skills or services can you offer?
            </label>
            <textarea
              id="setup-skills"
              name="skills"
              value={answers.skills}
              onChange={updateAnswer}
              placeholder="List any skills or services you’d be happy to share."
              rows={3}
              maxLength={500}
              disabled={generating}
            />
          </div>

          <div className="profile-setup-field">
            <label htmlFor="setup-looking-for">
              What would you like help with or are you looking for?
            </label>
            <textarea
              id="setup-looking-for"
              name="lookingFor"
              value={answers.lookingFor}
              onChange={updateAnswer}
              placeholder="For example: I’m looking for help with photography."
              rows={3}
              maxLength={500}
              disabled={generating}
            />
          </div>

          <div className="profile-setup-field">
            <label htmlFor="setup-about">Anything else you want people to know? (optional)</label>
            <textarea
              id="setup-about"
              name="about"
              value={answers.about}
              onChange={updateAnswer}
              placeholder="Share anything else that describes you."
              rows={3}
              maxLength={500}
              disabled={generating}
            />
          </div>

          {error && (
            <p className="pf-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="pf-btn-primary"
            disabled={generating || !profile}
          >
            {generating ? "Gemini is creating your profile…" : "Create my profile"}
          </button>
        </form>
      </section>
    </main>
  );
}

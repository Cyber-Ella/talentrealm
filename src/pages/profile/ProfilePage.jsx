
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";

import { useAuth } from "../../context/AuthContext";
import { auth } from "../../services/firebase";
import { getProfile, saveProfile } from "../../services/profile";

import RefineWithGemini from "../../components/RefineWithGemini";
import ProfilePhotoUploader from "../../components/ProfilePhotoUploader";

const toList = (s) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [p, setP] = useState(null);
  const [bio, setBio] = useState("");
  const [offers, setOffers] = useState("");
  const [needs, setNeeds] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [project, setProject] = useState({ title: "", description: "", imageUrl: "", link: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    getProfile(user.uid)
      .then((d) => {
        if (!active) return;

        setP(d || {});
        setBio(d?.bio || "");
        setOffers((d?.offers || []).join(", "));
        setNeeds((d?.needs || []).join(", "));
        setPortfolio(Array.isArray(d?.portfolio) ? d.portfolio : []);
      })
      .catch((e) => {
        if (active) setMsg("Could not load profile: " + e.message);
      });

    return () => {
      active = false;
    };
  }, [user.uid]);

  // Save bio, skills and needs
  const save = async () => {
    setMsg("");
    setSaving(true);

    try {
      const profileData = {
        bio,
        offers: toList(offers),
        needs: toList(needs),
        portfolio,
      };

      await saveProfile(user.uid, profileData);

      setP((prev) => ({
        ...prev,
        ...profileData,
      }));

      setMsg("Your profile has been saved.");
    } catch (e) {
      setMsg("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Save uploaded profile picture
  const handlePhotoUploaded = async (photoURL) => {
    setMsg("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in to update your photo.");
      }

      // Update Firebase Authentication
      await updateProfile(currentUser, { photoURL });

      // Save the photo URL in Firestore
      await saveProfile(user.uid, { photoURL });

      // Refresh React authentication state
      await refreshUser();

      // Update the profile page immediately
      setP((prev) => ({
        ...prev,
        photoURL,
      }));

      setMsg("Profile picture updated successfully.");
    } catch (e) {
      setMsg("Could not update profile picture: " + e.message);
      throw e;
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    if (!project.title.trim()) return;
    const next = [{ ...project, id: `${Date.now()}`, title: project.title.trim() }, ...portfolio];
    setPortfolio(next);
    setProject({ title: "", description: "", imageUrl: "", link: "" });
    try {
      await saveProfile(user.uid, { portfolio: next });
      setMsg("Portfolio project added.");
    } catch (error) {
      setPortfolio(portfolio);
      setMsg("Could not save project: " + error.message);
    }
  };

  const removeProject = async (id) => {
    const next = portfolio.filter((item) => item.id !== id);
    setPortfolio(next);
    try { await saveProfile(user.uid, { portfolio: next }); }
    catch (error) { setMsg("Could not remove project: " + error.message); }
  };

  if (!p) {
    return <div className="tr-profile-loading">Loading your profile...</div>;
  }

  const name = user.displayName || "TalentRealm Member";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const photoURL = user.photoURL || p.photoURL || "";

  const offerList = toList(offers);
  const needList = toList(needs);
  const completionChecks = [
    Boolean(photoURL),
    Boolean(bio.trim()),
    Boolean(p.department && p.level),
    offerList.length > 0,
    needList.length > 0,
    portfolio.length > 0,
  ];
  const completion = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);

  return (
    <main className="tr-profile-page">
      {/* Page heading */}
      <header className="tr-profile-heading">
        <div>
          <span className="tr-eyebrow">YOUR PERSONAL REALM</span>
          <h1>Your profile.</h1>
          <p>Tell your community what makes you, you.</p>
        </div>

        <Link to="/" className="tr-profile-back">
          ← Dashboard
        </Link>
      </header>

      {/* Identity card */}
      <section className="tr-profile-identity">
        <div className="tr-profile-photo-wrap">
          {photoURL ? (
            <img
              src={photoURL}
              alt={`${name}'s profile`}
              className="tr-profile-avatar-image"
            />
          ) : (
            <div className="tr-profile-avatar">{initials}</div>
          )}

          <ProfilePhotoUploader
            photoURL={photoURL}
            onUploaded={handlePhotoUploaded}
          />
        </div>

        <div className="tr-profile-identity-copy">
          <div className="tr-profile-name-row">
            <h2>{name}</h2>

            {p.verified && (
              <span className="tr-profile-verified">
                ✓ UNIZIK verified
              </span>
            )}
          </div>

          <p>
            {p.department || "Department not set"}
            {p.level ? ` · ${p.level} Level` : ""}
          </p>

          <span className="tr-profile-email">{user.email}</span>
        </div>

        <div className="tr-profile-status">
          <span className="tr-profile-status-dot" />
          Member
        </div>
      </section>

      <section className="tr-profile-strength" aria-label="Profile completeness">
        <div className="tr-profile-strength-copy">
          <span className="tr-eyebrow">PROFILE STRENGTH</span>
          <strong>{completion}% complete</strong>
          <p>{completion === 100 ? "Your profile is ready to make a great first impression." : "A little more detail helps the right people find and trust your talent."}</p>
        <div className="tr-profile-strength-tips">
          {[
            ["Add a profile photo", Boolean(photoURL)],
            ["Write your story", Boolean(bio.trim())],
            ["Add your department & level", Boolean(p.department && p.level)],
            ["List skills you offer", offerList.length > 0],
            ["Share what you need", needList.length > 0],
            ["Show a piece of your work", portfolio.length > 0],
          ].map(([label, done]) => <span className={done ? "is-done" : ""} key={label}>{done ? "✓" : "○"} {label}</span>)}
        </div>
        </div>
        <div className="tr-profile-strength-meter"><span style={{width:`${completion}%`}} /></div>
      </section>

      {/* Profile editor */}
      <section className="tr-profile-editor">
        <div className="tr-profile-editor-heading">
          <span className="tr-eyebrow">YOUR STORY</span>
          <h2>Make yourself discoverable.</h2>
          <p>
            Your profile helps people understand what you do,
            what you are good at, and how they can connect with you.
          </p>
        </div>

        <div className="tr-profile-field">
          <label htmlFor="profile-bio">About me</label>

          <textarea
            id="profile-bio"
            rows={5}
            placeholder="Tell people about yourself, your interests, your experience, and what you love doing..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <RefineWithGemini
            text={bio}
            onAccept={(r) => {
              setBio(r.refined);
              setOffers(r.skills.join(", "));
              setNeeds(r.needs.join(", "));
            }}
          />

          <span className="tr-profile-hint">
            Tip: Write naturally. Gemini can help you make it clearer.
          </span>
        </div>

        <div className="tr-profile-field">
          <label htmlFor="profile-offers">What I can do</label>

          <input
            id="profile-offers"
            placeholder="e.g. Hair styling, Photography, UI design"
            value={offers}
            onChange={(e) => setOffers(e.target.value)}
          />

          <div className="tr-profile-tags">
            {offerList.map((item, i) => (
              <span key={`${item}-${i}`} className="tr-profile-tag">
                {item}
              </span>
            ))}
          </div>

          <span className="tr-profile-hint">
            These are your talents and skills. Separate them with commas.
          </span>
        </div>

        <div className="tr-profile-field">
          <label htmlFor="profile-needs">What I am looking for</label>

          <input
            id="profile-needs"
            placeholder="e.g. Fashion design, Video editing, Tutoring"
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
          />

          <div className="tr-profile-tags tr-profile-tags-needs">
            {needList.map((item, i) => (
              <span key={`${item}-${i}`} className="tr-profile-tag">
                {item}
              </span>
            ))}
          </div>

          <span className="tr-profile-hint">
            Things you want help with or skills you want to learn.
          </span>
        </div>

        <div className="tr-profile-save-row">
          {msg && (
            <p className="tr-profile-save-message" role="status">
              {msg}
            </p>
          )}

          <button
            className="tr-profile-save"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save profile ↗"}
          </button>
        </div>
      </section>

      {/* Portfolio */}
      <section className="tr-profile-portfolio">
        <div>
          <span className="tr-eyebrow">YOUR CREATIVE SPACE</span>
          <h2>Your portfolio.</h2>
          <p>
            Your work deserves to be seen. Showcase projects,
            photographs, designs, and creative work here.
          </p>
        </div>

        <form className="tr-portfolio-form" onSubmit={addProject}>
          <div className="tr-portfolio-form__heading">
            <strong>Add a project</strong>
            <span>Share a piece of work, a case study or something you created.</span>
          </div>
          <input aria-label="Project title" placeholder="Project title *" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required />
          <textarea aria-label="Project description" rows={3} placeholder="What did you make? What was your role?" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} />
          <input aria-label="Project image URL" placeholder="Image URL (optional)" value={project.imageUrl} onChange={(e) => setProject({ ...project, imageUrl: e.target.value })} />
          <input aria-label="Project link" placeholder="Project link (optional)" value={project.link} onChange={(e) => setProject({ ...project, link: e.target.value })} />
          <button className="tr-profile-save" type="submit">Add to portfolio ↗</button>
        </form>
        {portfolio.length ? (
          <div className="tr-portfolio-grid">
            {portfolio.map((item) => <article className="tr-portfolio-item" key={item.id}>
              {item.imageUrl && <img src={item.imageUrl} alt="" />}
              <div><h3>{item.title}</h3><p>{item.description}</p>{item.link && <a href={item.link} target="_blank" rel="noreferrer">View project ↗</a>}</div>
              <button type="button" aria-label={`Remove ${item.title}`} onClick={() => removeProject(item.id)}>Remove</button>
            </article>)}
          </div>
        ) : <div className="tr-profile-portfolio-placeholder"><span>✳</span><p>Your portfolio is ready for its first project.</p></div>}
      </section>
    </main>
  );
}

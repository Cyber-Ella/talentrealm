import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebase";
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  validatePhoto,
  cleanTags,
} from "../../services/profile";
import "../../styles/profile.css";

const BIO_LIMIT = 300;
const OFFER_CHIP_CLASSES = [
  "pf-chip--purple",
  "pf-chip--amber",
  "pf-chip--green",
];

/* ---------- small pieces ---------- */

function Banner() {
  return (
    <svg viewBox="0 0 340 130" className="pf-banner" aria-hidden="true">
      <rect width="340" height="130" fill="#4B2A9B" />
      <ellipse cx="60" cy="125" rx="150" ry="55" fill="#6A44C4" />
      <circle cx="285" cy="40" r="55" fill="#3A1F85" />
      <circle cx="300" cy="125" r="42" fill="#FDB82E" />
      <path
        d="M205 22 L212 42 L232 49 L212 56 L205 76 L198 56 L178 49 L198 42 Z"
        fill="#FDB82E"
      />
    </svg>
  );
}

/* Photo if there is one, otherwise the person icon */
function AvatarCircle({ src, name, className = "" }) {
  return (
    <div className={`pf-avatar ${className}`}>
      {src ? (
        <img src={src} alt={name ? `${name}'s photo` : "Profile photo"} />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="#8B6FD6"
          role="img"
          aria-label="No profile photo"
        >
          <circle cx="12" cy="8" r="4.5" />
          <path d="M3.5 21c0-4.7 3.8-7.5 8.5-7.5s8.5 2.8 8.5 7.5z" />
        </svg>
      )}
    </div>
  );
}

function Chips({ items, classes, empty }) {
  if (!items.length) return <p className="pf-text">{empty}</p>;
  return (
    <div className="pf-chips">
      {items.map((t, i) => (
        <span key={t} className={`pf-chip ${classes[i % classes.length]}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="pf-stat">
      <div className="pf-stat-value">{value}</div>
      <div className="pf-stat-label">{label}</div>
    </div>
  );
}

/* Type a tag, press Enter or comma to add it */
function TagInput({ id, label, hint, tags, onChange, chipClass }) {
  const [text, setText] = useState("");

  function add() {
    onChange(cleanTags([...tags, text]));
    setText("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (text.trim()) add();
    } else if (e.key === "Backspace" && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="pf-label">
        {label}
      </label>
      <div className="pf-taginput">
        <div className="pf-chips">
          {tags.map((t) => (
            <span key={t} className={`pf-chip ${chipClass}`}>
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                className="pf-chip-remove"
                onClick={() => onChange(tags.filter((x) => x !== t))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => text.trim() && add()}
          placeholder={hint}
          className="pf-taginput-field"
        />
      </div>
    </div>
  );
}

/* ---------- edit form ---------- */

function EditForm({ profile, onSaved, onCancel, uid }) {
  const [bio, setBio] = useState(profile.bio);
  const [offers, setOffers] = useState(profile.offers);
  const [needs, setNeeds] = useState(profile.needs);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again later
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const photoURL = photoFile
        ? await uploadProfilePhoto(uid, photoFile)
        : null;
      const saved = await updateProfile(uid, { bio, offers, needs });
      onSaved(photoURL ? { ...saved, photoURL } : saved);
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't save your changes. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasPhoto = Boolean(profile.photoURL || preview);

  return (
    <form onSubmit={handleSubmit} className="pf-form">
      <div className="pf-photo-card">
        <AvatarCircle
          src={preview || profile.photoURL}
          name={profile.name}
          className="pf-avatar--medium"
        />
        <div>
          <p className="pf-photo-title">
            {hasPhoto ? "Change your profile photo" : "Add a profile photo"}
          </p>
          <p className="pf-photo-hint">
            A clear photo helps people recognise you around campus.
          </p>
          <label className="pf-upload">
            {hasPhoto ? "Choose new photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={saving}
            />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="pf-label">
          A little about you <span className="pf-optional">(optional)</span>
        </label>
        <textarea
          id="bio"
          rows={4}
          maxLength={BIO_LIMIT}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the campus community about yourself…"
          className="pf-textarea"
        />
        <p className="pf-counter">
          {bio.length}/{BIO_LIMIT} characters
        </p>
      </div>

      <TagInput
        id="offers"
        label="What I offer"
        hint="Add a skill or service, then press Enter"
        tags={offers}
        onChange={setOffers}
        chipClass="pf-chip--purple"
      />

      <TagInput
        id="needs"
        label="What I need"
        hint="Add something you're looking for, then press Enter"
        tags={needs}
        onChange={setNeeds}
        chipClass="pf-chip--amber"
      />

      {error && (
        <p role="alert" className="pf-error">
          {error}
        </p>
      )}

      <div className="pf-form-actions">
        <button type="submit" disabled={saving} className="pf-btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="pf-btn-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- view ---------- */

function ProfileView({ profile, onEdit }) {
  const subtitle = [
    profile.department,
    profile.level && `${profile.level} Level`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="pf-hero">
        <Banner />
        <AvatarCircle
          src={profile.photoURL}
          name={profile.name}
          className="pf-avatar--large"
        />
        <h2 className="pf-name">{profile.name || "Your name"}</h2>
        <p className="pf-subtitle">
          {subtitle || "Add your department and level"}
        </p>

        <div className="pf-stats">
          <Stat value={profile.offers.length} label="Offers" />
          <Stat value={profile.needs.length} label="Needs" />
        </div>
      </div>

      <section className="pf-section">
        <h3 className="pf-section-title">About</h3>
        <p className="pf-text">
          {profile.bio ||
            "No bio yet. Tell the campus community about yourself."}
        </p>
      </section>

      <section className="pf-section">
        <h3 className="pf-section-title">What I offer</h3>
        <Chips
          items={profile.offers}
          classes={OFFER_CHIP_CLASSES}
          empty="You haven't added anything you offer yet."
        />
      </section>

      <section className="pf-section">
        <h3 className="pf-section-title">What I need</h3>
        <Chips
          items={profile.needs}
          classes={["pf-chip--amber"]}
          empty="You haven't added anything you need yet."
        />
      </section>

      <div className="pf-actions">
        <button type="button" onClick={onEdit} className="pf-btn-accent">
          Edit profile
        </button>
      </div>
    </>
  );
}

/* ---------- page ---------- */

export default function ProfilePage() {
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | signedout | error
  const [editing, setEditing] = useState(false);

  // onAuthStateChanged (not auth.currentUser) so a page refresh waits for Firebase to restore the session
  useEffect(() => {
    const stop = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("signedout");
        return;
      }
      setUid(user.uid);
      try {
        const data = await getProfile(user.uid);
        if (data) {
          setProfile(data);
          setStatus("ready");
        } else {
          setStatus("missing");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    });
    return stop;
  }, []);

  function handleSaved(saved) {
    setProfile((p) => ({ ...p, ...saved }));
    setEditing(false);
  }

  return (
    <div className="pf-page">
      <header className="pf-header">
        <button
          type="button"
          aria-label="Go back"
          className="pf-back"
          onClick={() => (editing ? setEditing(false) : window.history.back())}
        >
          ‹
        </button>
        <h1 className="pf-header-title">
          {editing ? "Edit profile" : "Student Profile"}
        </h1>
        <span className="pf-header-spacer" aria-hidden="true" />
      </header>

      {status === "loading" && (
        <p className="pf-state">Loading your profile…</p>
      )}
      {status === "signedout" && (
        <p className="pf-state">Sign in to see your profile.</p>
      )}
      {status === "missing" && (
        <p className="pf-state">
          We couldn't find your profile. Finish creating it to continue.
        </p>
      )}
      {status === "error" && (
        <p className="pf-state">
          Something went wrong loading your profile. Refresh the page to try
          again.
        </p>
      )}

      {status === "ready" &&
        (editing ? (
          <EditForm
            uid={uid}
            profile={profile}
            onSaved={handleSaved}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <ProfileView profile={profile} onEdit={() => setEditing(true)} />
        ))}
    </div>
  );
}

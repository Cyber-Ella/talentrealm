import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { refineDescription } from "../services/gemini";
import { saveProfile } from "../services/profile";
import Confetti from "../components/Confetti";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];
const MEET = ["On campus", "Online", "Either"];
const EXAMPLE = "I do braids and wig installs. I need someone to take photos for my brand.";

function ChipEditor({ label, hint, items, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !items.some((i) => i.toLowerCase() === v.toLowerCase())) onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className="xp-block">
      <h3>{label}</h3>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{hint}</p>
      <div className="xp-chips">
        {items.map((it) => (
          <span className="xp-chip" key={it}>
            {it}
            <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((x) => x !== it))}>×</button>
          </span>
        ))}
      </div>
      <input
        className="xp-field"
        value={draft}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
      />
    </div>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = (user?.displayName || "there").split(" ")[0];

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("write");
  const [text, setText] = useState("");
  const [bio, setBio] = useState("");
  const [offers, setOffers] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [note, setNote] = useState("");
  const [days, setDays] = useState([]);
  const [times, setTimes] = useState([]);
  const [meet, setMeet] = useState("Either");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const read = async () => {
    setPhase("reading");
    setNote("");
    try {
      const r = await refineDescription(text);
      setBio(r.refined || text);
      setOffers(r.skills || []);
      setNeeds(r.needs || []);
    } catch (e) {
      console.error(e);
      setBio(text);
      setNote("Gemini couldn't read that just now. Add your skills below yourself. It only takes a moment.");
    }
    setPhase("review");
  };

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      await saveProfile(user.uid, { bio, offers, needs, availability: { days, times, meet }, onboardingDone: true });
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="xp-ob">
      <div className="xp-ob-top">
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text)" }}>★ TalentRealm</Link>
        {step < 2 && <Link to="/">Skip for now</Link>}
      </div>
      <div className="xp-ob-bar" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}
      </div>

      {step === 0 && (
        <section className="xp-ob-card" key={"s0" + phase}>
          <span className="xp-eyebrow">Step 1 of 3 · Your story</span>

          {phase === "write" && (
            <>
              <h1>What can you do, {firstName}? And what do you need?</h1>
              <p className="lead">Write it the way you'd tell a friend. Gemini will organise it, and you decide what stays.</p>
              <textarea className="xp-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} aria-label="About you" />
              <div className="xp-ob-actions">
                <button className="xp-btn lime" onClick={read} disabled={text.trim().length < 10}>✦ Let Gemini read it</button>
                <button className="xp-btn ghost" onClick={() => setText(EXAMPLE)}>Try an example</button>
              </div>
            </>
          )}

          {phase === "reading" && (
            <>
              <h1>Reading your story…</h1>
              <div className="xp-reading">
                <span className="xp-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>Gemini is finding your skills and what you're looking for.</span>
              </div>
            </>
          )}

          {phase === "review" && (
            <>
              <h1>Here's what we found.</h1>
              <p className="lead">✦ Suggested by Gemini. Remove anything that's wrong and add what's missing.</p>
              {note && <p style={{ color: "var(--color-pending-fg)" }}>{note}</p>}
              <div className="xp-block">
                <h3>In your words</h3>
                <textarea className="xp-field" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} aria-label="Your bio" />
                <button type="button" className="link-btn" onClick={() => setBio(text)}>Use exactly what I wrote</button>
              </div>
              <ChipEditor label="You offer" hint="Press Enter after each skill." items={offers} onChange={setOffers} placeholder="e.g. Hair styling" />
              <ChipEditor label="You need" hint="This unlocks swaps. Add at least one if you can." items={needs} onChange={setNeeds} placeholder="e.g. Product photography" />
              <div className="xp-ob-actions">
                <button className="xp-btn lime" onClick={() => setStep(1)} disabled={offers.length === 0}>Continue ↗</button>
                <button className="xp-btn ghost" onClick={() => setPhase("write")}>Start over</button>
              </div>
              {offers.length === 0 && <p className="muted">Add at least one thing you offer to continue.</p>}
            </>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="xp-ob-card">
          <span className="xp-eyebrow">Step 2 of 3 · Your time</span>
          <h1>When are you usually free?</h1>
          <p className="lead">Optional, but it helps us suggest swaps that actually fit your week.</p>
          <div className="xp-block">
            <h3>Days</h3>
            <div className="xp-chips">
              {DAYS.map((d) => <button key={d} type="button" className={"xp-chip" + (days.includes(d) ? " on" : "")} aria-pressed={days.includes(d)} onClick={() => toggle(days, setDays, d)}>{d}</button>)}
            </div>
            <h3>Time of day</h3>
            <div className="xp-chips">
              {TIMES.map((t) => <button key={t} type="button" className={"xp-chip" + (times.includes(t) ? " on" : "")} aria-pressed={times.includes(t)} onClick={() => toggle(times, setTimes, t)}>{t}</button>)}
            </div>
            <h3>How you prefer to meet</h3>
            <div className="xp-chips">
              {MEET.map((m) => <button key={m} type="button" className={"xp-chip" + (meet === m ? " on" : "")} aria-pressed={meet === m} onClick={() => setMeet(m)}>{m}</button>)}
            </div>
          </div>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
          <div className="xp-ob-actions">
            <button className="xp-btn lime" onClick={finish} disabled={saving}>{saving ? "Saving…" : "Finish ↗"}</button>
            <button className="xp-btn ghost" onClick={() => setStep(0)}>Back</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="xp-ob-card">
          <Confetti />
          <span className="xp-eyebrow">You're in</span>
          <h1>Welcome to the realm, {firstName}.</h1>
          <p className="lead">Your skills are live. Let's see who in your community needs what you do.</p>
          <div className="xp-chips">
            {offers.map((o) => <span className="xp-chip" key={o}>{o}</span>)}
          </div>
          <div className="xp-ob-actions">
            <button className="xp-btn lime" onClick={() => navigate("/exchanges/new")}>See my matches ↗</button>
            <button className="xp-btn ghost" onClick={() => navigate("/")}>Go to my dashboard</button>
          </div>
        </section>
      )}
    </div>
  );
}
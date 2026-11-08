import { firstName } from "../services/names";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { findCircles } from "../services/circles";
import CircleReveal from "./CircleReveal";
import Skeleton from "./Skeleton";

const first = (n) => firstName(n);

export default function MatchSpotlight() {
  const { user } = useAuth();
  const [s, setS] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    findCircles(user.uid, { useAI: false })
      .then((r) => active && setS({ status: "ready", ...r }))
      .catch((e) => active && setS({ status: "error", message: e.message }));
    return () => { active = false; };
  }, [user.uid]);

  if (s.status === "loading") return <Skeleton height={220} style={{ margin: "24px 0", borderRadius: 24 }} />;

  if (s.status === "error") {
    const needsSetup = /offers and needs/i.test(s.message);
    return (
      <section className="xp-spot">
        <div>
          <span className="xp-eyebrow">Unlock your matches</span>
          <h2>{needsSetup ? "Tell us what you offer and need." : "We couldn't check matches right now."}</h2>
          <p>{needsSetup ? "It takes a minute. Write it your own way and Gemini organises it for you." : s.message}</p>
          <div className="xp-actions">
            <Link className="xp-btn lime" to="/onboarding">Set up my realm ↗</Link>
          </div>
        </div>
      </section>
    );
  }

  const circle = s.circles[0];
  const direct = s.direct[0];

  if (circle) {
    return (
      <section className="xp-spot">
        <div>
          <span className="xp-eyebrow">✦ A circle is ready for you</span>
          <h2>Three people. Three skills. One loop.</h2>
          <p>Nobody matches directly, but together you complete a circle where everyone gets what they need.</p>
          <div className="xp-actions">
            <Link className="xp-btn lime" to="/exchanges/new">See my circle ↗</Link>
            <Link className="xp-btn ghost" to="/browse">Explore talents</Link>
          </div>
        </div>
        <CircleReveal legs={circle.legs} people={s.people} meId={user.uid} />
      </section>
    );
  }

  if (direct) {
    const [a, b] = direct.legs;
    const other = s.people[a.receiverId]?.name;
    return (
      <section className="xp-spot">
        <div>
          <span className="xp-eyebrow">✦ A swap is waiting</span>
          <h2>{first(other)} has what you need.</h2>
          <p>You give {a.offer}. {first(other)} gives {b.offer}. A fair trade, and Gemini will suggest the values.</p>
          <div className="xp-actions">
            <Link className="xp-btn lime" to="/exchanges/new">See the swap ↗</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="xp-spot">
      <div>
        <span className="xp-eyebrow">Your realm is growing</span>
        <h2>No match yet, but it only takes one more talent.</h2>
        <p>Add more skills to your profile, or invite a friend who needs what you do.</p>
        <div className="xp-actions">
          <Link className="xp-btn" to="/profile">Add more skills</Link>
          <Link className="xp-btn ghost" to="/browse">Browse talents</Link>
        </div>
      </div>
    </section>
  );
}
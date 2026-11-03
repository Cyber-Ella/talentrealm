import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import RefineWithGemini from "../components/RefineWithGemini";

export default function HomePage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [accepted, setAccepted] = useState(null);

  return (
    <div>
      <h1>Hello, {user.displayName}</h1>
      <p>Explore talents, services and opportunities around you.</p>

      <h2 style={{ fontSize: 18 }}>Gemini test</h2>
      <textarea
        rows={4}
        placeholder="e.g. i make hair, i can do braids twists and wig install"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <RefineWithGemini
        text={text}
        onAccept={(r) => {
          setAccepted(r);
          setText(r.refined);
        }}
      />

      {accepted && (
        <div className="card">
          <strong>Saved from Gemini</strong>
          <p style={{ margin: "8px 0 0" }}>Skills: {accepted.skills.join(", ") || "none"}</p>
          {accepted.needs.length > 0 && <p style={{ margin: "4px 0 0" }}>Needs: {accepted.needs.join(", ")}</p>}
          <p style={{ margin: "4px 0 0" }}>Category: {accepted.category}</p>
          <p style={{ margin: "4px 0 0" }}>Type: {accepted.type}</p>
        </div>
      )}
    </div>
  );
}
import { useState } from "react";

const PHOTOS = ["ella", "amaka", "david", "dami", "tunde", "blessing", "chisom"];

export function photoFor(name = "") {
  const key = String(name).trim().split(" ")[0].toLowerCase();
  return PHOTOS.includes(key) ? `/images/${key}.jpg` : null;
}

export default function Avatar({ name = "", size = 44 }) {
  const [broken, setBroken] = useState(false);
  const src = photoFor(name);
  const initials = String(name).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", background: "var(--color-bg-ai)", color: "var(--color-text-brand)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size / 3,
      overflow: "hidden", flex: "none",
    }}>
      {src && !broken ? <img src={src} alt={name} onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </span>
  );
}
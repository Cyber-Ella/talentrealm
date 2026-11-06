import { useEffect, useState } from "react";

const COLORS = ["var(--color-primary)", "var(--color-highlight)", "var(--color-accent)"];
const rnd = (i, k) => Math.abs((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1);

export default function Confetti({ count = 40 }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="xp-confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            left: rnd(i, 1) * 100 + "%",
            width: 6 + rnd(i, 2) * 6,
            height: 10 + rnd(i, 3) * 8,
            background: COLORS[i % 3],
            animationDuration: 2.4 + rnd(i, 4) * 1.8 + "s",
            animationDelay: rnd(i, 5) * 0.8 + "s",
          }}
        />
      ))}
    </div>
  );
}
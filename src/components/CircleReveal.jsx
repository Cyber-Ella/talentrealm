import { firstName } from "../services/names";
import { useId } from "react";
import { photoFor } from "./Avatar";

const R = 30;
const POS = [
  { x: 180, y: 56 },
  { x: 290, y: 176 },
  { x: 70, y: 176 },
];

const first = (n) => firstName(n);

function geometry(a, b, centre) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const sx = a.x + ux * (R + 4), sy = a.y + uy * (R + 4);
  const ex = b.x - ux * (R + 8), ey = b.y - uy * (R + 8);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const ox = mx - centre.x, oy = my - centre.y, ol = Math.hypot(ox, oy) || 1;
  const cx = mx + (ox / ol) * 30, cy = my + (oy / ol) * 30;
  const tx = ex - cx, ty = ey - cy, tl = Math.hypot(tx, ty) || 1;
  const tux = tx / tl, tuy = ty / tl;
  const bx = ex - tux * 13, by = ey - tuy * 13;
  const px = -tuy * 6, py = tux * 6;
  return {
    d: `M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`,
    head: `${ex + tux * 3},${ey + tuy * 3} ${bx + px},${by + py} ${bx - px},${by - py}`,
  };
}

export default function CircleReveal({ legs, people, meId }) {
  const uid = useId().replace(/:/g, "");
  const nodes = legs.map((l, i) => ({ ...POS[i], id: l.providerId, offer: l.offer }));
  const centre = {
    x: nodes.reduce((s, n) => s + n.x, 0) / nodes.length,
    y: nodes.reduce((s, n) => s + n.y, 0) / nodes.length,
  };
  const label = nodes
    .map((n, i) => `${first(people[n.id]?.name)} gives ${n.offer} to ${first(people[nodes[(i + 1) % 3].id]?.name)}`)
    .join(". ");

  return (
    <svg className="xp-circle" viewBox="0 0 360 250" role="img" aria-label={label}>
      <defs>
        {nodes.map((n, i) => (
          <clipPath key={i} id={`${uid}-c${i}`}><circle cx={n.x} cy={n.y} r={R} /></clipPath>
        ))}
      </defs>

      {nodes.map((n, i) => {
        const g = geometry(n, nodes[(i + 1) % 3], centre);
        const delay = 0.5 + i * 0.7;
        return (
          <g key={"a" + i}>
            <path className="xp-arrow" pathLength="1" d={g.d} style={{ animationDelay: delay + "s" }} />
            <polygon className="xp-head" points={g.head} style={{ animationDelay: delay + 0.85 + "s" }} />
          </g>
        );
      })}

      {nodes.map((n, i) => {
        const p = people[n.id] || {};
        const name = n.id === meId ? "You" : first(p.name);
        const photo = p.photoURL || photoFor(p.name);
        const below = n.y + R + 18;
        return (
          <g key={"n" + i}>
            <g className="xp-node" style={{ animationDelay: i * 0.25 + "s" }}>
              <circle cx={n.x} cy={n.y} r={R} fill="var(--color-primary-soft)" />
              <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-text)">
                {name[0]}
              </text>
              {photo && (
                <image href={photo} x={n.x - R} y={n.y - R} width={R * 2} height={R * 2}
                  preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}-c${i})`} />
              )}
              <circle cx={n.x} cy={n.y} r={R} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            </g>
            <g className="xp-label" style={{ animationDelay: 1 + i * 0.3 + "s" }}>
              <text x={n.x} y={below} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-text)">{name}</text>
              <text x={n.x} y={below + 15} textAnchor="middle" fontSize="11.5" fill="var(--color-text-muted)">gives {n.offer}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
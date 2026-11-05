export default function Skeleton({ height = 120, style }) {
  return <div className="xp-skel" style={{ height, ...style }} aria-hidden="true" />;
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="xp-skel-grid" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="xp-skel" style={{ height: 240 }} />
      ))}
    </div>
  );
}
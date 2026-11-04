const MAP = {
  pending_approval: ["Pending approval", "var(--color-pending-bg)", "var(--color-pending-fg)"],
  accepted: ["Accepted", "var(--color-accepted-bg)", "var(--color-accepted-fg)"],
  in_progress: ["In progress", "var(--color-progress-bg)", "var(--color-progress-fg)"],
  awaiting_confirmation: ["Awaiting confirmation", "var(--color-awaiting-bg)", "var(--color-awaiting-fg)"],
  completed: ["Completed", "var(--color-accepted-bg)", "var(--color-accepted-fg)"],
  cancelled: ["Cancelled", "#FBE4E4", "var(--color-danger)"],
};

export default function StatusChip({ status }) {
  const [label, bg, fg] = MAP[status] || [status, "var(--color-progress-bg)", "var(--color-progress-fg)"];
  return (
    <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
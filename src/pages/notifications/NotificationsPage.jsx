import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchNotifications, markRead, markAllRead } from "../../services/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);

  useEffect(() => watchNotifications(user.uid, setList), [user.uid]);
  if (!list) return <p>Loading…</p>;

  const open = async (n) => {
    if (!n.read) await markRead(n.id);
    if (n.exchangeId) navigate("/exchanges/" + n.exchangeId);
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>My activity</h1>
        <button className="link-btn" onClick={() => markAllRead(user.uid)}>Mark all read</button>
      </div>
      {list.length === 0 && <p className="muted">No activity yet.</p>}
      {list.map((n) => (
        <div key={n.id} className="card" onClick={() => open(n)} style={{ cursor: "pointer", borderColor: n.read ? undefined : "var(--color-primary)" }}>
          <strong>{n.title}</strong>
          <p style={{ margin: "4px 0 0" }}>{n.body}</p>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>{n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Just now"}</p>
        </div>
      ))}
    </div>
  );
}
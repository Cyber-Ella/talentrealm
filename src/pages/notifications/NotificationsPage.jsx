import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchNotifications, markRead, markAllRead } from "../../services/notifications";

const dateValue = (value) => value?.seconds ? value.seconds * 1000 : Number(value) || 0;

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setList(null);
    return watchNotifications(user.uid, setList, (e) => {
      console.error("Notification listener failed", e);
      setError("Notifications could not load. Check your connection and Firestore rules.");
      setList([]);
    });
  }, [user.uid]);

  const open = async (n) => {
    try {
      if (!n.read) await markRead(n.id);
      if (n.exchangeId) navigate("/exchanges/" + n.exchangeId);
    } catch (e) { setError("Could not mark this notification as read: " + e.message); }
  };
  const readAll = async () => {
    setBusy(true); setError("");
    try { await markAllRead(user.uid); }
    catch (e) { setError("Could not mark notifications as read: " + e.message); }
    finally { setBusy(false); }
  };

  if (!list) return <div className="tr-activity-loading">Loading your activity…</div>;
  return <main className="tr-activity-page">
    <header className="tr-activity-heading"><div><span className="tr-eyebrow">THE LATEST FROM YOUR REALM</span><h1>Your <em>activity</em></h1><p>Updates, responses, and moments that move your exchanges forward.</p></div><button className="tr-mark-read" disabled={busy || !list.some((n) => !n.read)} onClick={readAll}>{busy ? "Updating…" : "Mark all as read ↗"}</button></header>
    {error && <p role="alert" className="error-message">{error}</p>}
    {list.length === 0 ? <div className="tr-activity-empty"><span>✳</span><h2>Quiet for now.</h2><p>When someone responds to an exchange or you have an update, it will appear here.</p></div> : <div className="tr-activity-list">{list.map((n) => <button key={n.id} className={"tr-activity-item" + (n.read ? " is-read" : " is-unread")} onClick={() => open(n)}><span className="tr-activity-dot"/><div className="tr-activity-copy"><strong>{n.title}</strong><p>{n.body}</p><time>{dateValue(n.createdAt) ? new Date(dateValue(n.createdAt)).toLocaleString() : "Just now"}</time></div><span className="tr-activity-arrow">↗</span></button>)}</div>}
  </main>;
}

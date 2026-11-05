import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchNotifications, markRead, markAllRead } from "../../services/notifications";
export default function NotificationsPage() {
  const { user } = useAuth(); const navigate = useNavigate(); const [list,setList]=useState(null);
  useEffect(()=>watchNotifications(user.uid,setList),[user.uid]);
  if(!list) return <div className="tr-activity-loading">Loading your activity…</div>;
  const open=async n=>{if(!n.read) await markRead(n.id);if(n.exchangeId) navigate("/exchanges/"+n.exchangeId);};
  return <main className="tr-activity-page"><header className="tr-activity-heading"><div><span className="tr-eyebrow">THE LATEST FROM YOUR REALM</span><h1>Your <em>activity</em></h1><p>Updates, responses, and moments that move your exchanges forward.</p></div><button className="tr-mark-read" onClick={()=>markAllRead(user.uid)}>Mark all as read ↗</button></header>
  {list.length===0?<div className="tr-activity-empty"><span>✳</span><h2>Quiet for now.</h2><p>When someone responds to an exchange or you have an update, it will appear here.</p></div>:<div className="tr-activity-list">{list.map(n=><button key={n.id} className={"tr-activity-item"+(n.read?" is-read":" is-unread")} onClick={()=>open(n)}><span className="tr-activity-dot"/><div className="tr-activity-copy"><strong>{n.title}</strong><p>{n.body}</p><time>{n.createdAt?.seconds?new Date(n.createdAt.seconds*1000).toLocaleString():"Just now"}</time></div><span className="tr-activity-arrow">↗</span></button>)}</div>}</main>;
}

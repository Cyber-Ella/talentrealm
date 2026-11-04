import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchMyExchanges } from "../../services/exchanges";

const chips = {
  pending_approval: { label: "Pending", bg: "#fff1c9", color: "#8a6100", tab: "Pending" },
  accepted: { label: "Active", bg: "#d9f5e5", color: "#1d7a4a", tab: "Active" },
  completed: { label: "Completed", bg: "#e6e0f7", color: "#4a2a9a", tab: "Completed" },
  cancelled: { label: "Declined", bg: "#fde0e0", color: "#a12a2a", tab: "Declined" },
};

const tabs = ["All", "Pending", "Active", "Completed"];

export default function ExchangesPage() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [tab, setTab] = useState("All");

  useEffect(() => {
    if (!user) return;
    const stop = watchMyExchanges(user.uid, setExchanges);
    return stop;
  }, [user]);

  const shown = exchanges.filter(
    (ex) => tab === "All" || chips[ex.status]?.tab === tab
  );

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", background: "#f1edfb", minHeight: "100vh" }}>
      <div style={{ background: "#25104f", color: "white", padding: 16, fontWeight: 700 }}>
        My exchanges
      </div>

      <div style={{ padding: 16 }}>
        <h3 style={{ color: "#25104f" }}>Keep track of your swaps</h3>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                borderRadius: 10,
                color: tab === t ? "white" : "#333",
                background: tab === t ? "#5b2fb5" : "white",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {shown.length === 0 && <p style={{ color: "#777" }}>No exchanges yet.</p>}

        {shown.map((ex) => {
          const chip = chips[ex.status] || { label: ex.status, bg: "#eee", color: "#333" };
          const otherId = ex.participants.find((p) => p !== user.uid);
          const otherName = ex.participantNames?.[otherId] || "Student";
          return (
            <div key={ex.id} style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <span style={{ background: chip.bg, color: chip.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                {chip.label}
              </span>
              <p style={{ fontWeight: 700, margin: "10px 0 2px" }}>You ↔ {otherName}</p>
              <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
                {ex.items.map((i) => i.title).join(" · ")}
              </p>
              <Link to={`/exchanges/${ex.id}`} style={{ fontSize: 13, color: "#5b2fb5", fontWeight: 600 }}>
                View exchange
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
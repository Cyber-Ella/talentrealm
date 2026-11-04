import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  watchMyExchanges,
  respondToExchange,
  counterTopUp,
} from "../../services/exchanges";

export default function ExchangeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exchange, setExchange] = useState(null);
  const [choice, setChoice] = useState("accepted");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const stop = watchMyExchanges(user.uid, (list) => {
      setExchange(list.find((ex) => ex.id === id) || null);
    });
    return stop;
  }, [user, id]);

  if (!exchange) return <p style={{ padding: 16 }}>Loading exchange...</p>;

  const otherId = exchange.participants.find((p) => p !== user.uid);
  const otherName = exchange.participantNames?.[otherId] || "Student";
  const myAnswer = exchange.approvals?.[user.uid];

  async function send() {
    setBusy(true);
    try {
      if (choice === "counter") {
        await counterTopUp(id, user.uid, amount);
      } else {
        await respondToExchange(id, user.uid, choice);
      }
      navigate("/exchanges");
    } finally {
      setBusy(false);
    }
  }

  const card = { background: "white", borderRadius: 14, padding: 14, marginBottom: 12 };
  const options = [
    { id: "accepted", label: "Accept proposed arrangement" },
    { id: "counter", label: "Suggest different terms" },
    { id: "declined", label: "Decline request" },
  ];

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", background: "#f1edfb", minHeight: "100vh" }}>
      <div style={{ background: "#25104f", color: "white", padding: 16, fontWeight: 700 }}>
        Review exchange proposal
      </div>

      <div style={{ padding: 16 }}>
        <div style={card}>
          <strong>{otherName}</strong>
          <div style={{ fontSize: 13, color: "#777" }}>Status: {exchange.status}</div>
        </div>

        <h4 style={{ color: "#25104f" }}>What each person provides</h4>
        {exchange.items.map((item, i) => (
          <div key={i} style={card}>
            <strong>{item.title}</strong>
            <div style={{ fontSize: 13, color: "#777" }}>
              From {exchange.participantNames?.[item.providerId] || "Student"}
            </div>
            <div style={{ fontSize: 13, color: "#5b2fb5" }}>
              Suggested value: ₦{Number(item.estimatedValue || 0).toLocaleString()}
            </div>
          </div>
        ))}

        <div style={{ ...card, background: "#e6e0f7" }}>
          <small>Proposed top-up</small>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            ₦{Number(exchange.topUp?.amount || 0).toLocaleString()}
          </div>
        </div>

        {myAnswer === "pending" ? (
          <>
            <h4 style={{ color: "#25104f" }}>Your response</h4>
            {options.map((o) => (
              <label key={o.id} style={{ ...card, display: "block", marginBottom: 8, border: choice === o.id ? "2px solid #5b2fb5" : "1px solid #ddd" }}>
                <input type="radio" checked={choice === o.id} onChange={() => setChoice(o.id)} /> {o.label}
              </label>
            ))}

            {choice === "counter" && (
              <input
                type="number"
                placeholder="Your suggested top-up (₦)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 10, border: "1px solid #ddd", marginBottom: 12 }}
              />
            )}

            <button
              onClick={send}
              disabled={busy}
              style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "#ffb92e", color: "#25104f", fontWeight: 700 }}
            >
              {busy ? "Sending..." : "Send response"}
            </button>
          </>
        ) : (
          <p style={{ color: "#777" }}>
            You have already responded ({myAnswer}). Waiting for the other student.
          </p>
        )}
      </div>
    </div>
  );
}
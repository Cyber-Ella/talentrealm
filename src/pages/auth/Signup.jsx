import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../../services/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", department: "", level: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="auth-star">★</span>
        <h1>TalentRealm</h1>
        <p>Join your campus talent community.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>Create your account</h2>
        <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
        <input name="email" type="email" placeholder="School email" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={change} required />
        <input name="department" placeholder="Department" value={form.department} onChange={change} required />
        <input name="level" placeholder="Level (e.g. 300)" value={form.level} onChange={change} required />
        {error && <p style={{ color: "#8A1C1C" }}>{error}</p>}
        <button disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
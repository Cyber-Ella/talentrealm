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
    <form onSubmit={submit}>
      <h1>Create your account</h1>
      <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
      <input name="email" type="email" placeholder="School email" value={form.email} onChange={change} required />
      <input name="password" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={change} required />
      <input name="department" placeholder="Department" value={form.department} onChange={change} required />
      <input name="level" placeholder="Level (e.g. 300)" value={form.level} onChange={change} required />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}
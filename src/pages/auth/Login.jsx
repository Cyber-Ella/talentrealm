import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logIn } from "../../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(email, password);
      navigate("/");
    } catch {
      setError("Wrong email or password.");
    }
  };

  return (
    <form onSubmit={submit}>
      <h1>Log in</h1>
      <input type="email" placeholder="School email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button>Log in</button>
      <p>New here? <Link to="/signup">Create an account</Link></p>
    </form>
  );
}
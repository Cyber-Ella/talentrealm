import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Hello, {user.displayName}</h1>
      <p>Explore talents, services and opportunities around you.</p>
    </div>
  );
}
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const cycleTheme = () => {
    const next =
      preference === "dark" ? "light" : preference === "light" ? "system" : "dark";
    setPreference(next);
  };

  return (
    <button
      className="tr-theme-toggle"
      type="button"
      onClick={cycleTheme}
      aria-label={`Theme: ${preference}. Change theme`}
      title={`Theme: ${preference} (click to change)`}
    >
      <span aria-hidden="true">
        {preference === "light" ? "☀" : preference === "system" ? "◐" : "☾"}
      </span>
      <span className="tr-theme-toggle-label">{preference}</span>
    </button>
  );
}

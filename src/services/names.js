export function nameFromEmail(email = "") {
const value = String(email).split("@")[0] || "";
return value
.replace(/[._-]+/g, " ")
.replace(/\s+/g, " ")
.trim()
.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function studentName(user = {}) {
const fullName =
user.displayName ||
user.fullName ||
user.name ||
"";

if (fullName.trim()) {
return fullName.trim();
}

return nameFromEmail(user.email) || "TalentRealm Member";
}

// One place decides how a student's name is shown. Older listings may have stored the
// placeholder "TalentRealm member", so treat that (and blanks) as "no name".
export const FALLBACK_NAME = "Student";

export function studentName(...candidates) {
  for (const c of candidates) {
    const n = String(c ?? "").trim();
    if (n && !/^talent\s?realm member$/i.test(n)) return n;
  }
  return FALLBACK_NAME;
}

export function nameFromEmail(email) {
  const local = String(email ?? "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

export const firstName = (...candidates) => studentName(...candidates).split(" ")[0];

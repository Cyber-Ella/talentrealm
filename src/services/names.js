
/**
 * Centralized student-name handling.
 * Supports both individual name candidates and user/profile objects.
 * Ignores old "TalentRealm member" placeholders.
 */

export const FALLBACK_NAME = "Student";

export function nameFromEmail(email = "") {
  const value = String(email).split("@")[0] || "";

  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function studentName(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;

    // Support profile/user objects from Firebase or Firestore.
    if (typeof candidate === "object") {
      const possibleNames = [
        candidate.displayName,
        candidate.fullName,
        candidate.name,
      ];

      for (const value of possibleNames) {
        const name = String(value ?? "").trim();

        if (name && !/^talent\s?realm member$/i.test(name)) {
          return name;
        }
      }

      const emailName = nameFromEmail(candidate.email);
      if (emailName) return emailName;

      continue;
    }

    // Support direct name strings.
    const name = String(candidate).trim();

    if (
      name &&
      !/^talent\s?realm member$/i.test(name)
    ) {
      return name;
    }
  }

  return FALLBACK_NAME;
}

export const firstName = (...candidates) =>
  studentName(...candidates).split(" ")[0];

import { EMAIL_REAL_LOOKALIKES, EMAIL_TYPO_MAX_DISTANCE, EMAIL_TYPO_TARGETS } from "@/constants/email";

const KNOWN_DOMAINS = new Set<string>([...EMAIL_TYPO_TARGETS, ...EMAIL_REAL_LOOKALIKES]);

// The address with its domain corrected, when the domain looks like a typo
// of a major provider ("john@gmial.com" -> "john@gmail.com"); otherwise null.
// Only a hint: the user decides.
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at).trim();
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (domain.length < 4 || KNOWN_DOMAINS.has(domain)) return null;

  let best: { target: string; distance: number } | null = null;
  for (const target of EMAIL_TYPO_TARGETS) {
    const distance = editDistance(domain, target);
    if (distance <= EMAIL_TYPO_MAX_DISTANCE && (!best || distance < best.distance)) {
      best = { target, distance };
    }
  }
  return best ? `${local}@${best.target}` : null;
}

// Levenshtein distance: the fewest single-letter insertions, deletions or
// substitutions that turn one string into the other.
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

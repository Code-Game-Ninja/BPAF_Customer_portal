import crypto from "crypto";

/**
 * Generate a random password: 10 chars, mix of upper/lower/digits/symbols.
 */
export function generatePassword(length = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$!";
  const all = upper + lower + digits + symbols;

  // Ensure at least one of each category
  let password = "";
  password += upper[crypto.randomInt(upper.length)];
  password += lower[crypto.randomInt(lower.length)];
  password += digits[crypto.randomInt(digits.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}

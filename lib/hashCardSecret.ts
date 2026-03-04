import crypto from "crypto";

export function hashCardSecret(secret: string) {
  const salt = process.env.CARD_SECRET_SALT;
  if (!salt) {
    throw new Error("CARD_SECRET_SALT not set");
  }

  return crypto
    .createHash("sha256")
    .update(secret + salt)
    .digest("hex");
}

import crypto from "crypto";

function keyBytes() {
  const hex = process.env.TOKEN_ENC_KEY;
  if (!hex) throw new Error("Missing TOKEN_ENC_KEY");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("TOKEN_ENC_KEY must be 32 bytes hex (64 hex chars)");
  return key;
}

export function encryptToken(plain) {
  const iv = crypto.randomBytes(12);
  const key = keyBytes();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(tokenEnc) {
  const buf = Buffer.from(tokenEnc, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = keyBytes();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

import crypto from "node:crypto";
import config from "../config";

// Encrypts secrets stored for users (e.g. their Vercel token) with
// AES-256-GCM, so a database leak doesn't leak them: the key lives only in
// the environment. The stored form is "v1.<iv>.<tag>.<ciphertext>", base64.
class SecretBox {
  public seal(plaintext: string): string {
    const { algorithm, ivBytes, version } = config.secrets;
    const iv = crypto.randomBytes(ivBytes);
    const cipher = crypto.createCipheriv(algorithm, config.secrets.encryptionKey, iv) as crypto.CipherGCM;
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return [version, iv, cipher.getAuthTag(), ciphertext]
      .map((part) => (typeof part === "string" ? part : part.toString("base64")))
      .join(".");
  }

  // Null when the value was altered, or sealed with another key.
  public open(sealed: string): string | null {
    const [version, iv, tag, ciphertext] = sealed.split(".");
    if (version !== config.secrets.version || !iv || !tag || !ciphertext) return null;

    const decipher = crypto.createDecipheriv(
      config.secrets.algorithm,
      config.secrets.encryptionKey,
      Buffer.from(iv, "base64"),
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    const plaintext = (() => {
      try {
        return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
      } catch {
        return null;
      }
    })();
    return plaintext?.toString("utf8") ?? null;
  }
}

export const secretBox = new SecretBox();

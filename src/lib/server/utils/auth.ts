import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import config from "../config";
import { utils } from "./index";
import { CookieNames, MessageResponse, TokenAudience } from "./enum";
import { ScryptParams, SessionCheck, SessionPayload } from "./interface";

class Auth {
  private createSessionToken({ userId }: SessionPayload) {
    return new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setAudience(TokenAudience.Session)
      .setIssuedAt()
      .setExpirationTime(`${config.jwt.expiresInSeconds}s`)
      .sign(config.jwt.secret);
  }

  // No expiry: unsubscribe links must keep working in old emails. The worst
  // a leaked one can do is unsubscribe its owner.
  public createUnsubscribeToken(userId: string) {
    return new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setAudience(TokenAudience.Unsubscribe)
      .setIssuedAt()
      .sign(config.jwt.secret);
  }

  // Returns the user id, or null for a forged, altered or wrong-kind token.
  public async verifyUnsubscribeToken(token: string) {
    const result = await jwtVerify(token, config.jwt.secret, {
      algorithms: ["HS256"],
      audience: TokenAudience.Unsubscribe,
    }).catch(() => null);
    return result?.payload.sub ?? null;
  }

  // The signed-in user, or a 401 response for the route to return. Same
  // shape as a validation result, so routes check both the same way.
  public async requireSession(req: NextRequest): Promise<SessionCheck> {
    const userId = await this.sessionUserId(req.cookies.get(CookieNames.UserAuthToken)?.value);

    if (!userId) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Please sign in to continue.",
          data: null,
        }),
      };
    }
    return { valid: true, value: { userId } };
  }

  // The user a session cookie belongs to, or null for a missing, expired,
  // forged or wrong-kind token. Checks the signature only, no database.
  public async sessionUserId(token: string | undefined): Promise<string | null> {
    if (!token) return null;
    const result = await jwtVerify(token, config.jwt.secret, {
      algorithms: ["HS256"],
      audience: TokenAudience.Session,
    }).catch(() => null);
    return result?.payload.sub ?? null;
  }

  public async setSessionCookie(response: NextResponse, payload: SessionPayload) {
    response.cookies.set(
      CookieNames.UserAuthToken,
      await this.createSessionToken(payload),
      {
        httpOnly: true,
        secure: config.isProduction,
        // "lax", not "strict": the session is created at the end of a redirect
        // chain started by Google, and a strict cookie would not be sent on the
        // first page load after it, so the user would look signed out.
        sameSite: "lax",
        path: "/",
        maxAge: config.jwt.expiresInSeconds,
      },
    );
  }

  // Async scrypt keeps hashing off the event loop, unlike pbkdf2Sync.
  // The parameters are stored with the hash so they can be raised later
  // without invalidating existing passwords.
  public async hashPassword(password: string) {
    const { saltBytes, keyLength, scrypt } = config.password;
    const salt = crypto.randomBytes(saltBytes);
    const hash = await this.scrypt(password, salt, keyLength);
    return [
      "scrypt",
      scrypt.N,
      scrypt.r,
      scrypt.p,
      salt.toString("base64"),
      hash.toString("base64"),
    ].join("$");
  }

  // Reads the parameters from the stored hash, so passwords hashed with
  // older settings still verify after config.password.scrypt is raised.
  // With no stored hash it still runs one scrypt against a dummy, so a login
  // for an unknown email takes as long as one with a wrong password.
  public async verifyPassword(password: string, storedHash: string | undefined) {
    const [algorithm, N, r, p, salt, hash] = (storedHash ?? (await this.getDummyHash())).split("$");
    if (algorithm !== "scrypt" || !salt || !hash) return false;

    const expected = Buffer.from(hash, "base64");
    const derived = await this.scrypt(password, Buffer.from(salt, "base64"), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });

    return storedHash !== undefined && crypto.timingSafeEqual(derived, expected);
  }

  public generateOtp() {
    const { length } = config.otp;
    return crypto.randomInt(0, 10 ** length).toString().padStart(length, "0");
  }

  public hashOtp(code: string) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  public isValidOtp(code: string, codeHash: string) {
    const received = Buffer.from(this.hashOtp(code), "hex");
    const expected = Buffer.from(codeHash, "hex");
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }

  private dummyHash: Promise<string> | null = null;

  private getDummyHash() {
    this.dummyHash ??= this.hashPassword(crypto.randomBytes(16).toString("hex"));
    return this.dummyHash;
  }

  private scrypt(
    password: string,
    salt: Buffer,
    keyLength: number,
    { N, r, p }: ScryptParams = config.password.scrypt,
  ) {
    const { maxmem } = config.password.scrypt;
    return new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, keyLength, { N, r, p, maxmem }, (error, key) =>
        error ? reject(error) : resolve(key),
      );
    });
  }
}

export const auth = new Auth();

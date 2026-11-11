import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import config from "../config";
import { AuthPage } from "./enum";
import { GoogleOAuthState, GoogleProfile, GoogleTokenResponse } from "./interface";

class GoogleOAuth {
  // Fetched once per instance and cached by jose; refetched on key rotation.
  private jwks = createRemoteJWKSet(new URL(config.google.jwksUrl));

  private randomToken() {
    return crypto.randomBytes(32).toString("base64url");
  }

  public createState(
    redirectTo: string,
    authPage: AuthPage,
    marketingOptIn: boolean,
  ): GoogleOAuthState {
    return {
      state: this.randomToken(),
      nonce: this.randomToken(),
      codeVerifier: this.randomToken(),
      redirectTo,
      authPage,
      marketingOptIn,
    };
  }

  public getAuthorizationUrl({ state, nonce, codeVerifier }: GoogleOAuthState) {
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    const url = new URL(config.google.authUrl);
    url.search = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();

    return url.toString();
  }

  public isValidState(expected: string, received: string) {
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // Exchanges the authorization code and verifies the returned ID token's
  // signature, issuer, audience and nonce before trusting any claim in it.
  public async getProfile(
    code: string,
    { nonce, codeVerifier }: GoogleOAuthState,
  ): Promise<GoogleProfile> {
    const tokenResponse = await fetch(config.google.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed with status ${tokenResponse.status}`);
    }

    const { id_token: idToken } = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!idToken) {
      throw new Error("Google token response did not include an id_token");
    }

    const { payload } = await jwtVerify(idToken, this.jwks, {
      issuer: config.google.issuers,
      audience: config.google.clientId,
    });

    if (payload.nonce !== nonce) {
      throw new Error("Google ID token nonce mismatch");
    }

    if (!payload.sub || typeof payload.email !== "string") {
      throw new Error("Google ID token is missing sub or email");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === "string" ? payload.name : undefined,
      avatarUrl: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  }
}

export const googleOAuth = new GoogleOAuth();

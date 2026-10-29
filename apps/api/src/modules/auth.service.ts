import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";
import { prisma, sanitizeText } from "./db.service";

interface TokenPayload {
  sub: string; // sessionId
  email?: string;
  iat: number;
  exp: number;
}

export interface SafeUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  createdAt: string;
}

// In-memory rate limiter for brute-force protection (IP / email based)
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}
const loginRateLimiter = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = loginRateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    loginRateLimiter.set(key, { attempts: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.attempts >= maxAttempts) {
    return false;
  }

  entry.attempts += 1;
  return true;
}

function clearRateLimit(key: string) {
  loginRateLimiter.delete(key);
}

export class AuthService {
  private secret: string;

  constructor() {
    this.secret =
      process.env.SUPABASE_JWT_SECRET ||
      process.env.SESSION_SECRET ||
      "musify_high_entropy_secret_2026_salt_8923487293";
  }

  /**
   * Hashes a password using Argon2id on Bun or scrypt on Node.js
   */
  async hashPassword(password: string): Promise<string> {
    if (typeof Bun !== "undefined" && (Bun as any)?.password?.hash) {
      return await (Bun as any).password.hash(password, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 2,
      });
    }
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64);
    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
  }

  /**
   * Verifies password using constant-time comparison
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      if (typeof Bun !== "undefined" && (Bun as any)?.password?.verify && !hash.startsWith("scrypt:")) {
        return await (Bun as any).password.verify(password, hash);
      }
      if (hash.startsWith("scrypt:")) {
        const parts = hash.split(":");
        if (parts.length !== 3) return false;
        const [, salt, key] = parts;
        const derivedKey = scryptSync(password, salt, 64);
        const storedKey = Buffer.from(key, "hex");
        return timingSafeEqual(storedKey, derivedKey);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generates a tamper-proof cryptographically signed JWT token
   */
  createToken(sessionId: string, email?: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload: TokenPayload = {
      sub: sessionId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    return `${header}.${body}.${signature}`;
  }

  /**
   * Verifies token with constant-time signature comparison to eliminate timing attacks
   */
  verifyToken(token: string): TokenPayload | null {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = createHmac("sha256", this.secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    try {
      const payload: TokenPayload = JSON.parse(
        Buffer.from(body, "base64url").toString("utf8"),
      );

      // Check token expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Converts DB session to public user shape (NEVER leaks hashes)
   */
  toSafeUser(user: {
    id: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    isAnonymous: boolean;
    emailVerified?: boolean;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      displayName:
        user.displayName ||
        (user.isAnonymous ? "Guest Listener" : user.email?.split("@")[0] || "User"),
      avatarUrl: user.avatarUrl,
      isAnonymous: user.isAnonymous,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Register a new user with 6-digit email verification
   */
  async register(
    emailRaw: string,
    passwordRaw: string,
    displayNameRaw?: string,
    currentSessionId?: string,
  ): Promise<{
    user: SafeUser;
    token: string;
    requiresVerification: boolean;
    debugCode?: string;
  }> {
    const email = emailRaw?.trim().toLowerCase();
    const password = passwordRaw?.trim();

    // 1. Strict Email Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      throw new Error("Invalid email address format.");
    }

    // 2. Strict Password Policy (8-100 characters)
    if (!password || password.length < 8 || password.length > 100) {
      throw new Error("Password must be between 8 and 100 characters long.");
    }

    // Check if email already registered
    const existingEmail = await prisma.userSession.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const passwordHash = await this.hashPassword(password);
    const displayName = displayNameRaw ? sanitizeText(displayNameRaw, 60) : email.split("@")[0];

    // Generate 6-digit OTP verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeHash = createHmac("sha256", this.secret)
      .update(verificationCode)
      .digest("hex");
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    console.log(`\n======================================================`);
    console.log(`[MUSIFY EMAIL VERIFICATION CODE] for ${email}: ${verificationCode}`);
    console.log(`======================================================\n`);

    let userSession;

    // Seamless Guest-to-Account Upgrade: If current session is an anonymous guest, upgrade it directly
    if (currentSessionId && /^[a-zA-Z0-9_-]{10,64}$/.test(currentSessionId)) {
      const current = await prisma.userSession.findUnique({
        where: { id: currentSessionId },
      });

      if (current && current.isAnonymous) {
        userSession = await prisma.userSession.update({
          where: { id: currentSessionId },
          data: {
            isAnonymous: false,
            email,
            emailVerified: false,
            passwordHash,
            displayName,
            verificationCodeHash,
            verificationExpiresAt,
            lastLoginAt: new Date(),
          },
        });
      }
    }

    // Otherwise create fresh user session
    if (!userSession) {
      userSession = await prisma.userSession.create({
        data: {
          isAnonymous: false,
          email,
          emailVerified: false,
          passwordHash,
          displayName,
          verificationCodeHash,
          verificationExpiresAt,
          lastLoginAt: new Date(),
        },
      });
    }

    const token = this.createToken(userSession.id, email);
    return {
      user: this.toSafeUser(userSession),
      token,
      requiresVerification: true,
      debugCode: verificationCode,
    };
  }

  /**
   * Authenticate an existing user with brute-force protection & guest data migration
   */
  async login(
    emailRaw: string,
    passwordRaw: string,
    currentSessionId?: string,
    clientIp: string = "unknown",
  ): Promise<{
    user: SafeUser;
    token: string;
    requiresVerification: boolean;
    debugCode?: string;
  }> {
    const email = emailRaw?.trim().toLowerCase();
    const password = passwordRaw?.trim();

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    // Rate-limit check (max 5 failed attempts per 15 mins per IP/email)
    const rateLimitKey = `${clientIp}_${email}`;
    if (!checkRateLimit(rateLimitKey)) {
      throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
    }

    const user = await prisma.userSession.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    // Clear rate limiter on successful authentication
    clearRateLimit(rateLimitKey);

    // If account was created but not verified, require verification
    if (!user.emailVerified && !user.isAnonymous) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeHash = createHmac("sha256", this.secret)
        .update(verificationCode)
        .digest("hex");

      await prisma.userSession.update({
        where: { id: user.id },
        data: {
          verificationCodeHash,
          verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      console.log(`\n======================================================`);
      console.log(`[MUSIFY UNVERIFIED LOGIN CODE] for ${email}: ${verificationCode}`);
      console.log(`======================================================\n`);

      return {
        user: this.toSafeUser(user),
        token: "",
        requiresVerification: true,
        debugCode: verificationCode,
      };
    }

    // If current session was an anonymous guest with data, merge its playlists and favorites!
    if (
      currentSessionId &&
      currentSessionId !== user.id &&
      /^[a-zA-Z0-9_-]{10,64}$/.test(currentSessionId)
    ) {
      await this.mergeAnonymousData(currentSessionId, user.id);
    }

    await prisma.userSession.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.createToken(user.id, user.email || undefined);
    return {
      user: this.toSafeUser(user),
      token,
      requiresVerification: false,
    };
  }

  /**
   * Validates 6-digit email OTP and activates the account
   */
  async verifyEmail(
    emailRaw: string,
    codeRaw: string,
  ): Promise<{ user: SafeUser; token: string }> {
    const email = emailRaw?.trim().toLowerCase();
    const code = codeRaw?.trim();

    if (!email || !code || code.length !== 6) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    const user = await prisma.userSession.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Account not found.");
    }

    if (user.emailVerified) {
      const token = this.createToken(user.id, user.email || undefined);
      return { user: this.toSafeUser(user), token };
    }

    if (!user.verificationCodeHash || !user.verificationExpiresAt) {
      throw new Error("Verification code expired or not requested. Please request a new code.");
    }

    if (new Date() > user.verificationExpiresAt) {
      throw new Error("Verification code has expired. Please request a new code.");
    }

    const expectedHash = createHmac("sha256", this.secret)
      .update(code)
      .digest("hex");

    const inputBuf = Buffer.from(expectedHash);
    const storedBuf = Buffer.from(user.verificationCodeHash);

    if (inputBuf.length !== storedBuf.length || !timingSafeEqual(inputBuf, storedBuf)) {
      throw new Error("Incorrect verification code. Please check and try again.");
    }

    const updated = await prisma.userSession.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCodeHash: null,
        verificationExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    const token = this.createToken(updated.id, updated.email || undefined);
    return {
      user: this.toSafeUser(updated),
      token,
    };
  }

  /**
   * Resends a fresh 6-digit OTP code to the user's email
   */
  async resendVerificationCode(
    emailRaw: string,
  ): Promise<{ success: boolean; debugCode: string }> {
    const email = emailRaw?.trim().toLowerCase();
    const user = await prisma.userSession.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Account not found.");
    }

    if (user.emailVerified) {
      throw new Error("This email is already verified.");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeHash = createHmac("sha256", this.secret)
      .update(verificationCode)
      .digest("hex");
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    console.log(`\n======================================================`);
    console.log(`[MUSIFY RESENT EMAIL VERIFICATION CODE] for ${email}: ${verificationCode}`);
    console.log(`======================================================\n`);

    await prisma.userSession.update({
      where: { id: user.id },
      data: {
        verificationCodeHash,
        verificationExpiresAt,
      },
    });

    return { success: true, debugCode: verificationCode };
  }

  /**
   * Merges playlists, favorites, and history from a guest session into an authenticated account
   */
  async mergeAnonymousData(guestId: string, targetUserId: string) {
    try {
      // Re-assign custom playlists to target user
      await prisma.playlist.updateMany({
        where: { userId: guestId },
        data: { userId: targetUserId },
      });

      // Migrate favorites (avoiding duplicate collisions)
      const guestFavs = await prisma.favoriteTrack.findMany({
        where: { userId: guestId },
      });

      for (const fav of guestFavs) {
        const exists = await prisma.favoriteTrack.findUnique({
          where: {
            userId_trackId: {
              userId: targetUserId,
              trackId: fav.trackId,
            },
          },
        });
        if (!exists) {
          await prisma.favoriteTrack.create({
            data: {
              userId: targetUserId,
              trackId: fav.trackId,
              title: fav.title,
              artistsJson: fav.artistsJson,
              albumTitle: fav.albumTitle,
              artworkUrl: fav.artworkUrl,
              durationMs: fav.durationMs,
              sourceTrackId: fav.sourceTrackId,
            },
          });
        }
      }

      // Clean up orphaned guest session
      await prisma.userSession.delete({
        where: { id: guestId },
      }).catch(() => {});
    } catch (err) {
      console.warn("Failed to merge anonymous data:", err);
    }
  }

  /**
   * Resolves current user from Bearer Token or Session Header
   */
  async resolveUser(authToken?: string, sessionIdHeader?: string): Promise<SafeUser> {
    // 1. Try Bearer JWT token first
    if (authToken) {
      const cleanToken = authToken.replace(/^Bearer\s+/i, "").trim();
      const payload = this.verifyToken(cleanToken);
      if (payload && payload.sub) {
        const user = await prisma.userSession.findUnique({
          where: { id: payload.sub },
        });
        if (user) {
          return this.toSafeUser(user);
        }
      }
    }

    // 2. Try session ID header (Guest / Anonymous user)
    const cleanSession = sessionIdHeader?.trim();
    if (cleanSession && /^[a-zA-Z0-9_-]{10,64}$/.test(cleanSession)) {
      const existing = await prisma.userSession.findUnique({
        where: { id: cleanSession },
      });
      if (existing) {
        return this.toSafeUser(existing);
      }

      const created = await prisma.userSession.create({
        data: { id: cleanSession, isAnonymous: true },
      });
      return this.toSafeUser(created);
    }

    // 3. Fallback: create fresh anonymous guest
    const fresh = await prisma.userSession.create({
      data: { isAnonymous: true },
    });
    return this.toSafeUser(fresh);
  }

  /**
   * Update User Profile (display name & avatar)
   */
  async updateProfile(
    userId: string,
    displayNameRaw?: string,
    avatarUrlRaw?: string,
  ): Promise<SafeUser> {
    const data: { displayName?: string; avatarUrl?: string } = {};

    if (displayNameRaw !== undefined) {
      data.displayName = sanitizeText(displayNameRaw, 60) || "User";
    }
    if (avatarUrlRaw !== undefined) {
      data.avatarUrl = sanitizeText(avatarUrlRaw, 300);
    }

    const updated = await prisma.userSession.update({
      where: { id: userId },
      data,
    });

    return this.toSafeUser(updated);
  }

  /**
   * Secure Password Change with old password verification
   */
  async changePassword(
    userId: string,
    oldPasswordRaw: string,
    newPasswordRaw: string,
  ): Promise<boolean> {
    const user = await prisma.userSession.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new Error("User does not have an active password.");
    }

    const isValid = await this.verifyPassword(oldPasswordRaw, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect.");
    }

    const newPassword = newPasswordRaw?.trim();
    if (!newPassword || newPassword.length < 8 || newPassword.length > 100) {
      throw new Error("New password must be between 8 and 100 characters long.");
    }

    const newHash = await this.hashPassword(newPassword);
    await prisma.userSession.update({
      where: { id: userId },
      data: { passwordHash: newHash, updatedAt: new Date() },
    });

    return true;
  }
}

export const authService = new AuthService();


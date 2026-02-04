import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { loginSchema, registerSchema, oauthLoginSchema } from "../shared/schema";
import { OAuth2Client } from "google-auth-library";
import { isBuilder } from "./builder-mode";

const JWT_SECRET = process.env.SESSION_SECRET || "fotobox-secret-key";
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const googleClient = new OAuth2Client();
console.log(`Google OAuth client IDs loaded: ${GOOGLE_CLIENT_IDS.length}`);

const TEST_UNLIMITED_EMAILS = (process.env.TEST_UNLIMITED_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const isTestUnlimitedUser = (user?: { email?: string | null; username?: string | null }) => {
  if (!user) return false;
  const email = user.email?.trim().toLowerCase();
  const username = user.username?.trim().toLowerCase();
  return Boolean(
    (email && TEST_UNLIMITED_EMAILS.includes(email)) ||
      (username && TEST_UNLIMITED_EMAILS.includes(username)),
  );
};

const applyUnlimitedOverride = (
  subscription: {
    plan: string;
    status: string;
    creditsRemaining: number;
    creditsTotal: number;
    expiresAt: Date | null;
  } | null,
  user?: { email?: string | null; username?: string | null },
) => {
  if (!subscription) return null;
  if (!isTestUnlimitedUser(user)) return subscription;
  return {
    plan: "unlimited",
    status: "active",
    creditsRemaining: -1,
    creditsTotal: -1,
    expiresAt: null,
  };
};

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: unknown) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded as { id: string; username: string };
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (!err) {
        req.user = decoded as { id: string; username: string };
      }
      next();
    });
  } else {
    next();
  }
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { username, password } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser(username, password);
      const subscription = applyUnlimitedOverride(
        await storage.getSubscription(user.id),
        user,
      );

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          isBuilder: isBuilder(user.id),
        },
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              creditsRemaining: subscription.creditsRemaining,
              creditsTotal: subscription.creditsTotal,
              expiresAt: subscription.expiresAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { username, password } = parsed.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isValid = await storage.validatePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const subscription = applyUnlimitedOverride(
        await storage.getSubscription(user.id),
        user,
      );

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          isBuilder: isBuilder(user.id),
        },
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              creditsRemaining: subscription.creditsRemaining,
              creditsTotal: subscription.creditsTotal,
              expiresAt: subscription.expiresAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/oauth", async (req: Request, res: Response) => {
    try {
      const parsed = oauthLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { provider, idToken, email, displayName, avatarUrl } = parsed.data;
      let providerId: string;
      let verifiedEmail = email;
      let verifiedName = displayName;
      let verifiedAvatar = avatarUrl;

      if (provider === "google") {
        try {
          if (GOOGLE_CLIENT_IDS.length === 0) {
            return res.status(500).json({ error: "Google client IDs not configured" });
          }
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_IDS,
          });
          const payload = ticket.getPayload();
          if (!payload) {
            return res.status(401).json({ error: "Invalid Google token" });
          }
          providerId = payload.sub;
          verifiedEmail = payload.email || email;
          verifiedName = payload.name || displayName;
          verifiedAvatar = payload.picture || avatarUrl;
        } catch (error) {
          console.error("Google token verification error:", error);
          return res.status(401).json({ error: "Invalid Google token" });
        }
      } else if (provider === "apple") {
        providerId = idToken;
      } else {
        return res.status(400).json({ error: "Unsupported provider" });
      }

      let user = await storage.getUserByProviderId(provider, providerId);

      if (!user) {
        user = await storage.createOAuthUser({
          provider,
          providerId,
          email: verifiedEmail,
          displayName: verifiedName,
          avatarUrl: verifiedAvatar,
        });
      }

      const subscription = applyUnlimitedOverride(
        await storage.getSubscription(user.id),
        user,
      );

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isBuilder: isBuilder(user.id),
        },
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              creditsRemaining: subscription.creditsRemaining,
              creditsTotal: subscription.creditsTotal,
              expiresAt: subscription.expiresAt,
            }
          : null,
      });
    } catch (error) {
      console.error("OAuth error:", error);
      res.status(500).json({ error: "OAuth login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = applyUnlimitedOverride(
        await storage.getSubscription(user.id),
        user,
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          isBuilder: isBuilder(user.id),
        },
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              creditsRemaining: subscription.creditsRemaining,
              creditsTotal: subscription.creditsTotal,
              expiresAt: subscription.expiresAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  app.post("/api/subscription/use-credit", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { action } = req.body;
      const result = await storage.useCredit(req.user.id, action || "generate");

      if (!result.success) {
        return res.status(402).json({ 
          error: result.message || "No credits remaining",
          creditsRemaining: result.creditsRemaining,
          requiresUpgrade: true,
        });
      }

      res.json({
        success: true,
        creditsRemaining: result.creditsRemaining,
      });
    } catch (error) {
      console.error("Use credit error:", error);
      res.status(500).json({ error: "Failed to use credit" });
    }
  });

  app.get("/api/subscription", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.user.id);
      const subscription = applyUnlimitedOverride(
        await storage.getSubscription(req.user.id),
        user,
      );

      if (!subscription) {
        return res.status(404).json({ error: "No subscription found" });
      }

      res.json({
        plan: subscription.plan,
        status: subscription.status,
        creditsRemaining: subscription.creditsRemaining,
        creditsTotal: subscription.creditsTotal,
        expiresAt: subscription.expiresAt,
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  app.post("/api/subscription/verify-purchase", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { productId, purchaseToken, orderId } = req.body;

      let plan = "free";
      let credits = 0;
      let expiresAt: Date | null = null;

      if (productId === "fotobox_monthly_pro") {
        plan = "pro";
        credits = 100;
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (productId === "fotobox_monthly_unlimited") {
        plan = "unlimited";
        credits = -1;
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (productId === "fotobox_credits_10") {
        const subscription = await storage.getSubscription(req.user.id);
        credits = (subscription?.creditsRemaining || 0) + 10;
      } else if (productId === "fotobox_credits_50") {
        const subscription = await storage.getSubscription(req.user.id);
        credits = (subscription?.creditsRemaining || 0) + 50;
      }

      const updated = await storage.updateSubscription(req.user.id, {
        plan: plan !== "free" ? plan : undefined,
        creditsRemaining: credits > 0 ? credits : undefined,
        creditsTotal: credits > 0 ? credits : undefined,
        googlePlayOrderId: orderId,
        googlePlayProductId: productId,
        expiresAt: expiresAt,
      });

      res.json({
        success: true,
        subscription: updated ? {
          plan: updated.plan,
          status: updated.status,
          creditsRemaining: updated.creditsRemaining,
          creditsTotal: updated.creditsTotal,
          expiresAt: updated.expiresAt,
        } : null,
      });
    } catch (error) {
      console.error("Verify purchase error:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });
}

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Express } from "express";

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: "Please use social login" });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;
          
          if (!email) {
            return done(new Error("No email from Google"), undefined);
          }

          const user = await storage.upsertOAuthUser({
            email,
            name: profile.displayName || email.split('@')[0],
            authProvider: "google",
            providerId: profile.id,
            avatar,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Configure GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;
          
          if (!email) {
            return done(new Error("No email from GitHub"), undefined);
          }

          const user = await storage.upsertOAuthUser({
            email,
            name: profile.displayName || profile.username || email.split('@')[0],
            authProvider: "github",
            providerId: profile.id,
            avatar,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

export { passport };

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Middleware to check if user has specific role
export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as User;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

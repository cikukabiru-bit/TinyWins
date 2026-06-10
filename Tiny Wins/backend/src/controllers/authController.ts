import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/db';
import { logSecurityEvent } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'tinywins_secret_grace_growth_rhythm_321';

// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().min(5, "Invalid phone number").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  dataStorageConsent: z.boolean().refine(v => v === true, {
    message: "You must agree to create an account and store data securely"
  }),
  aiPersonalizationConsent: z.boolean().default(false),
  supportContentConsent: z.boolean().default(false),
  habitScoreConsent: z.boolean().default(false),
  inspirationConsent: z.boolean().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
}).refine(data => !!data.email || !!data.phone, {
  message: "Either email or phone number must be provided",
  path: ["email"]
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  rememberDevice: z.boolean().optional().default(false)
});

export const resetPasswordSchema = z.object({
  emailOrPhone: z.string().min(3, "Email or phone number is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters")
});

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const email = data.email || undefined;
      const phone = data.phone || undefined;

      // Check if user exists
      if (email) {
        const existing = await db.users.findByEmail(email);
        if (existing) {
          return res.status(400).json({ error: "An account with this email already exists." });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await db.users.create({
        name: data.name,
        email,
        phone,
        password_hash: passwordHash
      });

      // Create defaults for consents
      await db.consents.upsert({
        user_id: user.id,
        data_storage_consent: true,
        ai_personalization_consent: data.aiPersonalizationConsent,
        support_content_consent: data.supportContentConsent,
        habit_score_personalization_consent: data.habitScoreConsent,
        inspiration_personalization_consent: data.inspirationConsent,
        consent_version: '1.0'
      });

      // Create empty profile
      await db.profiles.upsert({
        user_id: user.id,
        coach_tone: 'Gentle',
        content_preferences: [],
        inspiration_preferences: [],
        onboarding_completed: false
      });

      // Create default security settings
      await db.securitySettings.upsert({
        user_id: user.id,
        pin_enabled: false,
        pin_hash: undefined,
        biometric_enabled: false,
        app_lock_enabled: false,
        lock_timeout_minutes: 5,
        failed_pin_attempts: 0,
        locked_until: undefined,
        two_factor_enabled: false
      });

      // Generate JWT
      const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
        expiresIn: data.rememberDevice ? '30d' : '24h'
      });

      await logSecurityEvent(user.id, 'Account Registered', req);

      return res.status(201).json({
        message: "Account created successfully",
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Failed to register user. " + err.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { emailOrPhone, password, rememberDevice } = req.body;

      // Find user (by email first, then look through JSON db if phone)
      let user = null;
      if (emailOrPhone.includes('@')) {
        user = await db.users.findByEmail(emailOrPhone);
      } else {
        // Find by phone
        // If Postgres, query. If JSON, scan. To handle phone search universally:
        if (db.getMode() === 'postgres') {
          // Standard check
          const usersRes = await (db as any).users.findById; // helper for findByPhone
          // Let's implement getUserByPhone fallback inline
          const mode = db.getMode();
          // We can query custom
          // For simplicity we will handle searching phone in JSON and postgres
          // Let's query via pool directly if postgres
          if (process.env.DATABASE_URL) {
            const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
            const res = await pgPool.query("SELECT * FROM users WHERE phone = $1", [emailOrPhone]);
            user = res.rows[0] || null;
            await pgPool.end();
          }
        } else {
          // JSON Mode
          const dbState = (global as any).jsonDbCached || JSON.parse(fs.readFileSync(path.join(__dirname, '../db/local_store.json'), 'utf8'));
          user = dbState.users.find((u: any) => u.phone === emailOrPhone) || null;
        }
      }

      // If user still not found, do email check just in case
      if (!user) {
        user = await db.users.findByEmail(emailOrPhone);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid email/phone or password." });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        // Record failed login audit log
        await logSecurityEvent(user.id, 'Failed Login Attempt', req);
        return res.status(401).json({ error: "Invalid email/phone or password." });
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
        expiresIn: rememberDevice ? '30d' : '24h'
      });

      await logSecurityEvent(user.id, 'Account Logged In', req);

      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
      });
    } catch (err: any) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Failed to log in. " + err.message });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      if (req.user) {
        await logSecurityEvent(req.user.id, 'Account Logged Out', req);
      }
      return res.json({ message: "Logged out successfully" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to log out." });
    }
  },

  passwordReset: async (req: Request, res: Response) => {
    try {
      const { emailOrPhone, newPassword } = req.body;
      let user = await db.users.findByEmail(emailOrPhone);

      // Handle phone reset fallback
      if (!user && !emailOrPhone.includes('@')) {
        if (db.getMode() === 'json') {
          const dbState = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/local_store.json'), 'utf8'));
          user = dbState.users.find((u: any) => u.phone === emailOrPhone) || null;
        } else if (process.env.DATABASE_URL) {
          const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
          const res = await pgPool.query("SELECT * FROM users WHERE phone = $1", [emailOrPhone]);
          user = res.rows[0] || null;
          await pgPool.end();
        }
      }

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Update password hash
      const newHash = await bcrypt.hash(newPassword, 10);
      
      // We can update the password hash. Let's do it via pool if postgres, else JSON
      if (db.getMode() === 'postgres') {
        const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pgPool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
        await pgPool.end();
      } else {
        const dbState = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/local_store.json'), 'utf8'));
        const idx = dbState.users.findIndex((u: any) => u.id === user!.id);
        if (idx >= 0) {
          dbState.users[idx].password_hash = newHash;
          fs.writeFileSync(path.join(__dirname, '../db/local_store.json'), JSON.stringify(dbState, null, 2));
        }
      }

      await logSecurityEvent(user.id, 'Password Reset Successful', req);

      return res.json({ message: "Password updated successfully. Please login with your new password." });
    } catch (err: any) {
      console.error("Password reset error:", err);
      return res.status(500).json({ error: "Failed to reset password. " + err.message });
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await db.users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to load current session." });
    }
  }
};

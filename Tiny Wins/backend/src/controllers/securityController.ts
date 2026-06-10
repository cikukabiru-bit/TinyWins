import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/db';
import { logSecurityEvent } from '../middleware/auth';

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$|^\d{6}$/, "PIN must be exactly 4 or 6 digits")
});

const changePinSchema = z.object({
  oldPin: z.string(),
  newPin: z.string().regex(/^\d{4}$|^\d{6}$/, "New PIN must be exactly 4 or 6 digits")
});

const disablePinSchema = z.object({
  password: z.string().min(1, "Password is required to confirm identity")
});

export const securityController = {
  getSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      let settings = await db.securitySettings.findByUserId(req.user.id);
      if (!settings) {
        settings = await db.securitySettings.upsert({
          user_id: req.user.id,
          pin_enabled: false,
          pin_hash: undefined,
          biometric_enabled: false,
          app_lock_enabled: false,
          lock_timeout_minutes: 5,
          failed_pin_attempts: 0,
          locked_until: undefined,
          two_factor_enabled: false
        });
      }

      return res.json({
        pin_enabled: settings.pin_enabled,
        biometric_enabled: settings.biometric_enabled,
        app_lock_enabled: settings.app_lock_enabled,
        lock_timeout_minutes: settings.lock_timeout_minutes,
        failed_pin_attempts: settings.failed_pin_attempts,
        locked_until: settings.locked_until
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to load security settings." });
    }
  },

  updateSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const current = await db.securitySettings.findByUserId(req.user.id);
      if (!current) return res.status(404).json({ error: "Settings not found" });

      const data = req.body;
      const updated = await db.securitySettings.upsert({
        user_id: req.user.id,
        pin_enabled: data.pin_enabled !== undefined ? !!data.pin_enabled : current.pin_enabled,
        pin_hash: current.pin_hash,
        biometric_enabled: data.biometric_enabled !== undefined ? !!data.biometric_enabled : current.biometric_enabled,
        app_lock_enabled: data.app_lock_enabled !== undefined ? !!data.app_lock_enabled : current.app_lock_enabled,
        lock_timeout_minutes: data.lock_timeout_minutes !== undefined ? parseInt(data.lock_timeout_minutes) : current.lock_timeout_minutes,
        failed_pin_attempts: current.failed_pin_attempts,
        locked_until: current.locked_until,
        two_factor_enabled: data.two_factor_enabled !== undefined ? !!data.two_factor_enabled : current.two_factor_enabled
      });

      await logSecurityEvent(req.user.id, 'Security Settings Updated', req);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update security settings." });
    }
  },

  setupPin: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { pin } = pinSchema.parse(req.body);

      const pinHash = await bcrypt.hash(pin, 10);
      const current = await db.securitySettings.findByUserId(req.user.id);

      await db.securitySettings.upsert({
        user_id: req.user.id,
        pin_enabled: true,
        pin_hash: pinHash,
        biometric_enabled: current?.biometric_enabled || false,
        app_lock_enabled: true, // auto enable lock
        lock_timeout_minutes: current?.lock_timeout_minutes || 5,
        failed_pin_attempts: 0,
        locked_until: undefined,
        two_factor_enabled: current?.two_factor_enabled || false
      });

      await logSecurityEvent(req.user.id, 'PIN Lock Configured', req);
      return res.json({ message: "PIN lock set up successfully." });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  verifyPin: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { pin } = pinSchema.parse(req.body);

      const settings = await db.securitySettings.findByUserId(req.user.id);
      if (!settings || !settings.pin_enabled || !settings.pin_hash) {
        return res.status(400).json({ error: "PIN is not configured on this account." });
      }

      // Check lock duration
      const now = new Date();
      if (settings.locked_until && new Date(settings.locked_until) > now) {
        const remaining = Math.ceil((new Date(settings.locked_until).getTime() - now.getTime()) / 1000 / 60);
        return res.status(403).json({ 
          error: `App is temporarily locked due to failed attempts. Try again in ${remaining} minutes.`,
          locked: true,
          locked_until: settings.locked_until
        });
      }

      const isMatch = await bcrypt.compare(pin, settings.pin_hash);
      if (isMatch) {
        // Success
        await db.securitySettings.upsert({
          ...settings,
          failed_pin_attempts: 0,
          locked_until: undefined
        });

        await logSecurityEvent(req.user.id, 'PIN Unlocked App', req);
        return res.json({ success: true, message: "PIN unlocked successfully." });
      } else {
        // Increment attempts
        const attempts = settings.failed_pin_attempts + 1;
        let lockedUntil = undefined;
        let errorMsg = `Incorrect PIN. ${5 - attempts} attempts remaining before temporary lockout.`;

        if (attempts >= 5) {
          lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes lockout
          errorMsg = "Too many incorrect attempts. TinyWins is locked for 5 minutes to protect your privacy.";
          await logSecurityEvent(req.user.id, 'App Lockout Triggered (Failed PINs)', req);
        } else {
          await logSecurityEvent(req.user.id, 'Failed PIN Unlock Attempt', req);
        }

        await db.securitySettings.upsert({
          ...settings,
          failed_pin_attempts: attempts >= 10 ? 0 : attempts, // Require reauth fully if repeated failures
          locked_until: lockedUntil
        });

        return res.status(401).json({
          error: errorMsg,
          attempts,
          locked: attempts >= 5,
          locked_until: lockedUntil,
          require_reauth: attempts >= 10 // Client can force password login if attempts get to 10
        });
      }
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  changePin: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { oldPin, newPin } = changePinSchema.parse(req.body);

      const settings = await db.securitySettings.findByUserId(req.user.id);
      if (!settings || !settings.pin_enabled || !settings.pin_hash) {
        return res.status(400).json({ error: "PIN is not set up." });
      }

      const isMatch = await bcrypt.compare(oldPin, settings.pin_hash);
      if (!isMatch) {
        await logSecurityEvent(req.user.id, 'PIN Change Failed (Incorrect old PIN)', req);
        return res.status(401).json({ error: "Old PIN is incorrect." });
      }

      const newHash = await bcrypt.hash(newPin, 10);
      await db.securitySettings.upsert({
        ...settings,
        pin_hash: newHash,
        failed_pin_attempts: 0
      });

      await logSecurityEvent(req.user.id, 'PIN Changed Successfully', req);
      return res.json({ message: "PIN changed successfully." });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  disablePin: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { password } = disablePinSchema.parse(req.body);

      // Verify user password
      const user = await db.users.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await logSecurityEvent(req.user.id, 'Failed PIN Disablement Attempt', req);
        return res.status(401).json({ error: "Incorrect password confirmation." });
      }

      const settings = await db.securitySettings.findByUserId(req.user.id);
      await db.securitySettings.upsert({
        user_id: req.user.id,
        pin_enabled: false,
        pin_hash: undefined,
        biometric_enabled: false,
        app_lock_enabled: false,
        lock_timeout_minutes: settings?.lock_timeout_minutes || 5,
        failed_pin_attempts: 0,
        locked_until: undefined,
        two_factor_enabled: settings?.two_factor_enabled || false
      });

      await logSecurityEvent(req.user.id, 'PIN Lock Disabled', req);
      return res.json({ message: "PIN security lock disabled successfully." });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  getAuditLogs: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const logs = await db.auditLogs.findAllByUserId(req.user.id);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch security logs." });
    }
  }
};

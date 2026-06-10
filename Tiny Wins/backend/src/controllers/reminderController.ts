import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';

const reminderSchema = z.object({
  habit_id: z.string().optional(),
  reminder_type: z.string().min(1), // 'daily', 'specific_time', 'weekly', 'nudge'
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/, "Format must be HH:MM"),
  reminder_days: z.array(z.number()).default([1, 2, 3, 4, 5, 6, 0]),
  message: z.string().min(1),
  include_inspiration: z.boolean().default(false),
  include_support_link: z.boolean().default(false),
  is_active: z.boolean().default(true),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional()
});

export const reminderController = {
  getAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const reminders = await db.reminders.findAllByUserId(req.user.id);
      return res.json(reminders);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch reminders." });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = reminderSchema.parse(req.body);

      const reminder = await db.reminders.create({
        user_id: req.user.id,
        habit_id: data.habit_id || undefined,
        reminder_type: data.reminder_type,
        reminder_time: data.reminder_time,
        reminder_days: data.reminder_days,
        message: data.message,
        include_inspiration: data.include_inspiration,
        include_support_link: data.include_support_link,
        is_active: data.is_active,
        snooze_minutes: 0,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end
      });

      return res.status(201).json(reminder);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const target = await db.reminders.findAllByUserId(req.user.id);
      const reminder = target.find(r => r.id === req.params.id);

      if (!reminder) {
        return res.status(404).json({ error: "Reminder not found." });
      }

      const updated = await db.reminders.update(req.params.id, req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const target = await db.reminders.findAllByUserId(req.user.id);
      const reminder = target.find(r => r.id === req.params.id);

      if (!reminder) {
        return res.status(404).json({ error: "Reminder not found." });
      }

      await db.reminders.delete(req.params.id);
      return res.json({ message: "Reminder removed successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  snooze: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { minutes } = req.body; // default e.g. 10m
      const target = await db.reminders.findAllByUserId(req.user.id);
      const reminder = target.find(r => r.id === req.params.id);

      if (!reminder) return res.status(404).json({ error: "Reminder not found." });

      const updated = await db.reminders.update(req.params.id, {
        snooze_minutes: parseInt(minutes) || 10
      });

      return res.json({ message: `Reminder snoozed for ${minutes || 10} minutes.`, reminder: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  reschedule: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { new_time } = req.body; // format 'HH:MM'
      const target = await db.reminders.findAllByUserId(req.user.id);
      const reminder = target.find(r => r.id === req.params.id);

      if (!reminder) return res.status(404).json({ error: "Reminder not found." });

      const updated = await db.reminders.update(req.params.id, {
        reminder_time: new_time,
        snooze_minutes: 0 // clear any snooze
      });

      return res.json({ message: `Reminder rescheduled to ${new_time}.`, reminder: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
};

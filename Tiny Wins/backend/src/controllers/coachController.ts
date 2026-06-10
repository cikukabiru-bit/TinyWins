import { Request, Response } from 'express';
import { db } from '../db/db';
import { generateCoachAdvice } from '../services/coach';

export const coachController = {
  getDailyAdvice: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { habitId } = req.body;

      const advice = await generateCoachAdvice(req.user.id, habitId, 'daily');

      // Save message in DB for history
      const saved = await db.coachMessages.create({
        user_id: req.user.id,
        habit_id: habitId || undefined,
        message: advice,
        message_type: 'daily',
        accepted: false
      });

      return res.json(saved);
    } catch (err: any) {
      console.error("Coach controller error:", err);
      return res.status(500).json({ error: "Failed to get coach advice." });
    }
  },

  getWeeklyReview: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { habitId } = req.body;

      const advice = await generateCoachAdvice(req.user.id, habitId, 'weekly_review');

      const saved = await db.coachMessages.create({
        user_id: req.user.id,
        habit_id: habitId || undefined,
        message: advice,
        message_type: 'weekly_review',
        accepted: false
      });

      // Fetch additional logs data for full response
      let completedCount = 0;
      let totalCount = 0;
      let streak = 0;

      if (habitId) {
        const stats = await db.habitStats.findByHabitId(habitId);
        const logs = await db.habitLogs.findByHabitId(habitId);
        if (stats) {
          completedCount = stats.total_completions;
          streak = stats.current_streak;
        }
        totalCount = logs.length;
      } else {
        const allStats = await db.habitStats.findByHabitId(req.user.id); // all stats
        // sum them up manually
        const habits = await db.habits.findAllByUserId(req.user.id);
        for (const h of habits) {
          const s = await db.habitStats.findByHabitId(h.id);
          if (s) {
            completedCount += s.total_completions;
            streak = Math.max(streak, s.current_streak);
          }
        }
      }

      return res.json({
        id: saved.id,
        message: advice,
        wins_this_week: completedCount,
        most_consistent_habit: habitId ? "This habit" : "Your primary goal",
        current_streak: streak,
        created_at: saved.created_at
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to compile weekly review." });
    }
  },

  getSuggestion: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { habitId } = req.body;

      const advice = await generateCoachAdvice(req.user.id, habitId, 'suggestion');

      const saved = await db.coachMessages.create({
        user_id: req.user.id,
        habit_id: habitId || undefined,
        message: advice,
        message_type: 'suggestion',
        accepted: false
      });

      return res.json(saved);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to get suggestion." });
    }
  },

  acceptSuggestion: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const messageId = req.params.id;

      const updated = await db.coachMessages.update(messageId, { accepted: true });

      await db.timelineEvents.create({
        user_id: req.user.id,
        habit_id: updated.habit_id || undefined,
        event_type: 'coach_suggestion_accepted',
        title: "Accepted Coach Suggestion",
        description: "Adopted a soft tip from Tiny Coach."
      });

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to accept suggestion." });
    }
  },

  getHistory: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const history = await db.coachMessages.findAllByUserId(req.user.id);
      return res.json(history);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch coach history." });
    }
  }
};

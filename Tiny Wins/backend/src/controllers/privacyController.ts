import { Request, Response } from 'express';
import { db } from '../db/db';
import { logSecurityEvent } from '../middleware/auth';

// Helper to convert habits array to CSV string
function convertHabitsToCSV(habits: any[], stats: any[]): string {
  const headers = ["Habit ID", "Name", "Category", "Tiny Goal", "Frequency", "Current Streak", "Longest Streak", "Total Completions", "Active", "Start Date"];
  const rows = habits.map(h => {
    const s = stats.find(stat => stat.habit_id === h.id) || {};
    return [
      h.id,
      `"${h.name.replace(/"/g, '""')}"`,
      `"${h.category}"`,
      `"${h.tiny_goal.replace(/"/g, '""')}"`,
      `"${h.frequency}"`,
      s.current_streak || 0,
      s.longest_streak || 0,
      s.total_completions || 0,
      h.active,
      h.start_date
    ];
  });
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export const privacyController = {
  exportData: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const format = req.query.format || 'json';

      const data = await db.privacyActions.exportData(req.user.id);
      await logSecurityEvent(req.user.id, `User Exported Data (${format.toString().toUpperCase()})`, req);

      if (format === 'csv') {
        const csvString = convertHabitsToCSV(data.habits, data.habit_stats);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tinywins_habits_export_${Date.now()}.csv`);
        return res.send(csvString);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=tinywins_data_export_${Date.now()}.json`);
        return res.json(data);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      return res.status(500).json({ error: "Failed to export data." });
    }
  },

  deleteReflections: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await db.privacyActions.deleteReflections(req.user.id);

      await db.timelineEvents.create({
        user_id: req.user.id,
        event_type: 'reflections_deleted',
        title: "Cleared personal reflections",
        description: "Cleared all personal diary notes and emotional records."
      });

      await logSecurityEvent(req.user.id, 'Reflections Deleted By User', req);
      return res.json({ message: "All personal reflections and logs text have been deleted." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to clear reflections." });
    }
  },

  deleteHabitLogs: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await db.privacyActions.deleteHabitLogs(req.user.id);

      await db.timelineEvents.create({
        user_id: req.user.id,
        event_type: 'logs_deleted',
        title: "Soft reset all habit logs",
        description: "Cleared all completion dates and reset streaks to zero."
      });

      await logSecurityEvent(req.user.id, 'Habit Logs Purged By User', req);
      return res.json({ message: "All habit completion logs have been cleared and streaks reset." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to clear logs." });
    }
  },

  deleteCoachMessages: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await db.privacyActions.deleteCoachMessages(req.user.id);
      await logSecurityEvent(req.user.id, 'Coach Messages Purged By User', req);
      return res.json({ message: "All Tiny Coach chat messages cleared successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to clear coach messages." });
    }
  },

  deleteAccount: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const userId = req.user.id;

      // Log event before cascade deletion
      await logSecurityEvent(userId, 'Account Deleted By User', req);
      
      // Delete user cascading data
      await db.users.delete(userId);

      return res.json({ message: "Your TinyWins account and all related data have been permanently deleted. Go with grace." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete account." });
    }
  }
};

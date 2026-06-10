import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';
import { Habit, HabitLog } from '../db/types';

// Validation schemas
const habitSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  category: z.string().min(1, "Category is required"),
  tiny_goal: z.string().min(1, "Tiny goal is required"),
  frequency: z.string().default('daily'), // 'daily', 'weekdays', 'weekends', 'custom'
  preferred_time: z.string().optional(),
  reminder_enabled: z.boolean().default(false),
  growth_mode: z.string().default('Keep tiny'),
  coach_tone: z.string().default('Gentle'),
  support_content_preference: z.string().optional(),
  inspiration_preference: z.string().optional(),
  start_date: z.string().optional()
});

const habitScoreSchema = z.object({
  habit_name: z.string().min(1, "Habit name is required"),
  category: z.string().min(1, "Category is required"),
  score: z.number().min(1).max(10),
  note: z.string().optional(),
  current_frequency: z.string().optional(),
  desired_improvement: z.string().optional(),
  difficulty_level: z.string().optional(),
  emotional_feeling: z.string().optional(),
  priority: z.string().optional()
});

const checkInSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  status: z.enum(['completed', 'missed', 'paused']),
  reflection: z.string().optional(),
  mood: z.string().optional(),
  effort_level: z.string().optional()
});

// Streak logic helper
export async function updateHabitStatsAndStreaks(habitId: string, userId: string): Promise<any> {
  const habit = await db.habits.findById(habitId);
  if (!habit) return null;

  const logs = await db.habitLogs.findByHabitId(habitId);
  const completions = logs.filter(l => l.status === 'completed');

  // Map of logs by date for fast lookup
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => logMap.set(l.log_date, l));

  // Determine scheduled days helper
  const isScheduledDay = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const freq = habit.frequency.toLowerCase();
    
    if (freq === 'daily') return true;
    if (freq === 'weekdays') return day >= 1 && day <= 5;
    if (freq === 'weekends') return day === 0 || day === 6;
    return true; // Default fallback
  };

  // Calculate Streak
  let currentStreak = 0;
  let longestStreak = 0;

  // Let's sort logs by date ascending to calculate longest streak
  const sortedLogs = [...logs].sort((a,b) => a.log_date.localeCompare(b.log_date));

  // 1. Calculate Longest Streak
  let runningStreak = 0;
  let lastDate: Date | null = null;

  for (const log of sortedLogs) {
    if (log.status === 'completed') {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (log.status === 'missed' && isScheduledDay(log.log_date)) {
      // Missed scheduled day resets running streak (soft reset)
      runningStreak = 0;
    }
    // Paused or non-completed non-scheduled days don't break the running streak
  }

  // 2. Calculate Current Streak walking backwards from today
  const today = new Date();
  let checkDate = new Date(today);
  let broken = false;
  let firstDay = true;

  // Walk back up to 365 days
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];

    if (isScheduledDay(dateStr)) {
      const log = logMap.get(dateStr);
      if (log && log.status === 'completed') {
        currentStreak++;
      } else {
        // If it's today and no log yet, we don't break the streak. 
        // We just skip and check yesterday.
        if (firstDay && dateStr === today.toISOString().split('T')[0] && !log) {
          // Keep going
        } else {
          // Otherwise, any missed or absent log on a scheduled day breaks current streak
          broken = true;
          break;
        }
      }
    }
    firstDay = false;
    // Go to yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Completion rate (completed / total logged scheduled days)
  let totalScheduledLogged = 0;
  logs.forEach(l => {
    if (isScheduledDay(l.log_date) && l.status !== 'paused') {
      totalScheduledLogged++;
    }
  });

  const completionRate = totalScheduledLogged > 0
    ? Math.round((completions.length / totalScheduledLogged) * 100)
    : 0;

  const lastCompletedLog = logs.find(l => l.status === 'completed');

  // Upsert Stats
  const stats = await db.habitStats.upsert({
    habit_id: habitId,
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak),
    total_completions: completions.length,
    completion_rate: completionRate,
    last_completed_date: lastCompletedLog?.log_date
  });

  return stats;
}

export const habitController = {
  // ==========================================
  // HABITS CRUD
  // ==========================================
  getHabits: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const habits = await db.habits.findAllByUserId(req.user.id);
      return res.json(habits);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch habits." });
    }
  },

  getHabitById: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const habit = await db.habits.findById(req.params.id);
      if (!habit || habit.user_id !== req.user.id) {
        return res.status(404).json({ error: "Habit not found." });
      }
      return res.json(habit);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch habit." });
    }
  },

  createHabit: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = habitSchema.parse(req.body);

      const habit = await db.habits.create({
        user_id: req.user.id,
        name: data.name,
        category: data.category,
        tiny_goal: data.tiny_goal,
        frequency: data.frequency,
        preferred_time: data.preferred_time,
        reminder_enabled: data.reminder_enabled,
        growth_mode: data.growth_mode,
        coach_tone: data.coach_tone,
        support_content_preference: data.support_content_preference,
        inspiration_preference: data.inspiration_preference,
        start_date: data.start_date || new Date().toISOString().split('T')[0]
      });

      // Initialize stats
      await db.habitStats.upsert({
        habit_id: habit.id,
        user_id: req.user.id,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completion_rate: 0,
        last_completed_date: undefined
      });

      // Log timeline event
      await db.timelineEvents.create({
        user_id: req.user.id,
        habit_id: habit.id,
        event_type: 'habit_created',
        title: `Started: ${habit.name}`,
        description: `Staking a tiny goal: ${habit.tiny_goal}`
      });

      return res.status(201).json(habit);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  updateHabit: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.habits.findById(req.params.id);
      if (!target || target.user_id !== req.user.id) {
        return res.status(404).json({ error: "Habit not found." });
      }

      const data = req.body;
      const updated = await db.habits.update(req.params.id, data);

      await db.timelineEvents.create({
        user_id: req.user.id,
        habit_id: updated.id,
        event_type: 'habit_edited',
        title: `Adjusted: ${updated.name}`,
        description: `Set tiny goal to: ${updated.tiny_goal}`
      });

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  deleteHabit: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.habits.findById(req.params.id);
      if (!target || target.user_id !== req.user.id) {
        return res.status(404).json({ error: "Habit not found." });
      }

      await db.habits.delete(req.params.id);

      await db.timelineEvents.create({
        user_id: req.user.id,
        event_type: 'habit_deleted',
        title: `Archived habit: ${target.name}`,
        description: "Letting go gently to clear space."
      });

      return res.json({ message: "Habit deleted successfully" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // HABIT SCORES
  // ==========================================
  getHabitScores: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const scores = await db.habitScores.findAllByUserId(req.user.id);
      return res.json(scores);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch scores." });
    }
  },

  createHabitScore: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = habitScoreSchema.parse(req.body);

      const score = await db.habitScores.create({
        user_id: req.user.id,
        habit_name: data.habit_name,
        category: data.category,
        score: data.score,
        note: data.note,
        current_frequency: data.current_frequency,
        desired_improvement: data.desired_improvement,
        difficulty_level: data.difficulty_level,
        emotional_feeling: data.emotional_feeling,
        priority: data.priority
      });

      return res.status(201).json(score);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  updateHabitScore: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.habitScores.findById(req.params.id);
      if (!target || target.user_id !== req.user.id) {
        return res.status(404).json({ error: "Score item not found." });
      }

      const updated = await db.habitScores.update(req.params.id, req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  deleteHabitScore: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.habitScores.findById(req.params.id);
      if (!target || target.user_id !== req.user.id) {
        return res.status(404).json({ error: "Score item not found." });
      }

      await db.habitScores.delete(req.params.id);
      return res.json({ message: "Habit score item deleted" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  convertToHabit: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const score = await db.habitScores.findById(req.params.id);
      if (!score || score.user_id !== req.user.id) {
        return res.status(404).json({ error: "Score item not found." });
      }

      // Convert score interpretation
      let recommendedGoal = "";
      if (score.score <= 4) {
        recommendedGoal = `Start tiny: do ${score.habit_name} for 1-2 minutes.`;
      } else if (score.score <= 7) {
        recommendedGoal = `Stabilize: schedule ${score.habit_name} at a highly consistent time.`;
      } else {
        recommendedGoal = `Maintain: keep up ${score.habit_name} gently.`;
      }

      // Create habit
      const habit = await db.habits.create({
        user_id: req.user.id,
        name: score.habit_name,
        category: score.category,
        tiny_goal: recommendedGoal,
        frequency: 'daily',
        preferred_time: 'morning',
        reminder_enabled: false,
        growth_mode: 'Keep tiny',
        coach_tone: 'Gentle',
        support_content_preference: undefined,
        inspiration_preference: undefined,
        start_date: new Date().toISOString().split('T')[0]
      });

      // Update score status
      await db.habitScores.update(score.id, { converted_to_habit: true });

      // Initialize stats
      await db.habitStats.upsert({
        habit_id: habit.id,
        user_id: req.user.id,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completion_rate: 0
      });

      await db.timelineEvents.create({
        user_id: req.user.id,
        habit_id: habit.id,
        event_type: 'score_converted',
        title: `Grew into habit: ${habit.name}`,
        description: `Scored at ${score.score}/10, ready to build softly.`
      });

      return res.json(habit);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  getScoreSummary: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const scores = await db.habitScores.findAllByUserId(req.user.id);
      
      if (scores.length === 0) {
        return res.json({ message: "No scores found yet." });
      }

      // Strongest
      const strongest = [...scores].sort((a,b) => b.score - a.score)[0];
      // Most difficult
      const difficult = scores.find(s => s.difficulty_level === 'difficult') || [...scores].sort((a,b) => a.score - b.score)[0];
      // Highest priority
      const priority = scores.find(s => s.priority === 'high') || scores[0];

      // Recommendation
      let firstMicro = "";
      if (priority.score <= 4) {
        firstMicro = `Stretch or do a 1-minute version of ${priority.habit_name}`;
      } else if (priority.score <= 7) {
        firstMicro = `Set a daily reminder for ${priority.habit_name} at a set time`;
      } else {
        firstMicro = `Celebrate showing up for ${priority.habit_name} and keep it light`;
      }

      return res.json({
        strongest_habit: strongest.habit_name,
        strongest_score: strongest.score,
        most_difficult_habit: difficult.habit_name,
        difficulty_level: difficult.difficulty_level,
        highest_priority_habit: priority.habit_name,
        priority: priority.priority,
        recommended_first_microhabit: firstMicro,
        tiny_coach_note: `Your highest priority is to stabilize ${priority.habit_name}. Let's make the start point so small that it is impossible to avoid. You got this.`,
        suggested_support_links: `/api/content`,
        suggested_inspiration: `/api/inspiration`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // CHECK-INS & LOGS
  // ==========================================
  checkIn: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const habit = await db.habits.findById(req.params.id);
      if (!habit || habit.user_id !== req.user.id) {
        return res.status(404).json({ error: "Habit not found." });
      }

      const data = checkInSchema.parse(req.body);

      // Create log
      const log = await db.habitLogs.create({
        habit_id: habit.id,
        user_id: req.user.id,
        log_date: data.log_date,
        status: data.status,
        reflection: data.reflection,
        mood: data.mood,
        effort_level: data.effort_level
      });

      // Recalculate stats & streaks
      const stats = await updateHabitStatsAndStreaks(habit.id, req.user.id);

      // Record timeline event
      let eventTitle = "";
      let eventDesc = "";
      
      if (data.status === 'completed') {
        eventTitle = `Small Win: Completed ${habit.name}`;
        eventDesc = data.reflection 
          ? `Reflection: "${data.reflection}"` 
          : `Felt ${data.mood || 'calm'} with ${data.effort_level || 'okay'} effort.`;
      } else if (data.status === 'missed') {
        eventTitle = `Soft Reset: Missed ${habit.name}`;
        eventDesc = "A gentle step back. Progress is still progress. Ready to begin again tomorrow.";
      } else {
        eventTitle = `Paused: ${habit.name}`;
        eventDesc = "Taking a soft rest day by choice.";
      }

      await db.timelineEvents.create({
        user_id: req.user.id,
        habit_id: habit.id,
        event_type: data.status === 'completed' ? 'completed' : 'missed',
        title: eventTitle,
        description: eventDesc,
        event_date: `${data.log_date}T12:00:00Z` // Mid-day
      });

      return res.json({ log, stats });
    } catch (err: any) {
      console.error("Check-in error:", err);
      return res.status(400).json({ error: err.message });
    }
  },

  getLogs: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const logs = await db.habitLogs.findByHabitId(req.params.id);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch logs." });
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const stats = await db.habitStats.findByHabitId(req.params.id);
      if (!stats || stats.user_id !== req.user.id) {
        return res.json({ current_streak: 0, longest_streak: 0, total_completions: 0, completion_rate: 0 });
      }
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch stats." });
    }
  },

  // ==========================================
  // TIMELINE
  // ==========================================
  getTimeline: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const events = await db.timelineEvents.findAllByUserId(req.user.id);
      return res.json(events);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch timeline." });
    }
  }
};

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { seedContentItems, seedInspirationItems } from './seedData';
import {
  User, Profile, Habit, HabitScore, HabitLog, HabitStats,
  TimelineEvent, CoachMessage, ContentItem, ContentEngagement,
  InspirationItem, Reminder, UserSecuritySettings, UserConsents,
  SecurityAuditLog
} from './types';

// Detect mode
const isPostgres = !!process.env.DATABASE_URL;
let pool: Pool | null = null;
const JSON_DB_PATH = path.join(__dirname, 'local_store.json');

if (isPostgres) {
  console.log("TinyWins database: Configured for PostgreSQL.");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  });
} else {
  console.log("TinyWins database: No DATABASE_URL found. Using local JSON store fallback.");
}

// JSON Database Structure Interface
interface JsonDbSchema {
  users: User[];
  profiles: Profile[];
  habits: Habit[];
  habit_scores: HabitScore[];
  habit_logs: HabitLog[];
  habit_stats: HabitStats[];
  timeline_events: TimelineEvent[];
  coach_messages: CoachMessage[];
  content_items: ContentItem[];
  content_engagement: ContentEngagement[];
  inspiration_items: InspirationItem[];
  reminders: Reminder[];
  user_security_settings: UserSecuritySettings[];
  user_consents: UserConsents[];
  security_audit_logs: SecurityAuditLog[];
}

// Read JSON Database helper
function readJsonDb(): JsonDbSchema {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const emptyDb: JsonDbSchema = {
      users: [],
      profiles: [],
      habits: [],
      habit_scores: [],
      habit_logs: [],
      habit_stats: [],
      timeline_events: [],
      coach_messages: [],
      content_items: [],
      content_engagement: [],
      inspiration_items: [],
      reminders: [],
      user_security_settings: [],
      user_consents: [],
      security_audit_logs: []
    };
    writeJsonDb(emptyDb);
    return emptyDb;
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON Database. Re-initializing.", err);
    return {
      users: [], profiles: [], habits: [], habit_scores: [], habit_logs: [], habit_stats: [],
      timeline_events: [], coach_messages: [], content_items: [], content_engagement: [],
      inspiration_items: [], reminders: [], user_security_settings: [], user_consents: [],
      security_audit_logs: []
    };
  }
}

// Write JSON Database helper
function writeJsonDb(data: JsonDbSchema) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Helper to generate UUIDs locally
function generateUUID(): string {
  return crypto.randomUUID();
}

// ==========================================
// SEEDING LOGIC
// ==========================================
export async function initializeDatabase() {
  if (isPostgres && pool) {
    try {
      const client = await pool.connect();
      try {
        console.log("Initializing database tables and running migrations (PostgreSQL)...");
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schemaSql);

        // Check if inspiration seeded
        const checkInspiration = await client.query("SELECT COUNT(*) FROM inspiration_items WHERE is_default = TRUE");
        if (parseInt(checkInspiration.rows[0].count) === 0) {
          console.log("Seeding default inspiration items into PostgreSQL...");
          for (const item of seedInspirationItems) {
            await client.query(
              `INSERT INTO inspiration_items (text, author, type, tone, tags, is_default, is_user_added, is_active)
               VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, TRUE)`,
              [item.text, item.author || 'App Original', item.type, item.tone || 'Calm', item.tags || [], ]
            );
          }
        }

        // Check if content seeded
        const checkContent = await client.query("SELECT COUNT(*) FROM content_items WHERE is_default = TRUE");
        if (parseInt(checkContent.rows[0].count) === 0) {
          console.log("Seeding default support content items into PostgreSQL...");
          for (const item of seedContentItems) {
            await client.query(
              `INSERT INTO content_items (title, category, type, url, platform, short_description, tags, estimated_duration, mood, is_default, is_user_added)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, FALSE)`,
              [item.title, item.category, item.type, item.url, item.platform || '', item.short_description || '', item.tags || [], item.estimated_duration || '', item.mood || 'calm']
            );
          }
        }
        console.log("PostgreSQL schema initialization completed.");
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("PostgreSQL connection / migration error. Switching fallback database active.", err);
      // Disable PostgreSQL mode dynamically
      (isPostgres as any) = false;
    }
  }

  // Handle JSON Database seeding
  if (!isPostgres) {
    const db = readJsonDb();
    let updated = false;

    if (db.inspiration_items.filter(i => i.is_default).length === 0) {
      console.log("Seeding default inspiration items into JSON DB...");
      db.inspiration_items = seedInspirationItems.map(item => ({
        id: generateUUID(),
        text: item.text!,
        author: item.author || 'App Original',
        type: item.type!,
        tone: item.tone || 'Calm',
        tags: item.tags || [],
        is_default: true,
        is_user_added: false,
        is_active: true,
        is_favourite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      updated = true;
    }

    if (db.content_items.filter(c => c.is_default).length === 0) {
      console.log("Seeding default support content items into JSON DB...");
      db.content_items = seedContentItems.map(item => ({
        id: generateUUID(),
        title: item.title!,
        category: item.category!,
        type: item.type!,
        url: item.url!,
        platform: item.platform || '',
        short_description: item.short_description || '',
        tags: item.tags || [],
        estimated_duration: item.estimated_duration || '',
        mood: item.mood || 'calm',
        is_default: true,
        is_user_added: false,
        is_favourite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      updated = true;
    }

    if (updated) {
      writeJsonDb(db);
    }
    console.log("JSON Database initialization completed.");
  }
}

// ==========================================
// REPOSITORY IMPLEMENTATIONS
// ==========================================
export const db = {
  getMode: () => (isPostgres ? 'postgres' : 'json'),

  users: {
    create: async (user: Omit<User, 'id' | 'created_at'>): Promise<User> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO users (name, email, phone, password_hash)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, email, phone, password_hash, created_at`,
          [user.name, user.email, user.phone, user.password_hash]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newUser: User = {
          id: generateUUID(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          password_hash: user.password_hash,
          created_at: now
        };
        dbState.users.push(newUser);
        writeJsonDb(dbState);
        return newUser;
      }
    },

    findByEmail: async (email: string): Promise<User | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      }
    },

    findById: async (id: string): Promise<User | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.users.find(u => u.id === id) || null;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.users = dbState.users.filter(u => u.id !== id);
        // Cascade delete simulation
        dbState.profiles = dbState.profiles.filter(p => p.user_id !== id);
        dbState.habits = dbState.habits.filter(h => h.user_id !== id);
        dbState.habit_scores = dbState.habit_scores.filter(s => s.user_id !== id);
        dbState.habit_logs = dbState.habit_logs.filter(l => l.user_id !== id);
        dbState.habit_stats = dbState.habit_stats.filter(s => s.user_id !== id);
        dbState.timeline_events = dbState.timeline_events.filter(e => e.user_id !== id);
        dbState.coach_messages = dbState.coach_messages.filter(m => m.user_id !== id);
        dbState.reminders = dbState.reminders.filter(r => r.user_id !== id);
        dbState.user_security_settings = dbState.user_security_settings.filter(s => s.user_id !== id);
        dbState.user_consents = dbState.user_consents.filter(c => c.user_id !== id);
        dbState.security_audit_logs = dbState.security_audit_logs.filter(a => a.user_id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  profiles: {
    findByUserId: async (userId: string): Promise<Profile | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.profiles.find(p => p.user_id === userId) || null;
      }
    },

    upsert: async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO profiles (user_id, primary_goal, available_time, consistency_blocker, preferred_time, support_style, growth_preference, coach_tone, content_preferences, inspiration_preferences, onboarding_completed, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (user_id) DO UPDATE SET
             primary_goal = EXCLUDED.primary_goal,
             available_time = EXCLUDED.available_time,
             consistency_blocker = EXCLUDED.consistency_blocker,
             preferred_time = EXCLUDED.preferred_time,
             support_style = EXCLUDED.support_style,
             growth_preference = EXCLUDED.growth_preference,
             coach_tone = EXCLUDED.coach_tone,
             content_preferences = EXCLUDED.content_preferences,
             inspiration_preferences = EXCLUDED.inspiration_preferences,
             onboarding_completed = EXCLUDED.onboarding_completed,
             updated_at = EXCLUDED.updated_at
           RETURNING *`,
          [
            profile.user_id, profile.primary_goal, profile.available_time,
            profile.consistency_blocker, profile.preferred_time, profile.support_style,
            profile.growth_preference, profile.coach_tone || 'Gentle',
            profile.content_preferences || [], profile.inspiration_preferences || [],
            profile.onboarding_completed, now
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.profiles.findIndex(p => p.user_id === profile.user_id);
        const existing = idx >= 0 ? dbState.profiles[idx] : null;

        const updatedProfile: Profile = {
          id: existing ? existing.id : generateUUID(),
          user_id: profile.user_id,
          primary_goal: profile.primary_goal,
          available_time: profile.available_time,
          consistency_blocker: profile.consistency_blocker,
          preferred_time: profile.preferred_time,
          support_style: profile.support_style,
          growth_preference: profile.growth_preference,
          coach_tone: profile.coach_tone || 'Gentle',
          content_preferences: profile.content_preferences || [],
          inspiration_preferences: profile.inspiration_preferences || [],
          onboarding_completed: profile.onboarding_completed,
          created_at: existing ? existing.created_at : now,
          updated_at: now
        };

        if (idx >= 0) {
          dbState.profiles[idx] = updatedProfile;
        } else {
          dbState.profiles.push(updatedProfile);
        }
        writeJsonDb(dbState);
        return updatedProfile;
      }
    }
  },

  habits: {
    findAllByUserId: async (userId: string): Promise<Habit[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.habits.filter(h => h.user_id === userId).sort((a,b) => b.created_at.localeCompare(a.created_at));
      }
    },

    findById: async (id: string): Promise<Habit | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habits WHERE id = $1", [id]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.habits.find(h => h.id === id) || null;
      }
    },

    create: async (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'active'>): Promise<Habit> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO habits (user_id, name, category, tiny_goal, frequency, preferred_time, reminder_enabled, growth_mode, coach_tone, support_content_preference, inspiration_preference, start_date, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
           RETURNING *`,
          [
            habit.user_id, habit.name, habit.category, habit.tiny_goal, habit.frequency,
            habit.preferred_time, habit.reminder_enabled, habit.growth_mode || 'Keep tiny',
            habit.coach_tone || 'Gentle', habit.support_content_preference,
            habit.inspiration_preference, habit.start_date || now.split('T')[0]
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newHabit: Habit = {
          id: generateUUID(),
          user_id: habit.user_id,
          name: habit.name,
          category: habit.category,
          tiny_goal: habit.tiny_goal,
          frequency: habit.frequency,
          preferred_time: habit.preferred_time,
          reminder_enabled: habit.reminder_enabled,
          growth_mode: habit.growth_mode || 'Keep tiny',
          coach_tone: habit.coach_tone || 'Gentle',
          support_content_preference: habit.support_content_preference,
          inspiration_preference: habit.inspiration_preference,
          start_date: habit.start_date || now.split('T')[0],
          active: true,
          created_at: now,
          updated_at: now
        };
        dbState.habits.push(newHabit);
        writeJsonDb(dbState);
        return newHabit;
      }
    },

    update: async (id: string, habit: Partial<Habit>): Promise<Habit> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const fields = Object.keys(habit).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const values = fields.map((key, index) => `$${index + 2}`);
        const setQuery = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const res = await pool.query(
          `UPDATE habits SET ${setQuery}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`,
          [now, ...fields.map(key => (habit as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.habits.findIndex(h => h.id === id);
        if (idx < 0) throw new Error("Habit not found");

        const updated = {
          ...dbState.habits[idx],
          ...habit,
          updated_at: now
        } as Habit;

        dbState.habits[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM habits WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.habits = dbState.habits.filter(h => h.id !== id);
        dbState.habit_logs = dbState.habit_logs.filter(l => l.habit_id !== id);
        dbState.habit_stats = dbState.habit_stats.filter(s => s.habit_id !== id);
        dbState.reminders = dbState.reminders.filter(r => r.habit_id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  habitScores: {
    findAllByUserId: async (userId: string): Promise<HabitScore[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_scores WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_scores.filter(s => s.user_id === userId).sort((a,b) => b.created_at.localeCompare(a.created_at));
      }
    },

    findById: async (id: string): Promise<HabitScore | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_scores WHERE id = $1", [id]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_scores.find(s => s.id === id) || null;
      }
    },

    create: async (score: Omit<HabitScore, 'id' | 'created_at' | 'updated_at' | 'converted_to_habit'>): Promise<HabitScore> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO habit_scores (user_id, habit_name, category, score, note, current_frequency, desired_improvement, difficulty_level, emotional_feeling, priority, converted_to_habit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
           RETURNING *`,
          [
            score.user_id, score.habit_name, score.category, score.score, score.note,
            score.current_frequency, score.desired_improvement, score.difficulty_level,
            score.emotional_feeling, score.priority
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newScore: HabitScore = {
          id: generateUUID(),
          user_id: score.user_id,
          habit_name: score.habit_name,
          category: score.category,
          score: score.score,
          note: score.note,
          current_frequency: score.current_frequency,
          desired_improvement: score.desired_improvement,
          difficulty_level: score.difficulty_level,
          emotional_feeling: score.emotional_feeling,
          priority: score.priority,
          converted_to_habit: false,
          created_at: now,
          updated_at: now
        };
        dbState.habit_scores.push(newScore);
        writeJsonDb(dbState);
        return newScore;
      }
    },

    update: async (id: string, score: Partial<HabitScore>): Promise<HabitScore> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const fields = Object.keys(score).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const setQuery = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const res = await pool.query(
          `UPDATE habit_scores SET ${setQuery}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`,
          [now, ...fields.map(key => (score as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.habit_scores.findIndex(s => s.id === id);
        if (idx < 0) throw new Error("Habit score not found");

        const updated = {
          ...dbState.habit_scores[idx],
          ...score,
          updated_at: now
        } as HabitScore;

        dbState.habit_scores[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM habit_scores WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.habit_scores = dbState.habit_scores.filter(s => s.id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  habitLogs: {
    findAllByUserId: async (userId: string): Promise<HabitLog[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_logs WHERE user_id = $1 ORDER BY log_date DESC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_logs.filter(l => l.user_id === userId).sort((a,b) => b.log_date.localeCompare(a.log_date));
      }
    },

    findByHabitId: async (habitId: string): Promise<HabitLog[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_logs WHERE habit_id = $1 ORDER BY log_date DESC", [habitId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_logs.filter(l => l.habit_id === habitId).sort((a,b) => b.log_date.localeCompare(a.log_date));
      }
    },

    findByHabitIdAndDate: async (habitId: string, logDate: string): Promise<HabitLog | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_logs WHERE habit_id = $1 AND log_date = $2", [habitId, logDate]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_logs.find(l => l.habit_id === habitId && l.log_date === logDate) || null;
      }
    },

    create: async (log: Omit<HabitLog, 'id' | 'created_at'>): Promise<HabitLog> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO habit_logs (habit_id, user_id, log_date, status, reflection, mood, effort_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (habit_id, log_date) DO UPDATE SET
             status = EXCLUDED.status,
             reflection = EXCLUDED.reflection,
             mood = EXCLUDED.mood,
             effort_level = EXCLUDED.effort_level
           RETURNING *`,
          [log.habit_id, log.user_id, log.log_date, log.status, log.reflection, log.mood, log.effort_level]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.habit_logs.findIndex(l => l.habit_id === log.habit_id && l.log_date === log.log_date);
        const existing = idx >= 0 ? dbState.habit_logs[idx] : null;

        const newLog: HabitLog = {
          id: existing ? existing.id : generateUUID(),
          habit_id: log.habit_id,
          user_id: log.user_id,
          log_date: log.log_date,
          status: log.status,
          reflection: log.reflection,
          mood: log.mood,
          effort_level: log.effort_level,
          created_at: existing ? existing.created_at : now
        };

        if (idx >= 0) {
          dbState.habit_logs[idx] = newLog;
        } else {
          dbState.habit_logs.push(newLog);
        }
        writeJsonDb(dbState);
        return newLog;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM habit_logs WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.habit_logs = dbState.habit_logs.filter(l => l.id !== id);
        writeJsonDb(dbState);
      }
    },

    deleteByHabitIdAndDate: async (habitId: string, logDate: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM habit_logs WHERE habit_id = $1 AND log_date = $2", [habitId, logDate]);
      } else {
        const dbState = readJsonDb();
        dbState.habit_logs = dbState.habit_logs.filter(l => !(l.habit_id === habitId && l.log_date === logDate));
        writeJsonDb(dbState);
      }
    }
  },

  habitStats: {
    findByHabitId: async (habitId: string): Promise<HabitStats | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM habit_stats WHERE habit_id = $1", [habitId]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.habit_stats.find(s => s.habit_id === habitId) || null;
      }
    },

    upsert: async (stats: Omit<HabitStats, 'id' | 'updated_at'>): Promise<HabitStats> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO habit_stats (habit_id, user_id, current_streak, longest_streak, total_completions, completion_rate, last_completed_date, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (habit_id) DO UPDATE SET
             current_streak = EXCLUDED.current_streak,
             longest_streak = EXCLUDED.longest_streak,
             total_completions = EXCLUDED.total_completions,
             completion_rate = EXCLUDED.completion_rate,
             last_completed_date = EXCLUDED.last_completed_date,
             updated_at = EXCLUDED.updated_at
           RETURNING *`,
          [
            stats.habit_id, stats.user_id, stats.current_streak, stats.longest_streak,
            stats.total_completions, stats.completion_rate, stats.last_completed_date, now
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.habit_stats.findIndex(s => s.habit_id === stats.habit_id);
        const existing = idx >= 0 ? dbState.habit_stats[idx] : null;

        const newStats: HabitStats = {
          id: existing ? existing.id : generateUUID(),
          habit_id: stats.habit_id,
          user_id: stats.user_id,
          current_streak: stats.current_streak,
          longest_streak: stats.longest_streak,
          total_completions: stats.total_completions,
          completion_rate: stats.completion_rate,
          last_completed_date: stats.last_completed_date,
          updated_at: now
        };

        if (idx >= 0) {
          dbState.habit_stats[idx] = newStats;
        } else {
          dbState.habit_stats.push(newStats);
        }
        writeJsonDb(dbState);
        return newStats;
      }
    }
  },

  timelineEvents: {
    findAllByUserId: async (userId: string): Promise<TimelineEvent[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM timeline_events WHERE user_id = $1 ORDER BY event_date DESC LIMIT 100", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.timeline_events
          .filter(e => e.user_id === userId)
          .sort((a,b) => b.event_date.localeCompare(a.event_date))
          .slice(0, 100);
      }
    },

    create: async (event: Omit<TimelineEvent, 'id' | 'created_at'>): Promise<TimelineEvent> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO timeline_events (user_id, habit_id, event_type, title, description, event_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [event.user_id, event.habit_id, event.event_type, event.title, event.description, event.event_date || now]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newEvent: TimelineEvent = {
          id: generateUUID(),
          user_id: event.user_id,
          habit_id: event.habit_id,
          event_type: event.event_type,
          title: event.title,
          description: event.description,
          event_date: event.event_date || now,
          created_at: now
        };
        dbState.timeline_events.push(newEvent);
        writeJsonDb(dbState);
        return newEvent;
      }
    }
  },

  coachMessages: {
    findAllByUserId: async (userId: string): Promise<CoachMessage[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM coach_messages WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.coach_messages.filter(m => m.user_id === userId).sort((a,b) => b.created_at.localeCompare(a.created_at));
      }
    },

    create: async (message: Omit<CoachMessage, 'id' | 'created_at'>): Promise<CoachMessage> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO coach_messages (user_id, habit_id, message, message_type, accepted)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [message.user_id, message.habit_id, message.message, message.message_type, message.accepted]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newMsg: CoachMessage = {
          id: generateUUID(),
          user_id: message.user_id,
          habit_id: message.habit_id,
          message: message.message,
          message_type: message.message_type,
          accepted: message.accepted,
          created_at: now
        };
        dbState.coach_messages.push(newMsg);
        writeJsonDb(dbState);
        return newMsg;
      }
    },

    update: async (id: string, message: Partial<CoachMessage>): Promise<CoachMessage> => {
      if (isPostgres && pool) {
        const fields = Object.keys(message).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const setQuery = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');

        const res = await pool.query(
          `UPDATE coach_messages SET ${setQuery} WHERE id = $${fields.length + 1} RETURNING *`,
          [...fields.map(key => (message as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.coach_messages.findIndex(m => m.id === id);
        if (idx < 0) throw new Error("Coach message not found");

        const updated = {
          ...dbState.coach_messages[idx],
          ...message
        } as CoachMessage;

        dbState.coach_messages[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    }
  },

  contentItems: {
    findAll: async (userId: string): Promise<ContentItem[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM content_items WHERE user_id = $1 OR is_default = TRUE ORDER BY is_default DESC, created_at DESC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.content_items.filter(c => c.is_default || c.user_id === userId);
      }
    },

    create: async (item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>): Promise<ContentItem> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO content_items (user_id, title, category, type, url, platform, short_description, tags, estimated_duration, mood, is_user_added, is_default, is_favourite)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            item.user_id, item.title, item.category, item.type, item.url, item.platform,
            item.short_description, item.tags, item.estimated_duration, item.mood,
            item.is_user_added, item.is_default, item.is_favourite
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newItem: ContentItem = {
          id: generateUUID(),
          user_id: item.user_id,
          title: item.title,
          category: item.category,
          type: item.type,
          url: item.url,
          platform: item.platform,
          short_description: item.short_description,
          tags: item.tags,
          estimated_duration: item.estimated_duration,
          mood: item.mood,
          is_user_added: item.is_user_added,
          is_default: item.is_default,
          is_favourite: item.is_favourite,
          created_at: now,
          updated_at: now
        };
        dbState.content_items.push(newItem);
        writeJsonDb(dbState);
        return newItem;
      }
    },

    update: async (id: string, item: Partial<ContentItem>): Promise<ContentItem> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const fields = Object.keys(item).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const setQuery = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const res = await pool.query(
          `UPDATE content_items SET ${setQuery}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`,
          [now, ...fields.map(key => (item as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.content_items.findIndex(c => c.id === id);
        if (idx < 0) throw new Error("Content item not found");

        const updated = {
          ...dbState.content_items[idx],
          ...item,
          updated_at: now
        } as ContentItem;

        dbState.content_items[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM content_items WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.content_items = dbState.content_items.filter(c => c.id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  contentEngagement: {
    create: async (eng: Omit<ContentEngagement, 'id' | 'created_at'>): Promise<ContentEngagement> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO content_engagement (user_id, content_item_id, habit_id, action)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [eng.user_id, eng.content_item_id, eng.habit_id, eng.action]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newEng: ContentEngagement = {
          id: generateUUID(),
          user_id: eng.user_id,
          content_item_id: eng.content_item_id,
          habit_id: eng.habit_id,
          action: eng.action,
          created_at: now
        };
        dbState.content_engagement.push(newEng);
        writeJsonDb(dbState);
        return newEng;
      }
    }
  },

  inspirationItems: {
    findAll: async (userId: string): Promise<InspirationItem[]> => {
      if (isPostgres && pool) {
        const res = await pool.query(
          `SELECT * FROM inspiration_items 
           WHERE user_id = $1 OR is_default = TRUE 
           ORDER BY is_default DESC, created_at DESC`,
          [userId]
        );
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.inspiration_items.filter(i => i.is_default || i.user_id === userId);
      }
    },

    create: async (item: Omit<InspirationItem, 'id' | 'created_at' | 'updated_at'>): Promise<InspirationItem> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO inspiration_items (user_id, text, author, source, type, category, tone, tags, is_user_added, is_default, is_active, is_favourite)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            item.user_id, item.text, item.author, item.source, item.type, item.category,
            item.tone, item.tags || [], item.is_user_added, item.is_default, item.is_active, item.is_favourite
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newItem: InspirationItem = {
          id: generateUUID(),
          user_id: item.user_id,
          text: item.text,
          author: item.author,
          source: item.source,
          type: item.type,
          category: item.category,
          tone: item.tone,
          tags: item.tags || [],
          is_user_added: item.is_user_added,
          is_default: item.is_default,
          is_active: item.is_active,
          is_favourite: item.is_favourite,
          created_at: now,
          updated_at: now
        };
        dbState.inspiration_items.push(newItem);
        writeJsonDb(dbState);
        return newItem;
      }
    },

    update: async (id: string, item: Partial<InspirationItem>): Promise<InspirationItem> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const fields = Object.keys(item).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const setQuery = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const res = await pool.query(
          `UPDATE inspiration_items SET ${setQuery}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`,
          [now, ...fields.map(key => (item as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.inspiration_items.findIndex(i => i.id === id);
        if (idx < 0) throw new Error("Inspiration item not found");

        const updated = {
          ...dbState.inspiration_items[idx],
          ...item,
          updated_at: now
        } as InspirationItem;

        dbState.inspiration_items[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM inspiration_items WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.inspiration_items = dbState.inspiration_items.filter(i => i.id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  reminders: {
    findAllByUserId: async (userId: string): Promise<Reminder[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM reminders WHERE user_id = $1 ORDER BY reminder_time ASC", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.reminders.filter(r => r.user_id === userId);
      }
    },

    findByHabitId: async (habitId: string): Promise<Reminder[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM reminders WHERE habit_id = $1", [habitId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.reminders.filter(r => r.habit_id === habitId);
      }
    },

    create: async (rem: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO reminders (user_id, habit_id, reminder_type, reminder_time, reminder_days, message, include_inspiration, include_support_link, is_active, snooze_minutes, quiet_hours_start, quiet_hours_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            rem.user_id, rem.habit_id, rem.reminder_type, rem.reminder_time, rem.reminder_days,
            rem.message, rem.include_inspiration, rem.include_support_link, rem.is_active,
            rem.snooze_minutes || 0, rem.quiet_hours_start, rem.quiet_hours_end
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newRem: Reminder = {
          id: generateUUID(),
          user_id: rem.user_id,
          habit_id: rem.habit_id,
          reminder_type: rem.reminder_type,
          reminder_time: rem.reminder_time,
          reminder_days: rem.reminder_days,
          message: rem.message,
          include_inspiration: rem.include_inspiration,
          include_support_link: rem.include_support_link,
          is_active: rem.is_active,
          snooze_minutes: rem.snooze_minutes || 0,
          quiet_hours_start: rem.quiet_hours_start,
          quiet_hours_end: rem.quiet_hours_end,
          created_at: now,
          updated_at: now
        };
        dbState.reminders.push(newRem);
        writeJsonDb(dbState);
        return newRem;
      }
    },

    update: async (id: string, rem: Partial<Reminder>): Promise<Reminder> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const fields = Object.keys(rem).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at');
        const setQuery = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const res = await pool.query(
          `UPDATE reminders SET ${setQuery}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`,
          [now, ...fields.map(key => (rem as any)[key]), id]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.reminders.findIndex(r => r.id === id);
        if (idx < 0) throw new Error("Reminder not found");

        const updated = {
          ...dbState.reminders[idx],
          ...rem,
          updated_at: now
        } as Reminder;

        dbState.reminders[idx] = updated;
        writeJsonDb(dbState);
        return updated;
      }
    },

    delete: async (id: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM reminders WHERE id = $1", [id]);
      } else {
        const dbState = readJsonDb();
        dbState.reminders = dbState.reminders.filter(r => r.id !== id);
        writeJsonDb(dbState);
      }
    }
  },

  securitySettings: {
    findByUserId: async (userId: string): Promise<UserSecuritySettings | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM user_security_settings WHERE user_id = $1", [userId]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.user_security_settings.find(s => s.user_id === userId) || null;
      }
    },

    upsert: async (settings: Omit<UserSecuritySettings, 'id' | 'created_at' | 'updated_at'>): Promise<UserSecuritySettings> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO user_security_settings (user_id, pin_enabled, pin_hash, biometric_enabled, app_lock_enabled, lock_timeout_minutes, failed_pin_attempts, locked_until, two_factor_enabled, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (user_id) DO UPDATE SET
             pin_enabled = EXCLUDED.pin_enabled,
             pin_hash = COALESCE(EXCLUDED.pin_hash, user_security_settings.pin_hash),
             biometric_enabled = EXCLUDED.biometric_enabled,
             app_lock_enabled = EXCLUDED.app_lock_enabled,
             lock_timeout_minutes = EXCLUDED.lock_timeout_minutes,
             failed_pin_attempts = EXCLUDED.failed_pin_attempts,
             locked_until = EXCLUDED.locked_until,
             two_factor_enabled = EXCLUDED.two_factor_enabled,
             updated_at = EXCLUDED.updated_at
           RETURNING *`,
          [
            settings.user_id, settings.pin_enabled, settings.pin_hash,
            settings.biometric_enabled, settings.app_lock_enabled, settings.lock_timeout_minutes,
            settings.failed_pin_attempts, settings.locked_until, settings.two_factor_enabled, now
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.user_security_settings.findIndex(s => s.user_id === settings.user_id);
        const existing = idx >= 0 ? dbState.user_security_settings[idx] : null;

        const newSettings: UserSecuritySettings = {
          id: existing ? existing.id : generateUUID(),
          user_id: settings.user_id,
          pin_enabled: settings.pin_enabled,
          pin_hash: settings.pin_hash !== undefined ? settings.pin_hash : (existing ? existing.pin_hash : undefined),
          biometric_enabled: settings.biometric_enabled,
          app_lock_enabled: settings.app_lock_enabled,
          lock_timeout_minutes: settings.lock_timeout_minutes,
          failed_pin_attempts: settings.failed_pin_attempts,
          locked_until: settings.locked_until,
          two_factor_enabled: settings.two_factor_enabled,
          created_at: existing ? existing.created_at : now,
          updated_at: now
        };

        if (idx >= 0) {
          dbState.user_security_settings[idx] = newSettings;
        } else {
          dbState.user_security_settings.push(newSettings);
        }
        writeJsonDb(dbState);
        return newSettings;
      }
    }
  },

  consents: {
    findByUserId: async (userId: string): Promise<UserConsents | null> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM user_consents WHERE user_id = $1", [userId]);
        return res.rows[0] || null;
      } else {
        const dbState = readJsonDb();
        return dbState.user_consents.find(c => c.user_id === userId) || null;
      }
    },

    upsert: async (consents: Omit<UserConsents, 'id' | 'created_at' | 'updated_at'>): Promise<UserConsents> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO user_consents (user_id, data_storage_consent, ai_personalization_consent, support_content_consent, habit_score_personalization_consent, inspiration_personalization_consent, consent_version, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id) DO UPDATE SET
             data_storage_consent = EXCLUDED.data_storage_consent,
             ai_personalization_consent = EXCLUDED.ai_personalization_consent,
             support_content_consent = EXCLUDED.support_content_consent,
             habit_score_personalization_consent = EXCLUDED.habit_score_personalization_consent,
             inspiration_personalization_consent = EXCLUDED.inspiration_personalization_consent,
             consent_version = EXCLUDED.consent_version,
             updated_at = EXCLUDED.updated_at
           RETURNING *`,
          [
            consents.user_id, consents.data_storage_consent, consents.ai_personalization_consent,
            consents.support_content_consent, consents.habit_score_personalization_consent,
            consents.inspiration_personalization_consent, consents.consent_version || '1.0', now
          ]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const idx = dbState.user_consents.findIndex(c => c.user_id === consents.user_id);
        const existing = idx >= 0 ? dbState.user_consents[idx] : null;

        const newConsents: UserConsents = {
          id: existing ? existing.id : generateUUID(),
          user_id: consents.user_id,
          data_storage_consent: consents.data_storage_consent,
          ai_personalization_consent: consents.ai_personalization_consent,
          support_content_consent: consents.support_content_consent,
          habit_score_personalization_consent: consents.habit_score_personalization_consent,
          inspiration_personalization_consent: consents.inspiration_personalization_consent,
          consent_version: consents.consent_version || '1.0',
          created_at: existing ? existing.created_at : now,
          updated_at: now
        };

        if (idx >= 0) {
          dbState.user_consents[idx] = newConsents;
        } else {
          dbState.user_consents.push(newConsents);
        }
        writeJsonDb(dbState);
        return newConsents;
      }
    }
  },

  auditLogs: {
    findAllByUserId: async (userId: string): Promise<SecurityAuditLog[]> => {
      if (isPostgres && pool) {
        const res = await pool.query("SELECT * FROM security_audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100", [userId]);
        return res.rows;
      } else {
        const dbState = readJsonDb();
        return dbState.security_audit_logs
          .filter(a => a.user_id === userId)
          .sort((a,b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 100);
      }
    },

    create: async (log: Omit<SecurityAuditLog, 'id' | 'created_at'>): Promise<SecurityAuditLog> => {
      const now = new Date().toISOString();
      if (isPostgres && pool) {
        const res = await pool.query(
          `INSERT INTO security_audit_logs (user_id, action, ip_address, user_agent)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [log.user_id, log.action, log.ip_address, log.user_agent]
        );
        return res.rows[0];
      } else {
        const dbState = readJsonDb();
        const newLog: SecurityAuditLog = {
          id: generateUUID(),
          user_id: log.user_id,
          action: log.action,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: now
        };
        dbState.security_audit_logs.push(newLog);
        writeJsonDb(dbState);
        return newLog;
      }
    }
  },

  // Privacy clearing utilities
  privacyActions: {
    deleteReflections: async (userId: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("UPDATE habit_logs SET reflection = NULL, mood = NULL, effort_level = NULL WHERE user_id = $1", [userId]);
      } else {
        const dbState = readJsonDb();
        dbState.habit_logs = dbState.habit_logs.map(l => {
          if (l.user_id === userId) {
            return { ...l, reflection: undefined, mood: undefined, effort_level: undefined };
          }
          return l;
        });
        writeJsonDb(dbState);
      }
    },

    deleteHabitLogs: async (userId: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM habit_logs WHERE user_id = $1", [userId]);
        // Also reset stats
        await pool.query(
          `UPDATE habit_stats SET 
             current_streak = 0, longest_streak = 0, 
             total_completions = 0, completion_rate = 0.00, 
             last_completed_date = NULL 
           WHERE user_id = $1`,
          [userId]
        );
      } else {
        const dbState = readJsonDb();
        dbState.habit_logs = dbState.habit_logs.filter(l => l.user_id !== userId);
        dbState.habit_stats = dbState.habit_stats.map(s => {
          if (s.user_id === userId) {
            return {
              ...s,
              current_streak: 0,
              longest_streak: 0,
              total_completions: 0,
              completion_rate: 0,
              last_completed_date: undefined,
              updated_at: new Date().toISOString()
            };
          }
          return s;
        });
        writeJsonDb(dbState);
      }
    },

    deleteCoachMessages: async (userId: string): Promise<void> => {
      if (isPostgres && pool) {
        await pool.query("DELETE FROM coach_messages WHERE user_id = $1", [userId]);
      } else {
        const dbState = readJsonDb();
        dbState.coach_messages = dbState.coach_messages.filter(m => m.user_id !== userId);
        writeJsonDb(dbState);
      }
    },

    exportData: async (userId: string): Promise<any> => {
      if (isPostgres && pool) {
        const habits = await pool.query("SELECT * FROM habits WHERE user_id = $1", [userId]);
        const scores = await pool.query("SELECT * FROM habit_scores WHERE user_id = $1", [userId]);
        const logs = await pool.query("SELECT * FROM habit_logs WHERE user_id = $1", [userId]);
        const stats = await pool.query("SELECT * FROM habit_stats WHERE user_id = $1", [userId]);
        const profile = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
        const timeline = await pool.query("SELECT * FROM timeline_events WHERE user_id = $1", [userId]);
        const coach = await pool.query("SELECT * FROM coach_messages WHERE user_id = $1", [userId]);
        const reminders = await pool.query("SELECT * FROM reminders WHERE user_id = $1", [userId]);
        const consents = await pool.query("SELECT * FROM user_consents WHERE user_id = $1", [userId]);

        return {
          profile: profile.rows[0] || null,
          consents: consents.rows[0] || null,
          habits: habits.rows,
          habit_scores: scores.rows,
          habit_logs: logs.rows,
          habit_stats: stats.rows,
          timeline_events: timeline.rows,
          coach_messages: coach.rows,
          reminders: reminders.rows
        };
      } else {
        const dbState = readJsonDb();
        return {
          profile: dbState.profiles.find(p => p.user_id === userId) || null,
          consents: dbState.user_consents.find(c => c.user_id === userId) || null,
          habits: dbState.habits.filter(h => h.user_id === userId),
          habit_scores: dbState.habit_scores.filter(s => s.user_id === userId),
          habit_logs: dbState.habit_logs.filter(l => l.user_id === userId),
          habit_stats: dbState.habit_stats.filter(s => s.user_id === userId),
          timeline_events: dbState.timeline_events.filter(e => e.user_id === userId),
          coach_messages: dbState.coach_messages.filter(m => m.user_id === userId),
          reminders: dbState.reminders.filter(r => r.user_id === userId)
        };
      }
    }
  }
};

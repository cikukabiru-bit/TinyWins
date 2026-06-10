import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';

export const onboardingSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  availableTime: z.string().min(1, "Available time is required"),
  consistencyBlocker: z.string().min(1, "Consistency blocker is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  supportStyle: z.string().min(1, "Support style is required"),
  growthPreference: z.string().min(1, "Growth preference is required"),
  coachTone: z.string().default('Gentle'),
  includeSupportLinks: z.boolean().default(true),
  contentPreferences: z.array(z.string()).default([]),
  inspirationPreferences: z.array(z.string()).default([])
});

// Rule-based Recommendation helper
export function generateRecommendations(onboarding: z.infer<typeof onboardingSchema>) {
  const goal = onboarding.primaryGoal.toLowerCase();
  const time = onboarding.availableTime.toLowerCase();
  const blocker = onboarding.consistencyBlocker.toLowerCase();
  const isSpiritual = onboarding.inspirationPreferences.some(p => 
    ['christian/bible verses', 'saint quotes', 'prayer prompts', 'worship-linked encouragement'].includes(p.toLowerCase()) ||
    goal === 'prayer/spirituality'
  );

  const recommendations: { name: string; category: string; tiny_goal: string; frequency: string; growth_mode: string; reason: string }[] = [];

  // 1. Fitness / Health
  if (goal.includes('fitness') || goal.includes('health') || goal.includes('sleep') || goal.includes('self-care')) {
    if (time.includes('1 minute') || time.includes('3 minutes') || time.includes('5 minutes')) {
      recommendations.push({
        name: "Gentle Stretch",
        category: "Fitness",
        tiny_goal: "Stretch quietly for 2 minutes after waking up",
        frequency: "daily",
        growth_mode: onboarding.growthPreference,
        reason: "Fits your micro-timing of 1-5 minutes for physical comfort."
      });
      recommendations.push({
        name: "Active Squats",
        category: "Fitness",
        tiny_goal: "Do 5 gentle air squats while waiting for coffee",
        frequency: "daily",
        growth_mode: onboarding.growthPreference,
        reason: "Uses habit-stacking to fit exercise into your daily loop."
      });
    } else {
      recommendations.push({
        name: "Daily Walk",
        category: "Fitness",
        tiny_goal: "Walk around the block for 5 minutes at noon",
        frequency: "daily",
        growth_mode: onboarding.growthPreference,
        reason: "Establishes a steady outdoor rhythm without pressure."
      });
    }
  }

  // 2. Prayer / Spirituality
  if (isSpiritual || goal.includes('prayer') || goal.includes('spirituality')) {
    recommendations.push({
      name: "Gentle Morning Prayer",
      category: "Prayer/Spirituality",
      tiny_goal: "Offer a 1-minute prayer of thanks upon waking",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Anchors your spirituality first thing in the morning."
    });
    recommendations.push({
      name: "Daily Verse Reading",
      category: "Prayer/Spirituality",
      tiny_goal: "Read exactly one scripture verse before sleeping",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Builds scripture familiarity, keeping study load tiny."
    });
    if (onboarding.contentPreferences.some(p => p.toLowerCase().includes('song') || p.toLowerCase().includes('music'))) {
      recommendations.push({
        name: "Spirituality Worship Pause",
        category: "Prayer/Spirituality",
        tiny_goal: "Listen to one worship song quietly",
        frequency: "daily",
        growth_mode: onboarding.growthPreference,
        reason: "Pairs music with a spiritual reset during busy afternoons."
      });
    }
  }

  // 3. Focus / Work / Learning / Productivity
  if (goal.includes('focus') || goal.includes('learning') || goal.includes('work') || goal.includes('productivity')) {
    recommendations.push({
      name: "Focused Micro-work",
      category: "Focus",
      tiny_goal: "Do 5 minutes of focused work before opening email",
      frequency: "weekdays",
      growth_mode: onboarding.growthPreference,
      reason: "Protects your focus during the highest cognitive friction period."
    });
    recommendations.push({
      name: "Daily Priority",
      category: "Focus",
      tiny_goal: "Write today's single most important task on a sticky note",
      frequency: "weekdays",
      growth_mode: onboarding.growthPreference,
      reason: "Reduces choice fatigue by setting one target daily."
    });
  }

  // 4. Money / Saving
  if (goal.includes('money')) {
    recommendations.push({
      name: "Expense Recording",
      category: "Money",
      tiny_goal: "Write down exactly one transaction in your notepad daily",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Builds direct financial awareness without auditing software."
    });
    recommendations.push({
      name: "Daily Cent Save",
      category: "Money",
      tiny_goal: "Move $1 to savings manually via your bank app",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Trains the muscle of savings without straining your wallet."
    });
  }

  // 5. Emotional wellbeing / Relationships
  if (goal.includes('emotional') || goal.includes('relationships') || goal.includes('wellbeing')) {
    recommendations.push({
      name: "Gratitude Reflection",
      category: "Emotional wellbeing",
      tiny_goal: "Jot down one thing you are grateful for today",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Rewires mood patterns by searching for small daily blessings."
    });
    recommendations.push({
      name: "Kind Connection",
      category: "Relationships",
      tiny_goal: "Send one encouraging text message to a loved one",
      frequency: "weekdays",
      growth_mode: onboarding.growthPreference,
      reason: "Maintains relational warmth without consuming too much energy."
    });
  }

  // Blocker adjustments & fallback injection if too few recommendations
  if (recommendations.length < 3) {
    // Inject a generic self-care fallback
    recommendations.push({
      name: "Quiet Breathing Pause",
      category: "Self-care",
      tiny_goal: "Take 3 slow, deep breaths whenever you feel rushed",
      frequency: "daily",
      growth_mode: onboarding.growthPreference,
      reason: "Provides immediate neural recovery from stress and rushes."
    });
  }

  // Blocker-specific reason overrides
  if (blocker.includes('forgetfulness')) {
    recommendations.forEach(r => {
      r.reason += " Recommended stack: place a visual cue near your bed or desk.";
    });
  } else if (blocker.includes('tiredness') || blocker.includes('overwhelm') || blocker.includes('energy')) {
    recommendations.forEach(r => {
      r.reason += " This is a low-energy microhabit designed to be finished even on hard days.";
    });
  }

  return recommendations.slice(0, 5); // Return top 3 to 5 items
}

export const profileController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const profile = await db.profiles.findByUserId(req.user.id);
      return res.json(profile);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to get profile." });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = req.body;
      const current = await db.profiles.findByUserId(req.user.id);
      
      const updated = await db.profiles.upsert({
        user_id: req.user.id,
        primary_goal: data.primaryGoal || current?.primary_goal,
        available_time: data.availableTime || current?.available_time,
        consistency_blocker: data.consistencyBlocker || current?.consistency_blocker,
        preferred_time: data.preferredTime || current?.preferred_time,
        support_style: data.supportStyle || current?.support_style,
        growth_preference: data.growthPreference || current?.growth_preference,
        coach_tone: data.coachTone || current?.coach_tone || 'Gentle',
        content_preferences: data.contentPreferences || current?.content_preferences || [],
        inspiration_preferences: data.inspirationPreferences || current?.inspiration_preferences || [],
        onboarding_completed: current?.onboarding_completed || false
      });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update profile." });
    }
  },

  onboarding: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = onboardingSchema.parse(req.body);

      // Save onboarding preferences to profile
      const profile = await db.profiles.upsert({
        user_id: req.user.id,
        primary_goal: data.primaryGoal,
        available_time: data.availableTime,
        consistency_blocker: data.consistencyBlocker,
        preferred_time: data.preferredTime,
        support_style: data.supportStyle,
        growth_preference: data.growthPreference,
        coach_tone: data.coachTone,
        content_preferences: data.contentPreferences,
        inspiration_preferences: data.inspirationPreferences,
        onboarding_completed: true
      });

      // Generate habit recommendations based on their inputs
      const recommendations = generateRecommendations(data);

      return res.json({
        message: "Onboarding details saved successfully",
        profile,
        recommendations
      });
    } catch (err: any) {
      console.error("Onboarding error:", err);
      return res.status(400).json({
        error: "Failed to complete onboarding",
        details: err.errors ? err.errors.map((e: any) => e.message) : err.message
      });
    }
  },

  getConsents: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const consents = await db.consents.findByUserId(req.user.id);
      return res.json(consents);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to get consents." });
    }
  },

  updateConsents: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = req.body;
      const updated = await db.consents.upsert({
        user_id: req.user.id,
        data_storage_consent: true, // required to hold account
        ai_personalization_consent: !!data.ai_personalization_consent,
        support_content_consent: !!data.support_content_consent,
        habit_score_personalization_consent: !!data.habit_score_personalization_consent,
        inspiration_personalization_consent: !!data.inspiration_personalization_consent,
        consent_version: '1.0'
      });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update consents." });
    }
  }
};

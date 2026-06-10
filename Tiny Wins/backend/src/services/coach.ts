import OpenAI from 'openai';
import { db } from '../db/db';

const apiKey = process.env.OPENAI_API_KEY || '';
const enableMock = process.env.ENABLE_MOCK_COACH === 'true' || !apiKey;

const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Dynamic Mock Coach tips based on user data
function getMockTip(
  category: string,
  completionPattern: string,
  tone: string,
  blocker?: string,
  type?: 'daily' | 'weekly_review' | 'suggestion'
): string {
  const normalizedTone = tone.toLowerCase();
  
  if (type === 'weekly_review') {
    return `This week, your commitment to your ${category} habit was clear. Even on days marked by ${blocker || 'tiredness'}, you showed up. That is the core of gentle rhythm: doing what we can, when we can. For next week, let's keep it tiny. Your progress is real progress.`;
  }

  if (type === 'suggestion') {
    if (completionPattern.includes('inconsistent') || completionPattern.includes('low')) {
      return `It looks like this week had a few bumps. That is completely okay — it is time for a soft reset. Try reducing the goal to a 1-minute version. Remember: begin again, without punishment.`;
    }
    return `Your ${category} habit has a strong rhythm. If you feel ready, you might try expanding it by just 2 minutes next week. Or, if it feels perfect, maintain it exactly as it is. You choose.`;
  }

  // Daily tips
  if (normalizedTone === 'spiritual') {
    return `Take a quiet breath. Begin your ${category} step with a simple prayer of thanks. You do not need to rush or achieve perfection today. God meets you exactly where you are.`;
  }
  if (normalizedTone === 'motivational') {
    return `One small step is still movement. You are building identity through small daily actions, not perfect days. Let's do this tiny step today!`;
  }
  if (normalizedTone === 'calm' || normalizedTone === 'gentle') {
    return `Breathe first. Begin softly. Today only needs one honest, tiny effort. If energy is low, just showing up in mind is enough. Grow with grace.`;
  }

  return `Start where you are. Keep it small. Your ${category} habit is waiting. No pressure, no shame. One tiny win at a time.`;
}

export async function generateCoachAdvice(
  userId: string,
  habitId: string | undefined,
  type: 'daily' | 'weekly_review' | 'suggestion'
): Promise<string> {
  // Check user consent
  const consents = await db.consents.findByUserId(userId);
  if (!consents || !consents.ai_personalization_consent) {
    return "Tiny Coach suggestions are currently paused. You can enable AI suggestions anytime in your Privacy settings.";
  }

  const profile = await db.profiles.findByUserId(userId);
  const tone = profile?.coach_tone || 'Gentle';
  const blocker = profile?.consistency_blocker || 'unknown';

  let category = 'general';
  let completionPattern = 'moderate';
  let reflectionText = '';

  if (habitId) {
    const habit = await db.habits.findById(habitId);
    if (habit) {
      category = habit.category;
      const stats = await db.habitStats.findByHabitId(habitId);
      const logs = await db.habitLogs.findByHabitId(habitId);

      completionPattern = stats 
        ? `completions: ${stats.total_completions}, streak: ${stats.current_streak}, rate: ${stats.completion_rate}%`
        : 'new habit';

      // Read reflection summaries ONLY if user consented to reflection personalization
      if (consents.habit_score_personalization_consent) {
        const reflectionLogs = logs.filter(l => !!l.reflection).slice(0, 3);
        reflectionText = reflectionLogs.map(l => l.reflection).join('; ');
      }
    }
  }

  // Data Minimization payload configuration
  const promptPayload = {
    adviceType: type,
    habitCategory: category,
    completionMetrics: completionPattern,
    preferredTone: tone,
    blockerReason: blocker,
    userReflectionsSummary: reflectionText || 'None provided'
  };

  if (enableMock || !openai) {
    return getMockTip(category, completionPattern, tone, blocker, type);
  }

  try {
    const systemPrompt = `You are Tiny Coach, a warm, practical, non-judgmental microhabits coach. You help users build tiny habits using evidence-informed behaviour change principles. Do not mention book titles, authors, or theories in the user-facing response. Do not shame the user. Do not give medical, financial, religious, or clinical authority claims. Give short, actionable advice based on the user's habit logs, habit scores, onboarding profile, stated goal, preferred tone, support content preferences, and inspiration preferences. Use warm, graceful language and encourage tiny next steps. Keep response to 2-3 sentences max.`;

    const userPrompt = `Generate a ${type} advice message.
    Habit Category: ${promptPayload.habitCategory}
    Recent Completion Stats: ${promptPayload.completionMetrics}
    Stated blocker: ${promptPayload.blockerReason}
    Tone: ${promptPayload.preferredTone}
    Recent reflections: ${promptPayload.userReflectionsSummary}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return completion.choices[0].message?.content || getMockTip(category, completionPattern, tone, blocker, type);
  } catch (err) {
    console.error("AI Coach API call failed. Falling back to mock tip.", err);
    return getMockTip(category, completionPattern, tone, blocker, type);
  }
}

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

import { initializeDatabase } from './db/db';
import { authenticateToken, validateBody } from './middleware/auth';
import { authController, registerSchema, loginSchema, resetPasswordSchema } from './controllers/authController';
import { profileController } from './controllers/profileController';
import { habitController } from './controllers/habitController';
import { coachController } from './controllers/coachController';
import { contentController } from './controllers/contentController';
import { inspirationController } from './controllers/inspirationController';
import { reminderController } from './controllers/reminderController';
import { securityController } from './controllers/securityController';
import { privacyController } from './controllers/privacyController';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// API Base health-check route
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/register', validateBody(registerSchema), authController.register);
app.post('/api/auth/login', validateBody(loginSchema), authController.login);
app.post('/api/auth/logout', authenticateToken, authController.logout);
app.post('/api/auth/password-reset', validateBody(resetPasswordSchema), authController.passwordReset);
app.get('/api/auth/me', authenticateToken, authController.me);

// ==========================================
// PROFILE & ONBOARDING ROUTES
// ==========================================
app.post('/api/profile/onboarding', authenticateToken, profileController.onboarding);
app.get('/api/profile/me', authenticateToken, profileController.getProfile);
app.put('/api/profile/me', authenticateToken, profileController.updateProfile);

// ==========================================
// CONSENT ROUTES
// ==========================================
app.get('/api/consents', authenticateToken, profileController.getConsents);
app.put('/api/consents', authenticateToken, profileController.updateConsents);

// ==========================================
// HABIT SCORES ROUTES (Order matters: register static summary first!)
// ==========================================
app.get('/api/habit-scores/summary', authenticateToken, habitController.getScoreSummary);
app.get('/api/habit-scores', authenticateToken, habitController.getHabitScores);
app.post('/api/habit-scores', authenticateToken, habitController.createHabitScore);
app.put('/api/habit-scores/:id', authenticateToken, habitController.updateHabitScore);
app.delete('/api/habit-scores/:id', authenticateToken, habitController.deleteHabitScore);
app.post('/api/habit-scores/:id/convert-to-habit', authenticateToken, habitController.convertToHabit);

// ==========================================
// HABITS CRUD & LOGGING ROUTES
// ==========================================
app.get('/api/habits', authenticateToken, habitController.getHabits);
app.post('/api/habits', authenticateToken, habitController.createHabit);
app.get('/api/habits/:id', authenticateToken, habitController.getHabitById);
app.put('/api/habits/:id', authenticateToken, habitController.updateHabit);
app.delete('/api/habits/:id', authenticateToken, habitController.deleteHabit);

app.post('/api/habits/:id/check-in', authenticateToken, habitController.checkIn);
app.get('/api/habits/:id/logs', authenticateToken, habitController.getLogs);
app.get('/api/habits/:id/stats', authenticateToken, habitController.getStats);

// ==========================================
// TIMELINE ROUTE
// ==========================================
app.get('/api/timeline', authenticateToken, habitController.getTimeline);

// ==========================================
// TINY COACH ROUTES
// ==========================================
app.post('/api/coach/daily', authenticateToken, coachController.getDailyAdvice);
app.post('/api/coach/weekly-review', authenticateToken, coachController.getWeeklyReview);
app.post('/api/coach/habit-suggestion', authenticateToken, coachController.getSuggestion);
app.post('/api/coach/suggestion/:id/accept', authenticateToken, coachController.acceptSuggestion);
app.get('/api/coach/history', authenticateToken, coachController.getHistory);

// ==========================================
// SUPPORT LINKS ROUTES
// ==========================================
app.get('/api/content', authenticateToken, contentController.getAll);
app.post('/api/content', authenticateToken, contentController.create);
app.get('/api/content/recommended/:habitId', authenticateToken, contentController.getRecommended);
app.put('/api/content/:id', authenticateToken, contentController.update);
app.delete('/api/content/:id', authenticateToken, contentController.delete);
app.post('/api/content/:id/favourite', authenticateToken, contentController.favourite);

// ==========================================
// INSPIRATION ROUTES
// ==========================================
app.get('/api/inspiration', authenticateToken, inspirationController.getAll);
app.post('/api/inspiration', authenticateToken, inspirationController.create);
app.get('/api/inspiration/recommended', authenticateToken, inspirationController.getRecommended);
app.put('/api/inspiration/:id', authenticateToken, inspirationController.update);
app.delete('/api/inspiration/:id', authenticateToken, inspirationController.delete);
app.post('/api/inspiration/:id/favourite', authenticateToken, inspirationController.favourite);

// ==========================================
// REMINDERS ROUTES
// ==========================================
app.get('/api/reminders', authenticateToken, reminderController.getAll);
app.post('/api/reminders', authenticateToken, reminderController.create);
app.put('/api/reminders/:id', authenticateToken, reminderController.update);
app.delete('/api/reminders/:id', authenticateToken, reminderController.delete);
app.post('/api/reminders/:id/snooze', authenticateToken, reminderController.snooze);
app.post('/api/reminders/:id/reschedule', authenticateToken, reminderController.reschedule);

// ==========================================
// SECURITY / PIN CONFIG ROUTES
// ==========================================
app.get('/api/security/settings', authenticateToken, securityController.getSettings);
app.put('/api/security/settings', authenticateToken, securityController.updateSettings);
app.post('/api/security/pin/setup', authenticateToken, securityController.setupPin);
app.post('/api/security/pin/verify', authenticateToken, securityController.verifyPin);
app.post('/api/security/pin/change', authenticateToken, securityController.changePin);
app.post('/api/security/pin/disable', authenticateToken, securityController.disablePin);
app.get('/api/security/audit-logs', authenticateToken, securityController.getAuditLogs);

// ==========================================
// PRIVACY DATA RIGHTS ROUTES
// ==========================================
app.get('/api/privacy/export', authenticateToken, privacyController.exportData);
app.delete('/api/privacy/delete-reflections', authenticateToken, privacyController.deleteReflections);
app.delete('/api/privacy/delete-habit-logs', authenticateToken, privacyController.deleteHabitLogs);
app.delete('/api/privacy/delete-coach-messages', authenticateToken, privacyController.deleteCoachMessages);
app.delete('/api/privacy/delete-account', authenticateToken, privacyController.deleteAccount);

// ==========================================
// DATABASE SETUP & LISTENER
// ==========================================
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`[TinyWins Server] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to initialization failure:", err);
    process.exit(1);
  }
}

startServer();

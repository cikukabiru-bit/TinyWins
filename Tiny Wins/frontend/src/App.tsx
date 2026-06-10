import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLockProvider, useAppLock } from './context/AppLockContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HabitScorePage } from './pages/HabitScorePage';
import { RecommendPage } from './pages/RecommendPage';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { AddHabitPage } from './pages/AddHabitPage';
import { EditHabitPage } from './pages/EditHabitPage';
import { HabitDetailPage } from './pages/HabitDetailPage';
import { TimelinePage } from './pages/TimelinePage';
import { CoachPage } from './pages/CoachPage';
import { LibraryPage } from './pages/LibraryPage';
import { SupportLinksPage } from './pages/SupportLinksPage';
import { InspirationPage } from './pages/InspirationPage';
import { SettingsPage } from './pages/SettingsPage';

// Components
import { AppLockScreen } from './components/SecurityComponents';

// JWT guard layout check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center text-xs font-semibold text-theme-muted">
        Syncing TinyWins...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      {/* Absolute fullscreen lock filter blocks screens duringTimeout/Inactivity */}
      <AppLockScreen />
    </>
  );
};

// Route wrapper to redirect logged in users to today dashboard
const OpenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (token) return <Navigate to="/today" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppLockProvider>
            <Routes>
              {/* Public entries */}
              <Route path="/" element={<OpenRoute><LandingPage /></OpenRoute>} />
              <Route path="/login" element={<OpenRoute><LoginPage /></OpenRoute>} />
              <Route path="/register" element={<OpenRoute><RegisterPage /></OpenRoute>} />
              <Route path="/password-reset" element={
                <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-theme-bg text-center space-y-4">
                  <h2 className="text-xl font-bold text-theme-text">Gently Reset Password</h2>
                  <p className="text-xs text-theme-muted max-w-xs leading-relaxed">
                    To reset your password, please contact local security support or type a new password configuration below.
                  </p>
                  <input
                    type="password"
                    placeholder="New password code"
                    className="p-3 text-xs border border-theme-border bg-theme-card rounded-xl text-center focus:outline-none"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (!val) return;
                        const email = window.prompt("Confirm your email or phone address:");
                        if (!email) return;
                        const res = await fetch('/api/auth/password-reset', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ emailOrPhone: email, newPassword: val })
                        });
                        if (res.ok) alert("Password reset successfully. Redirecting.");
                        else alert("Failed to reset password.");
                      }
                    }}
                  />
                  <span className="text-[10px] text-theme-muted italic">Press Enter to save reset</span>
                </div>
              } />

              {/* Protected assessments/onboardings */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              <Route path="/habit-score" element={<ProtectedRoute><HabitScorePage /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><RecommendPage /></ProtectedRoute>} />

              {/* Protected user dashboards */}
              <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
              <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
              <Route path="/add-habit" element={<ProtectedRoute><AddHabitPage /></ProtectedRoute>} />
              <Route path="/habits/:id/edit" element={<ProtectedRoute><EditHabitPage /></ProtectedRoute>} />
              <Route path="/habits/:id" element={<ProtectedRoute><HabitDetailPage /></ProtectedRoute>} />
              
              <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
              
              {/* Library & settings */}
              <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/library/support-links" element={<ProtectedRoute><SupportLinksPage /></ProtectedRoute>} />
              <Route path="/library/inspiration" element={<ProtectedRoute><InspirationPage /></ProtectedRoute>} />
              
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Fallback redirects */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLockProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

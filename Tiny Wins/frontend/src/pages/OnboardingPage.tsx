import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { ArrowLeft, ArrowRight, Sun } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  
  const [step, setStep] = useState(1);

  // Form states
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [consistencyBlockers, setConsistencyBlockers] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [growthPreference, setGrowthPreference] = useState('');
  const [coachTone, setCoachTone] = useState('Gentle');
  const [includeSupportLinks, setIncludeSupportLinks] = useState<boolean>(true);
  const [contentPreferences, setContentPreferences] = useState<string[]>([]);
  const [inspirationPreferences, setInspirationPreferences] = useState<string[]>([]);

  const toggleBlocker = (item: string) => {
    setConsistencyBlockers(prev => 
      prev.includes(item) ? prev.filter(b => b !== item) : [...prev, item]
    );
  };

  const toggleContentPref = (item: string) => {
    setContentPreferences(prev => 
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    );
  };

  const toggleInspirationPref = (item: string) => {
    setInspirationPreferences(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    if (step < 10) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    const payload = {
      primaryGoal,
      availableTime,
      consistencyBlocker: consistencyBlockers.join(', '),
      preferredTime,
      supportStyle,
      growthPreference,
      coachTone,
      includeSupportLinks,
      contentPreferences,
      inspirationPreferences
    };

    try {
      const res = await fetchWithAuth('/api/profile/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Habit Score Assessment page next!
        // Stash onboarding recommendations in state or context if needed.
        localStorage.setItem('tinywins_onboarding_recommendations', JSON.stringify(data.recommendations));
        navigate('/habit-score');
      } else {
        alert("Failed to submit onboarding answers. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection failed.");
    }
  };

  // Questions definitions
  const questions = [
    {
      id: 1,
      title: "What area do you want to improve first?",
      description: "We will start here to design your first microhabit.",
      type: "single",
      options: ["Health", "Fitness", "Sleep", "Focus", "Learning", "Prayer/Spirituality", "Money", "Work/Productivity", "Self-care", "Relationships", "Emotional wellbeing"],
      value: primaryGoal,
      setValue: setPrimaryGoal
    },
    {
      id: 2,
      title: "How much time can you realistically give daily?",
      description: "Start tiny. Consistency beats duration.",
      type: "single",
      options: ["1 minute", "3 minutes", "5 minutes", "10 minutes", "15 minutes", "Flexible"],
      value: availableTime,
      setValue: setAvailableTime
    },
    {
      id: 3,
      title: "What usually blocks your consistency?",
      description: "Select all that apply. We will address these blockers directly.",
      type: "multi",
      options: ["Forgetfulness", "Tiredness", "Lack of motivation", "Anxiety/overwhelm", "Too much work", "Unclear goals", "Low energy", "Procrastination"],
      value: consistencyBlockers,
      toggleValue: toggleBlocker
    },
    {
      id: 4,
      title: "What time of day works best?",
      description: "Habit stacking works best when paired with an existing routine.",
      type: "single",
      options: ["Morning", "Afternoon", "Evening", "Night", "Flexible"],
      value: preferredTime,
      setValue: setPreferredTime
    },
    {
      id: 5,
      title: "What type of support helps you most?",
      description: "We will build these into your daily dashboard.",
      type: "single",
      options: ["Reminders", "Reflection prompts", "Music", "Videos", "Prayer prompts", "Progress charts", "Accountability messages", "Motivational notes"],
      value: supportStyle,
      setValue: setSupportStyle
    },
    {
      id: 6,
      title: "How should habits grow?",
      description: "Decide how fast you want to increase goals.",
      type: "single",
      options: ["Keep tiny", "Increase slowly", "Increase only when I choose", "Let Tiny Coach suggest growth"],
      value: growthPreference,
      setValue: setGrowthPreference
    },
    {
      id: 7,
      title: "What tone should Tiny Coach use?",
      description: "Choose an AI voice that feels encouraging for you.",
      type: "single",
      options: ["Gentle", "Motivational", "Spiritual", "Practical", "Playful", "Firm but kind", "Calm"],
      value: coachTone,
      setValue: setCoachTone
    },
    {
      id: 8,
      title: "Do you want support links included?",
      description: "Support links provide external resources like stretching/focus music.",
      type: "boolean",
      options: ["Yes", "No"],
      value: includeSupportLinks ? "Yes" : "No",
      setValue: (val: string) => setIncludeSupportLinks(val === "Yes")
    },
    {
      id: 9,
      title: "Preferred support link types:",
      description: "Choose the categories you would like to explore.",
      type: "multi",
      options: ["Fitness videos", "Worship songs", "Prayer resources", "Motivational music", "Focus playlists", "Calming music", "Learning videos", "Articles", "Podcasts", "Sermons", "Guided breathing resources"],
      value: contentPreferences,
      toggleValue: toggleContentPref
    },
    {
      id: 10,
      title: "Preferred inspiration types:",
      description: "Choose what keeps you grounded. Spiritual content is optional.",
      type: "multi",
      options: ["Motivational quotes", "Calm reflections", "Bible verses", "Saint quotes", "Prayer prompts", "Gratitude prompts", "Focus prompts", "Self-care reminders", "Mixed inspiration"],
      value: inspirationPreferences,
      toggleValue: toggleInspirationPref
    }
  ];

  const currentQ = questions[step - 1];

  const canProgress = () => {
    if (currentQ.type === 'single') return !!currentQ.value;
    if (currentQ.type === 'multi') return (currentQ.value as string[]).length > 0;
    return true; // boolean usually pre-filled
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-bg p-6 fade-in">
      {/* Header */}
      <header className="flex items-center justify-between max-w-md mx-auto w-full pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={16} /></div>
          <span className="text-xs font-black tracking-wider text-theme-text uppercase">Onboarding</span>
        </div>
        <span className="text-xs font-bold text-theme-muted">Step {step} of 10</span>
      </header>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto w-full mt-4 bg-theme-border rounded-full h-1">
        <div 
          className="bg-coral h-1 rounded-full transition-all duration-300"
          style={{ width: `${step * 10}%` }}
        />
      </div>

      {/* Main question box */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center my-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-theme-text tracking-tight leading-snug">{currentQ.title}</h2>
          <p className="text-xs text-theme-muted">{currentQ.description}</p>
        </div>

        {/* Options list */}
        <div className="mt-6 space-y-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
          {currentQ.options.map(option => {
            let isSelected = false;
            if (currentQ.type === 'single' || currentQ.type === 'boolean') {
              isSelected = currentQ.value === option;
            } else if (currentQ.type === 'multi') {
              isSelected = (currentQ.value as string[]).includes(option);
            }

            const handleSelect = () => {
              if (currentQ.type === 'single' || currentQ.type === 'boolean') {
                currentQ.setValue(option);
                // Auto progression for single choices makes it feel extremely swift!
                setTimeout(() => {
                  if (step < 10) setStep(step + 1);
                }, 200);
              } else if (currentQ.type === 'multi' && currentQ.toggleValue) {
                currentQ.toggleValue(option);
              }
            };

            return (
              <button
                key={option}
                onClick={handleSelect}
                className={`w-full p-4 rounded-2xl border text-left text-xs font-bold transition-all duration-200 active:scale-[0.99]
                  ${isSelected 
                    ? 'border-coral bg-peach bg-opacity-25 text-theme-text shadow-soft-coral' 
                    : 'border-theme-border bg-theme-card hover:border-peach hover:border-opacity-40 text-theme-text'
                  }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer Nav Buttons */}
      <footer className="max-w-md mx-auto w-full flex gap-4 pb-6">
        <SunsetButton
          variant="outline"
          onClick={handlePrev}
          disabled={step === 1}
          className="flex-1 py-3"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </SunsetButton>

        {step === 10 ? (
          <SunsetButton
            variant="primary"
            onClick={handleFinish}
            disabled={!canProgress()}
            className="flex-1 py-3"
          >
            Finish Onboarding
          </SunsetButton>
        ) : (
          <SunsetButton
            variant="primary"
            onClick={handleNext}
            disabled={!canProgress()}
            className="flex-1 py-3"
          >
            Next <ArrowRight size={16} className="ml-1" />
          </SunsetButton>
        )}
      </footer>
    </div>
  );
};

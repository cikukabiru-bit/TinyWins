import React, { useState } from 'react';
import { SunsetButton } from './SunsetButton';
import { SecurityToggle } from './SecurityComponents';
import { Bell, Clock } from 'lucide-react';

interface ReminderSettingsProps {
  initialReminder?: {
    id?: string;
    reminder_time: string;
    reminder_days: number[];
    message: string;
    include_inspiration: boolean;
    include_support_link: boolean;
    is_active: boolean;
  };
  onSave: (reminder: {
    reminder_time: string;
    reminder_days: number[];
    message: string;
    include_inspiration: boolean;
    include_support_link: boolean;
    is_active: boolean;
  }) => void;
  habitName: string;
}

export const ReminderSettingsCard: React.FC<ReminderSettingsProps> = ({
  initialReminder,
  onSave,
  habitName
}) => {
  const [isActive, setIsActive] = useState(initialReminder?.is_active ?? true);
  const [time, setTime] = useState(initialReminder?.reminder_time ?? '08:00');
  const [message, setMessage] = useState(initialReminder?.message ?? `Time for your tiny win: ${habitName}.`);
  const [includeQuote, setIncludeQuote] = useState(initialReminder?.include_inspiration ?? false);
  const [includeLink, setIncludeLink] = useState(initialReminder?.include_support_link ?? false);
  
  const [selectedDays, setSelectedDays] = useState<number[]>(initialReminder?.reminder_days ?? [1, 2, 3, 4, 5]);

  const daysOfWeek = [
    { label: 'S', value: 0 },
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 }
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      reminder_time: time,
      reminder_days: selectedDays,
      message,
      include_inspiration: includeQuote,
      include_support_link: includeLink,
      is_active: isActive
    });
  };

  return (
    <form onSubmit={handleSave} className="p-5 rounded-2xl border border-theme-border bg-theme-card shadow-soft-peach space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-peach bg-opacity-25 p-2 rounded-xl text-coral">
          <Bell size={18} />
        </span>
        <div>
          <h4 className="text-sm font-bold text-theme-text">Gentle Reminder Settings</h4>
          <p className="text-[10px] text-theme-muted">Alerts to show up softly for {habitName}</p>
        </div>
      </div>

      {/* Enable Toggle */}
      <SecurityToggle
        label="Enable reminders"
        checked={isActive}
        onChange={setIsActive}
        description="Notify me on my device when it is time"
      />

      {isActive && (
        <>
          {/* Time Picker */}
          <div className="flex items-center justify-between border-b border-theme-border border-opacity-40 pb-3">
            <span className="text-xs font-semibold text-theme-text flex items-center gap-1.5">
              <Clock size={14} className="text-theme-muted" /> Time of day:
            </span>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="text-sm font-semibold p-1.5 rounded-lg border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
          </div>

          {/* Days picker */}
          <div>
            <span className="text-xs font-semibold text-theme-text block mb-2">Repeat on:</span>
            <div className="flex justify-between items-center">
              {daysOfWeek.map(day => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 border
                      ${isSelected 
                        ? 'bg-gradient-to-tr from-orange to-coral border-transparent text-white shadow-soft-coral' 
                        : 'border-theme-border hover:bg-theme-bg text-theme-muted'
                      }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">Reminder message:</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Time for your tiny win."
              className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
          </div>

          {/* Include Quotes / Inspiration */}
          <SecurityToggle
            label="Attach encouragement"
            checked={includeQuote}
            onChange={setIncludeQuote}
            description="Include today's reflection in reminder text"
          />

          {/* Include Support Link */}
          <SecurityToggle
            label="Attach support links"
            checked={includeLink}
            onChange={setIncludeLink}
            description="Include quick link in notifications"
          />
        </>
      )}

      <SunsetButton type="submit" variant="primary" className="w-full mt-2">
        Save Reminder Settings
      </SunsetButton>
    </form>
  );
};

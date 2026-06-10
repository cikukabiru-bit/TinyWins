import React from 'react';

interface HabitCalendarProps {
  logs: {
    log_date: string;
    status: string; // 'completed', 'missed', 'paused'
  }[];
  startDate?: string;
}

export const HabitCalendar: React.FC<HabitCalendarProps> = ({ logs, startDate }) => {
  // Generate days for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // day of week: 0-6
  const totalDays = new Date(year, month + 1, 0).getDate(); // total days in month

  const monthName = today.toLocaleString(undefined, { month: 'long' });

  // Map logs to speed up check
  const logMap = new Map<string, string>();
  logs.forEach(l => logMap.set(l.log_date, l.status));

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyPrefixes = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="p-5 rounded-2xl border border-theme-border bg-theme-card shadow-soft-peach w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-theme-text">{monthName} {year}</h4>
        <div className="flex items-center gap-3 text-[10px] text-theme-muted">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-coral rounded-full" /> Win
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose rounded-full" /> Pause
          </div>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-theme-muted mb-2">
        {daysOfWeek.map((day, idx) => (
          <div key={idx}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-theme-text">
        {/* Pre-fill empty spaces */}
        {emptyPrefixes.map(idx => (
          <div key={`empty-${idx}`} className="w-8 h-8" />
        ))}

        {/* Days numbers */}
        {daysArray.map(day => {
          const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const status = logMap.get(formattedDate);
          
          let dayStyle = 'text-theme-text hover:bg-theme-bg';
          if (status === 'completed') {
            dayStyle = 'bg-gradient-to-tr from-orange to-coral text-white shadow-soft-coral';
          } else if (status === 'paused') {
            dayStyle = 'bg-rose text-white bg-opacity-80';
          } else if (status === 'missed') {
            dayStyle = 'border border-rose border-opacity-40 text-rose';
          }

          return (
            <div
              key={day}
              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${dayStyle}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

type Mode = 'work' | 'break';

export function PomodoroView() {
  const { userTasks } = useAppStore();
  const incompleteTasks = userTasks.filter((t) => !t.completed);

  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<Mode>('work');
  
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Dynamic durations
  const durations = {
    work: workMinutes * 60,
    break: breakMinutes * 60,
  };

  const handleTaskSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    setSelectedTaskId(taskId);
    if (taskId) {
      const task = userTasks.find(t => t.id === taskId);
      if (task?.estimatedMinutes) {
        setWorkMinutes(task.estimatedMinutes);
        if (mode === 'work' && !isActive) {
          setTimeLeft(task.estimatedMinutes * 60);
        }
      }
    }
  };

  const handleCustomWorkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setWorkMinutes(val);
    if (mode === 'work' && !isActive) {
      setTimeLeft(val * 60);
    }
  };

  const handleCustomBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setBreakMinutes(val);
    if (mode === 'break' && !isActive) {
      setTimeLeft(val * 60);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    // Notify
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'work' ? 'Hết giờ làm việc!' : 'Hết giờ nghỉ ngơi!', {
        body: mode === 'work' ? 'Đến lúc nghỉ giải lao 5 phút.' : 'Quay lại làm việc nào!',
      });
    }

    if (mode === 'work') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      switchMode('break');
    } else {
      switchMode('work');
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(durations[newMode]);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durations[mode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Bộ đếm Pomodoro</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Tập trung cao độ để nhận phần thưởng!
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 w-full mb-8">
        
        <div className="mb-8 space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chọn công việc (Lấy thời gian dự kiến)
            </label>
            <select
              value={selectedTaskId}
              onChange={handleTaskSelect}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary outline-none"
            >
              <option value="">-- Không chọn / Tự điều chỉnh --</option>
              {incompleteTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.estimatedMinutes ? `(${t.estimatedMinutes}p)` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cài đặt Làm việc (phút)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={workMinutes}
                onChange={handleCustomWorkChange}
                disabled={isActive}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cài đặt Nghỉ (phút)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMinutes}
                onChange={handleCustomBreakChange}
                disabled={isActive}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mb-12">
          <button
            onClick={() => switchMode('work')}
            className={cn(
              "px-6 py-2 rounded-full font-medium flex items-center space-x-2 transition-colors",
              mode === 'work' 
                ? "bg-primary text-white" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            )}
            style={mode === 'work' ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            <Briefcase size={18} />
            <span>Tập trung</span>
          </button>
          <button
            onClick={() => switchMode('break')}
            className={cn(
              "px-6 py-2 rounded-full font-medium flex items-center space-x-2 transition-colors",
              mode === 'break' 
                ? "bg-primary text-white" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            )}
            style={mode === 'break' ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            <Coffee size={18} />
            <span>Nghỉ ngơi</span>
          </button>
        </div>

        <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-12">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              className="stroke-current text-primary transition-all duration-1000 ease-linear"
              strokeWidth="8"
              fill="none"
              strokeDasharray="753.98" // 2 * PI * 120
              strokeDashoffset={753.98 - (753.98 * progress) / 100}
              style={{ color: 'var(--color-primary)' }}
            />
          </svg>
          <div className="text-6xl font-bold font-mono tracking-tighter">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex justify-center space-x-6">
          <button
            onClick={toggleTimer}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isActive ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

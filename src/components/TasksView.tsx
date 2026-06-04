import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Task, Priority, ViewMode } from '../types';
import { isToday, isSameWeek, parseISO, startOfWeek, addDays } from 'date-fns';
import { format as formatTZ } from 'date-fns'; 
import { Plus, Check, Trash2, Calendar as CalendarIcon, Tag, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const PRIORITY_LABELS = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp'
};

export function TasksView() {
  const { state, userTasks, addTask, toggleTask, deleteTask } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDate, setNewTaskDate] = useState(formatTZ(new Date(), 'yyyy-MM-dd'));
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskRecurring, setNewTaskRecurring] = useState(false);
  const [newTaskMinutes, setNewTaskMinutes] = useState('25');
  const [isAdding, setIsAdding] = useState(false);

  const filterTasks = (tasks: Task[]) => {
    const today = new Date();
    return tasks.filter((task) => {
      const taskDate = parseISO(task.date);
      if (viewMode === 'day') return isToday(taskDate);
      if (viewMode === 'week') return isSameWeek(taskDate, today, { weekStartsOn: 1 });
      return true;
    }).sort((a, b) => {
      // Sort by incomplete first, then by date, then by priority (high > medium > low)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const p = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    });
  };

  const filteredTasks = filterTasks(userTasks);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (newTaskRecurring) {
      let baseDate = parseISO(newTaskDate);
      for (let i = 0; i < 12; i++) {
        addTask({
          userId: state.currentUser!.id,
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          date: formatTZ(addDays(baseDate, i * 7), 'yyyy-MM-dd'),
          time: newTaskTime || undefined,
          endTime: newTaskEndTime || undefined,
          completed: false,
          estimatedMinutes: parseInt(newTaskMinutes) || 25,
        });
      }
    } else {
      addTask({
        userId: state.currentUser!.id,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        date: newTaskDate,
        time: newTaskTime || undefined,
        endTime: newTaskEndTime || undefined,
        completed: false,
        estimatedMinutes: parseInt(newTaskMinutes) || 25,
      });
    }

    setNewTaskTitle('');
    setNewTaskRecurring(false);
    setNewTaskTime('');
    setNewTaskEndTime('');
    setNewTaskMinutes('25');
    setIsAdding(false);
  };

  const handleToggle = (taskId: string, isCompleted: boolean) => {
    toggleTask(taskId);
    if (!isCompleted) {
      // Meaning it just transitioned to completed
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  const renderWeekTimetable = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

    return (
      <div className="overflow-x-auto h-full pb-4">
        <div className="grid grid-cols-7 gap-3 min-w-[900px] h-full">
          {days.map((day, i) => {
            const dateStr = formatTZ(day, 'yyyy-MM-dd');
            // Filter all user tasks matching this date
            const dayTasks = userTasks
              .filter(t => t.date === dateStr)
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const p = { high: 3, medium: 2, low: 1 };
                return p[b.priority] - p[a.priority];
              });
            const isCurrentDay = isToday(day);

            return (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col bg-white dark:bg-gray-800 rounded-xl border shadow-sm max-h-[600px]",
                  isCurrentDay ? "border-primary ring-1 ring-primary/20" : "border-gray-200 dark:border-gray-700"
                )}
                style={isCurrentDay ? { borderColor: 'var(--color-primary)' } : {}}
              >
                <div 
                  className={cn(
                    "p-3 border-b text-center shrink-0",
                    isCurrentDay ? "bg-primary/10 text-primary" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80"
                  )}
                  style={isCurrentDay ? { color: 'var(--color-primary)' } : {}}
                >
                  <div className="font-bold">{dayNames[i]}</div>
                  <div className="text-xs opacity-75">{formatTZ(day, 'dd/MM')}</div>
                </div>
                
                <div className="p-2 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                  {['sáng', 'chiều', 'tối'].map(shift => {
                    const shiftTasks = dayTasks.filter(t => {
                      if (!t.time) return shift === 'sáng'; // Default to morning if no time
                      const hour = parseInt(t.time.split(':')[0]);
                      if (shift === 'sáng') return hour >= 0 && hour < 12;
                      if (shift === 'chiều') return hour >= 12 && hour < 18;
                      return hour >= 18;
                    }).sort((a, b) => {
                      if (a.time && b.time) return a.time.localeCompare(b.time);
                      return 0;
                    });

                    if (shiftTasks.length === 0) return null;

                    return (
                      <div key={shift} className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 pl-1 flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", 
                            shift === 'sáng' ? 'bg-orange-400' :
                            shift === 'chiều' ? 'bg-blue-400' : 'bg-indigo-600'
                          )}></div>
                          Ca {shift}
                        </div>
                        {shiftTasks.map(task => (
                          <div 
                            key={task.id}
                            className={cn(
                              "group p-2 rounded-lg border text-sm transition-all flex flex-col",
                              task.completed 
                                ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60" 
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-start gap-2 mb-1">
                              <button
                                onClick={() => handleToggle(task.id, task.completed)}
                                className={cn(
                                  "flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 transition-colors",
                                  task.completed
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-300 dark:border-gray-600 hover:border-primary text-transparent"
                                )}
                                style={task.completed ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
                              >
                                <Check size={10} className={task.completed ? "opacity-100" : "opacity-0"} />
                              </button>
                              
                              <span className={cn(
                                "font-medium line-clamp-2 w-full break-all leading-tight flex-1",
                                task.completed ? "line-through text-gray-500" : ""
                              )}>
                                {task.time && <span className="text-primary font-bold mr-1.5 text-xs bg-primary/10 px-1 py-0.5 rounded">{task.time}{task.endTime ? ` - ${task.endTime}` : ''}</span>}
                                {task.title}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between ml-6 mt-2">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className={cn(
                                  "px-1.5 py-0.5 text-[10px] font-semibold rounded-md border",
                                  PRIORITY_COLORS[task.priority]
                                )}>
                                  {PRIORITY_LABELS[task.priority]}
                                </span>
                                {task.estimatedMinutes && (
                                  <span className="text-[10px] flex items-center text-gray-500 font-medium">
                                    <Clock size={10} className="mr-0.5" />
                                    {task.estimatedMinutes}p
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {dayTasks.length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400">Trống</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    if (filteredTasks.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
          <p className="text-lg">Không có công việc nào.</p>
          <p className="text-sm">Hãy tạo vài công việc để bắt đầu nhé!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div 
            key={task.id}
            className={cn(
              "group flex flex-col sm:flex-row gap-3 sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all",
              task.completed ? "opacity-60 bg-gray-50 dark:bg-gray-900/50" : "hover:border-primary/30 hover:shadow-md"
            )}
          >
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => handleToggle(task.id, task.completed)}
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                  task.completed 
                    ? "bg-primary border-primary text-white" 
                    : "border-gray-300 dark:border-gray-600 hover:border-primary text-transparent"
                )}
                style={task.completed ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
              >
                <Check size={14} className={task.completed ? "opacity-100" : "opacity-0"} />
              </button>
              
              <span className={cn(
                "font-medium text-lg truncate transition-all",
                task.completed ? "line-through text-gray-500" : ""
              )}>
                {task.time && <span className="text-primary font-bold mr-2 text-sm bg-primary/10 px-1.5 py-0.5 rounded">{task.time}{task.endTime ? ` - ${task.endTime}` : ''}</span>}
                {task.title}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 pl-10 sm:pl-0 mt-2 sm:mt-0">
              {task.estimatedMinutes && (
                <span className="text-xs flex items-center text-gray-500 font-medium">
                  <Clock size={12} className="mr-1" />
                  {task.estimatedMinutes} phút
                </span>
              )}
              <span className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full border",
                PRIORITY_COLORS[task.priority]
              )}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              
              {viewMode !== 'day' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {parseISO(task.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                </span>
              )}
              
              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                aria-label="Xóa công việc"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold">Lịch trình của tôi</h2>
        
        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          {(['day', 'week'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                viewMode === mode
                  ? "bg-primary text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              style={viewMode === mode ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {mode === 'day' ? 'Hôm nay' : 'Tuần này'}
            </button>
          ))}
        </div>
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-8 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-4 flex items-center justify-center space-x-2 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all outline-none"
        >
          <Plus size={20} />
          <span className="font-medium">Thêm công việc mới</span>
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleAddTask} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                autoFocus
                placeholder="Tên công việc..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full text-lg bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:outline-none py-2 px-1 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon size={14} /> Ngày</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                  <div className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-full max-w-[90px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-2 text-xs focus:border-primary outline-none"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      type="time"
                      value={newTaskEndTime}
                      onChange={(e) => setNewTaskEndTime(e.target.value)}
                      className="w-full max-w-[90px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-2 text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Tag size={14} /> Ưu tiên</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={cn(
                        "flex-1 py-2 px-2 text-xs rounded-lg border text-center transition-all",
                        newTaskPriority === p ? PRIORITY_COLORS[p] : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newTaskRecurring}
                  onChange={(e) => setNewTaskRecurring(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Lặp lại hàng tuần (12 tuần)</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-6 py-2 rounded-lg font-medium text-white bg-primary hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Lưu
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex-[1_1_0%] overflow-y-auto pr-2 pb-8 flex flex-col min-h-0">
        {viewMode === 'week' ? renderWeekTimetable() : renderListView()}
      </div>
    </div>
  );
}

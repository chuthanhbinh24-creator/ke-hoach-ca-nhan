import { useMemo } from 'react';
import { useAppStore } from '../store';
import { Task } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, subDays, format, isSameDay } from 'date-fns';
import { Flame, Trophy, CheckSquare } from 'lucide-react';

export function StatsView() {
  const { userTasks } = useAppStore();

  const stats = useMemo(() => {
    // 1. Calculate streak (consecutive days with at least 1 completed task)
    let currentStreak = 0;
    const today = new Date();
    
    // Create a set of dates where at least one task was completed
    const completedDates = new Set(
      userTasks
        .filter(t => t.completed)
        .map(t => taskDateStr(t))
    );

    // Count backwards from today
    let checkDate = today;
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (completedDates.has(dateStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // If today is not completed, we might still have a active streak up to yesterday.
        // Let's check yesterday.
        if (isSameDay(checkDate, today)) {
            const yesterdayDateStr = format(subDays(today, 1), 'yyyy-MM-dd');
            if (completedDates.has(yesterdayDateStr)) {
                checkDate = subDays(checkDate, 1);
                continue; // continue checking past yesterday
            }
        }
        break; // Streak broken
      }
    }

    // 2. Prepare past 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      
      const dayTasks = userTasks.filter(t => taskDateStr(t) === dStr);
      const completed = dayTasks.filter(t => t.completed).length;
      
      chartData.push({
        name: format(d, 'dd/MM'),
        completed,
        total: dayTasks.length
      });
    }

    // 3. Overall completion rate
    const totalCompleted = userTasks.filter(t => t.completed).length;
    
    return {
      streak: currentStreak,
      totalCompleted,
      chartData,
    };
  }, [userTasks]);

  function taskDateStr(t: Task) {
    // Ensure we're grouping by the assigned date uniformly
    return t.date; 
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Thống kế hiệu suất</h2>
        <p className="text-gray-500 dark:text-gray-400">Xem tiến độ và giữ vững thói quen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
          <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl mr-6">
            <Flame size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Chuỗi ngày (Streak)</p>
            <div className="text-3xl font-bold">{stats.streak} <span className="text-lg font-normal text-gray-500">ngày</span></div>
            {stats.streak > 0 && (
              <p className="text-sm text-orange-600 mt-1">Đang giữ lửa! Tiếp tục nhé.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
          <div className="bg-primary/10 text-primary p-4 rounded-2xl mr-6" style={{ color: 'var(--color-primary)' }}>
            <CheckSquare size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Hoàn thành tổng cộng</p>
            <div className="text-3xl font-bold">{stats.totalCompleted} <span className="text-lg font-normal text-gray-500">công việc</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex-1 min-h-[300px]">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" size={24} />
          Hiệu suất 7 ngày qua
        </h3>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="name" stroke="currentColor" className="text-gray-500 text-xs opacity-50" tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-gray-500 text-xs opacity-50" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="Hoàn thành"
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Calendar, CheckCircle, Clock, Settings as SettingsIcon, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { TasksView } from './TasksView';
import { PomodoroView } from './PomodoroView';
import { StatsView } from './StatsView';
import { SettingsView } from './SettingsView';

type Tab = 'tasks' | 'pomodoro' | 'stats' | 'settings';

export function Dashboard() {
  const { state, logout, updateUserSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = state.currentUser!;

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const tabs = [
    { id: 'tasks', label: 'Công việc', icon: CheckCircle },
    { id: 'pomodoro', label: 'Pomodoro', icon: Clock },
    { id: 'stats', label: 'Thống kê', icon: LayoutDashboard },
    { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-primary" style={{ color: 'var(--color-primary)' }}>
            <Calendar size={28} />
            <span className="text-xl font-bold">Kế Hoạch</span>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                )}
                style={isActive ? { color: 'var(--color-primary)', backgroundColor: `color-mix(in srgb, var(--color-primary) 15%, transparent)` } : {}}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 mb-2">
            <span className="font-medium truncate mr-2">{user.username}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500">
            <Menu size={24} />
          </button>
          <span className="font-semibold ml-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'pomodoro' && <PomodoroView />}
            {activeTab === 'stats' && <StatsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

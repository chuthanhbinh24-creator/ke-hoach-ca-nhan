import { useSyncExternalStore } from 'react';
import { AppState, Task, User } from './types';

const STORAGE_KEY = 'kehoach_app_data';

const defaultState: AppState = {
  tasks: [],
  users: [],
  currentUser: null,
};

function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultState;
  } catch (e) {
    console.error('Failed to load state', e);
    return defaultState;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

let globalState = loadState();
// Apply theme immediately on startup
if (typeof document !== 'undefined' && globalState.currentUser) {
  // Can't invoke applyTheme here easily without hoisting, let's just do it
  const user = globalState.currentUser;
  if (user.isDarkMode) {
    document.documentElement.classList.add('dark');
  }
  const color = user.primaryColor || '#3b82f6';
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--primary-color', color);
}

const listeners = new Set<() => void>();

function notify() {
  saveState(globalState);
  listeners.forEach((listener) => listener());
}

export function applyTheme(user: User | null) {
  if (typeof document === 'undefined') return;
  if (!user) {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--color-primary', '#3b82f6');
    document.documentElement.style.setProperty('--primary-color', '#3b82f6');
    return;
  }
  if (user.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  const color = user.primaryColor || '#3b82f6';
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--primary-color', color);
}

function setGlobalState(update: AppState | ((prev: AppState) => AppState)) {
  if (typeof update === 'function') {
    globalState = update(globalState);
  } else {
    globalState = update;
  }
  applyTheme(globalState.currentUser);
  notify();
}


export function useAppStore() {
  const state = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => globalState
  );

  const setState = setGlobalState;

  const login = (identifier: string, password?: string): { success: boolean; error?: string } => {
    const existingUser = state.users.find((u) => u.username === identifier || (u.email && u.email === identifier));
    if (existingUser) {
      if (existingUser.password && existingUser.password !== password) {
        return { success: false, error: 'Sai mật khẩu!' };
      }
      setState((prev) => ({ ...prev, currentUser: existingUser }));
      return { success: true };
    }
    return { success: false, error: 'Tài khoản không tồn tại. Vui lòng đăng ký.' };
  };

  const register = (username: string, email: string, password?: string): { success: boolean; error?: string } => {
    const existingUser = state.users.find((u) => u.username === username || (u.email && u.email === email));
    if (existingUser) {
      return { success: false, error: 'Tài khoản hoặc email đã tồn tại. Vui lòng đăng nhập.' };
    }
    
    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      primaryColor: '#3b82f6', // Tailwind blue-500
      isDarkMode: false,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser,
    }));
    
    return { success: true };
  };

  const changePassword = (oldPw: string, newPw: string): { success: boolean; error?: string } => {
    const user = state.currentUser;
    if (!user) return { success: false, error: 'Chưa đăng nhập' };
    if (user.password !== oldPw) return { success: false, error: 'Mật khẩu cũ không đúng' };
    
    updateUserSettings({ password: newPw });
    return { success: true };
  };

  const checkEmailExists = (email: string): boolean => {
    return state.users.some(u => u.email === email);
  };

  const resetPassword = (email: string, newPw: string): { success: boolean; error?: string } => {
    const userToUpdate = state.users.find(u => u.email === email);
    if (!userToUpdate) return { success: false, error: 'Không tìm thấy tài khoản với email này' };
    
    setState((prev) => {
      const updatedUser = { ...userToUpdate, password: newPw };
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      };
    });
    return { success: true };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentUser: null }));
  };

  const updateUserSettings = (updates: Partial<User>) => {
    if (!state.currentUser) return;
    const updatedUser = { ...state.currentUser, ...updates };
    setState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    }));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          ...task,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        },
      ],
    }));
  };

  const toggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const userTasks = state.currentUser
    ? state.tasks.filter((t) => t.userId === state.currentUser!.id)
    : [];

  return {
    state,
    userTasks,
    login,
    register,
    logout,
    updateUserSettings,
    addTask,
    toggleTask,
    deleteTask,
    changePassword,
    checkEmailExists,
    resetPassword,
  };
}

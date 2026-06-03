export type Priority = 'low' | 'medium' | 'high';
export type ViewMode = 'day' | 'week';

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  primaryColor: string; // e.g., 'blue', 'green', 'violet'
  isDarkMode: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  priority: Priority;
  date: string; // YYYY-MM-DD
  createdAt: number;
  estimatedMinutes?: number;
}

export interface AppState {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
}

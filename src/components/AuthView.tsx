import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Activity, LogIn, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export function AuthView() {
  const { login, register } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = username.trim();
    if (trimmed) {
      if (isLogin) {
        const result = login(trimmed, password);
        if (!result.success) {
          setError(result.error!);
        }
      } else {
        const result = register(trimmed, password);
        if (!result.success) {
          setError(result.error!);
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-6 text-primary" style={{ color: 'var(--color-primary, rgb(59, 130, 246))' }}>
          <Activity size={48} />
        </div>
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Kế Hoạch Cá Nhân
        </h1>
        <p className="mb-8 text-center text-gray-500 dark:text-gray-400">
          Tổ chức công việc và xây dựng thói quen hiệu quả.
        </p>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              isLogin 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              !isLogin 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Đăng ký mới
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tên tài khoản
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Nhập tên tài khoản..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Nhập mật khẩu..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary, rgb(59, 130, 246))' }}
          >
            <span>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Activity, LogIn, UserPlus, Eye, EyeOff, KeyRound, Mail, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'register' | 'forgot_password';

export function AuthView() {
  const { login, register, checkEmailExists, resetPassword } = useAppStore();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification
  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const resetForm = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setStep(1);
    setVerificationCode('');
    setPassword('');
    setConfirmPassword('');
    setCountdown(0);
  };

  const requestEmailOTP = async (targetEmail: string, context: string) => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, context }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      setSuccessMsg('Mã xác nhận đã được gửi đến email của bạn.');
      setCountdown(60);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi email!');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (targetEmail: string, code: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Mã xác nhận không đúng!');
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xác thực!');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (checkEmailExists(email)) {
      setError('Email này đã được sử dụng!');
      return;
    }

    await requestEmailOTP(email, 'Đăng ký tài khoản');
  };

  const handleForgotPasswordSubmit = async () => {
    if (!checkEmailExists(email)) {
      setError('Không tìm thấy tài khoản liên kết với Email này.');
      return;
    }
    
    await requestEmailOTP(email, 'Khôi phục mật khẩu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setSuccessMsg('');
    
    if (mode === 'login') {
      const result = login(username.trim(), password);
      if (!result.success) setError(result.error!);
      return;
    }

    if (step === 1) {
      if (mode === 'register') {
        await handleRegisterSubmit();
      } else if (mode === 'forgot_password') {
        await handleForgotPasswordSubmit();
      }
    } else if (step === 2) {
      const isValid = await verifyOTP(email, verificationCode);
      if (!isValid) return;
      
      if (mode === 'register') {
        const result = register(username.trim(), email.trim(), password);
        if (!result.success) {
          setError(result.error!);
        }
      } else if (mode === 'forgot_password') {
        const result = resetPassword(email.trim(), password);
        if (!result.success) {
          setError(result.error!);
        } else {
          setSuccessMsg('Cập nhật mật khẩu thành công! Vui lòng đăng nhập.');
          setTimeout(() => resetForm('login'), 2000);
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

        {mode !== 'forgot_password' && (
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-6">
            <button
              onClick={() => resetForm('login')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                mode === 'login' 
                  ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => resetForm('register')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                mode === 'register' 
                  ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {mode === 'forgot_password' && (
          <button 
            type="button"
            onClick={() => resetForm('login')}
            className="flex items-center text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Quay lại đăng nhập
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <>
              {(mode === 'login' || mode === 'register') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {mode === 'login' ? 'Tên / Email' : 'Tên tài khoản'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder={mode === 'login' ? "Tên hoặc Email đăng nhập..." : "Tên hiển thị..."}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              {(mode === 'register' || mode === 'forgot_password') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="vidu@gmail.com"
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {mode === 'forgot_password' ? 'Mật khẩu mới' : 'Mật khẩu'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder={mode === 'forgot_password' ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-4 pr-12 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Nhập lại mật khẩu..."
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-4 pr-12 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/20">
              <KeyRound size={32} className="mx-auto mb-3 text-primary" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Nhập mã xác nhận</h3>
              <p className="text-sm text-gray-500 mb-4">
                Mã xác nhận gồm 6 số đã được gửi đến:<br/><span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
              </p>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all mb-4"
              />
              <button 
                type="button"
                disabled={countdown > 0 || isLoading}
                onClick={() => requestEmailOTP(email, mode === 'register' ? 'Đăng ký tài khoản' : 'Khôi phục mật khẩu')}
                className={cn(
                  "mt-2 text-sm font-medium flex items-center justify-center mx-auto transition-colors",
                  countdown > 0 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-primary hover:underline cursor-pointer"
                )}
                style={countdown === 0 ? { color: 'var(--color-primary)' } : undefined}
              >
                {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã'}
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="text-green-600 dark:text-green-400 text-sm font-medium p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              {successMsg}
            </div>
          )}

          {mode === 'login' && step === 1 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => resetForm('forgot_password')}
                className="text-sm font-medium text-primary hover:underline transition-all"
                style={{ color: 'var(--color-primary)' }}
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary, rgb(59, 130, 246))' }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>
                  {step === 2 
                    ? 'Xác nhận' 
                    : mode === 'login' 
                      ? 'Đăng nhập' 
                      : mode === 'register' 
                        ? 'Đăng ký & Gửi mã' 
                        : 'Lấy lại mật khẩu'}
                </span>
                {step === 1 && (mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />)}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

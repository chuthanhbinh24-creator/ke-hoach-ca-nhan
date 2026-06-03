import { useAppStore } from '../store';
import { Palette, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = [
  { name: 'Xanh dương (Blue)', value: '#3b82f6' },
  { name: 'Xanh lá (Green)', value: '#22c55e' },
  { name: 'Tím (Purple)', value: '#a855f7' },
  { name: 'Đỏ hồng (Rose)', value: '#f43f5e' },
  { name: 'Cam (Orange)', value: '#f97316' },
];

export function SettingsView() {
  const { state, updateUserSettings } = useAppStore();
  const user = state.currentUser!;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-3xl font-bold mb-8">Cài đặt</h2>

      <div className="space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="text-primary" style={{ color: 'var(--color-primary)' }} />
            <h3 className="text-xl font-semibold">Giao diện</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chế độ tối (Dark Mode)</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bảo vệ mắt khi làm việc buổi tối</p>
              </div>
              <button
                onClick={() => updateUserSettings({ isDarkMode: !user.isDarkMode })}
                className={cn(
                  "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                  user.isDarkMode ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                )}
                style={user.isDarkMode ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                <span
                  className={cn(
                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-sm",
                    user.isDarkMode ? "translate-x-7" : "translate-x-1"
                  )}
                >
                  {user.isDarkMode ? (
                    <Moon size={14} className="text-gray-800" />
                  ) : (
                    <Sun size={14} className="text-gray-400" />
                  )}
                </span>
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="font-medium mb-4">Màu chủ đạo</p>
              <div className="flex flex-wrap gap-4 items-center">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateUserSettings({ primaryColor: color.value })}
                    className={cn(
                      "w-12 h-12 rounded-full transition-transform outline-none focus:ring-2 focus:ring-offset-2 ring-offset-white dark:ring-offset-gray-800",
                      user.primaryColor === color.value ? "scale-110 ring-2" : "hover:scale-105"
                    )}
                    style={{ 
                      backgroundColor: color.value,
                      '--tw-ring-color': color.value 
                    } as any}
                    title={color.name}
                  />
                ))}
                
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:scale-105 transition-transform">
                  <input 
                    type="color" 
                    value={user.primaryColor.startsWith('#') ? user.primaryColor : '#3b82f6'} 
                    onChange={(e) => updateUserSettings({ primaryColor: e.target.value })}
                    className="absolute -inset-4 w-20 h-20 cursor-pointer"
                    title="Tùy chọn màu"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Đồng bộ đám mây (Trực tuyến)</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tính năng đồng bộ qua đám mây hiện đang bị tắt vì thiết lập Firebase bị từ chối. Thông tin tài khoản và dữ liệu chỉ được lưu trữ trên trình duyệt này.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

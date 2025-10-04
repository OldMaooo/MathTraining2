import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GamificationService } from '../services/gamificationService';

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

export const TopNavigationSimple: React.FC<TopNavigationProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({ level: 1, exp: 0, streak: 0 });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [showStreakDetails, setShowStreakDetails] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({ id: 'default', name: '用户', createdAt: Date.now(), lastActiveAt: Date.now() });

  // 安全地获取用户资料
  useEffect(() => {
    try {
      const gamificationService = GamificationService.getInstance();
      const userProfile = gamificationService.getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      // 保持默认值
    }
  }, []);

  // 监听资料更新事件
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const gamificationService = GamificationService.getInstance();
        const userProfile = gamificationService.getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    };

    window.addEventListener('mp-profile-updated', handleProfileUpdate as any);
    return () => window.removeEventListener('mp-profile-updated', handleProfileUpdate as any);
  }, []);


  // 简化的经验进度计算
  const expProgress = {
    current: profile.exp,
    total: 100,
    percentage: Math.min(100, (profile.exp / 100) * 100)
  };

  // 连胜状态计算
  const today = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
  const todayIdx = today === 0 ? 6 : today - 1; // 转换为我们的索引：0=周一, 6=周日
  
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  const weekDots = Array.from({ length: 7 }).map((_, idx) => {
    const isToday = idx === todayIdx;
    if (profile.streak === 0) {
      return { isActive: false, isToday };
    }
    if (idx > todayIdx) { // Future dates cannot be active
      return { isActive: false, isToday };
    }
    const daysFromToday = todayIdx - idx;
    const isActive = daysFromToday >= 0 && daysFromToday < profile.streak;
    return { isActive, isToday };
  });

  // 今日答题数统计
  const correctAnswers = (() => {
    try {
      const history = JSON.parse(localStorage.getItem('mp-history') || '[]');
      const today = new Date().toDateString();
      return history
        .filter((record: any) => new Date(record.timestamp).toDateString() === today)
        .reduce((sum: number, record: any) => sum + (record.correct || 0), 0);
    } catch {
      return 0;
    }
  })();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* 左侧：标题 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('home')}
            className="text-xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            🧮 计算挑战赛
          </button>
        </div>

        {/* 中间：用户信息 */}
        <div className="flex items-center space-x-6">
          {/* 等级 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">等级:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{profile.level}</span>
          </div>

          {/* 经验值 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">经验:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{profile.exp}</span>
          </div>

          {/* 连胜 */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowStreakDetails(true)}
              onMouseLeave={() => setShowStreakDetails(false)}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              <span className="text-sm text-gray-600 dark:text-gray-300">连胜:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">{profile.streak}</span>
            </button>
            {showStreakDetails && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg py-3 z-50">
                <div className="px-4 py-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">本周连胜状态</div>
                  <div className="flex justify-between items-center mb-3">
                    {weekDots.map((dot, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          dot.isActive 
                            ? (dot.isToday ? 'bg-green-500' : 'bg-green-500/60') 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {dot.isActive && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className={`text-xs mt-1 ${dot.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                          {weekLabels[idx]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{correctAnswers}</div>
                        <div className="text-gray-600 dark:text-gray-400">今日答题数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{Math.floor(correctAnswers / 10)}</div>
                        <div className="text-gray-600 dark:text-gray-400">今日轮数</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center space-x-4">
          {/* 任务中心 */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTaskCenter(true)}
              onMouseLeave={() => setShowTaskCenter(false)}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              📋 任务
            </button>
            {showTaskCenter && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  任务中心功能开发中...
                </div>
              </div>
            )}
          </div>

          {/* 用户菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              👤 {currentAccount.name}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    toggleTheme();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {theme === 'light' ? '🌙 深色模式' : '☀️ 浅色模式'}
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  账号管理功能开发中...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

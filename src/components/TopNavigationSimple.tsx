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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">连胜:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">{profile.streak}</span>
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

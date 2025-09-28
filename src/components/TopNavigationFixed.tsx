import React, { useState, useEffect } from 'react';
import { GamificationService } from '../services/gamificationService';
import { useTheme } from '../contexts/ThemeContext';
import { AccountService, Account } from '../services/accountService';

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

export const TopNavigationFixed: React.FC<TopNavigationProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({ level: 1, exp: 0, streak: 0 });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccountName, setNewAccountName] = useState('');

  useEffect(() => {
    try {
      const gamificationService = GamificationService.getInstance();
      const refresh = () => {
        try {
          const p = gamificationService.getUserProfile();
          console.log('[TopNavigation] profile refreshed', p);
          setProfile(p);
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      };
      refresh();
      const onUpdated = () => refresh();
      window.addEventListener('mp-profile-updated', onUpdated as any);
      return () => window.removeEventListener('mp-profile-updated', onUpdated as any);
    } catch (error) {
      console.error('Error in profile useEffect:', error);
    }
  }, []);

  // 账号管理
  useEffect(() => {
    try {
      const accountService = AccountService.getInstance();
      const current = accountService.getCurrentAccount();
      const allAccounts = accountService.getAccounts();
      
      if (current) {
        setCurrentAccount(current);
        setAccounts(allAccounts);
      } else {
        // 如果没有当前账号，创建默认账号
        const defaultAccount = accountService.getOrCreateDefaultAccount();
        setCurrentAccount(defaultAccount);
        setAccounts([defaultAccount]);
      }
    } catch (error) {
      console.error('Account initialization error:', error);
      // 设置默认值避免崩溃
      setCurrentAccount({ id: 'default', name: '用户', createdAt: Date.now(), lastActiveAt: Date.now() });
      setAccounts([]);
    }
  }, []);

  // 安全地获取gamification服务信息
  const [levelInfo, setLevelInfo] = useState({ expRequired: 0, name: 'Level 1' });
  const [nextLevelInfo, setNextLevelInfo] = useState({ expRequired: 100, name: 'Level 2' });
  const [expProgress, setExpProgress] = useState({ current: 0, total: 100, percentage: 0 });

  useEffect(() => {
    try {
      const gamificationService = GamificationService.getInstance();
      const level = gamificationService.getLevelInfo(profile.level);
      const nextLevel = gamificationService.getLevelInfo(profile.level + 1);
      
      setLevelInfo(level);
      setNextLevelInfo(nextLevel);
      
      // 计算经验进度
      const currentLevelExp = level.expRequired;
      const nextLevelExp = nextLevel?.expRequired || level.expRequired;
      const progress = {
        current: profile.exp - currentLevelExp,
        total: nextLevelExp - currentLevelExp,
        percentage: nextLevelExp > currentLevelExp ? ((profile.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 100
      };
      setExpProgress(progress);
    } catch (error) {
      console.error('Error getting gamification info:', error);
    }
  }, [profile.level, profile.exp]);

  // 账号管理函数
  const handleSwitchAccount = (accountId: string) => {
    try {
      const accountService = AccountService.getInstance();
      accountService.setCurrentAccount(accountId);
      const account = accountService.getCurrentAccount();
      setCurrentAccount(account);
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) return;
    try {
      const accountService = AccountService.getInstance();
      const newAccount = accountService.createAccount(newAccountName.trim());
      setAccounts(prev => [...prev, newAccount]);
      setCurrentAccount(newAccount);
      setNewAccountName('');
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    try {
      const accountService = AccountService.getInstance();
      accountService.deleteAccount(accountId);
      const updatedAccounts = accountService.getAccounts();
      setAccounts(updatedAccounts);
      const current = accountService.getCurrentAccount();
      setCurrentAccount(current);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧标题 */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              计算挑战赛
            </button>
          </div>
          
          {/* 中间导航 */}
          <div className="flex items-center space-x-6">
            {/* 任务中心 */}
            <div 
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setShowTaskCenter(true)}
              onMouseLeave={() => setShowTaskCenter(false)}
            >
              <div className="h-5 w-5 text-purple-600">📋</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                任务
              </span>
              
              {/* 任务中心悬浮面板 */}
              {showTaskCenter && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">任务中心</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        暂无任务
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧用户信息 */}
          <div className="flex items-center space-x-4">
            {/* 经验值显示 */}
            <div className="flex items-center space-x-2">
              <div 
                className="relative"
                onMouseEnter={() => setShowExpTooltip(true)}
                onMouseLeave={() => setShowExpTooltip(false)}
              >
                <div className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Lv.{profile.level}</span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, expProgress.percentage))}%` }}
                    />
                  </div>
                </div>
                
                {/* 经验值悬浮提示 */}
                {showExpTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-50">
                    {expProgress.current}/{expProgress.total} EXP
                  </div>
                )}
              </div>
            </div>
            
            {/* 连胜显示 */}
            <div 
              className="relative"
              onMouseEnter={() => setShowStreakTooltip(true)}
              onMouseLeave={() => setShowStreakTooltip(false)}
            >
              <div className="flex items-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
                <span>🔥</span>
                <span className="font-medium">{profile.streak}</span>
              </div>
              
              {/* 连胜悬浮提示 */}
              {showStreakTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-50">
                  连续{profile.streak}天
                </div>
              )}
            </div>
            
            {/* 深色模式切换 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {/* 账号管理 */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="text-sm font-medium">{currentAccount?.name || '用户'}</span>
                <span className="text-xs">▼</span>
              </button>
              
              {/* 用户菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    {/* 账号切换 */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">切换账号</div>
                      {accounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between py-1">
                          <button
                            className={`flex-1 text-left text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              account.id === currentAccount?.id ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => handleSwitchAccount(account.id)}
                          >
                            {account.id === currentAccount?.id && '✓ '}{account.name}
                          </button>
                          {accounts.length > 1 && (
                            <button
                              className="text-red-500 hover:text-red-700 text-xs px-1"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* 创建新账号 */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">创建新账号</div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          placeholder="账号名称"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateAccount()}
                        />
                        <button
                          onClick={handleCreateAccount}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          创建
                        </button>
                      </div>
                    </div>
                    
                    {/* 其他功能 */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onNavigate('history');
                        setShowUserMenu(false);
                      }}
                    >
                      历史记录
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onNavigate('wrong-questions');
                        setShowUserMenu(false);
                      }}
                    >
                      错题管理
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

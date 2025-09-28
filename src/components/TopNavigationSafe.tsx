import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GamificationService } from '../services/gamificationService';
import { AccountService, Account } from '../services/accountService';

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

export const TopNavigationSafe: React.FC<TopNavigationProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profile, setProfile] = useState({ level: 1, exp: 0, streak: 0 });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

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

  // 安全地获取账号信息
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
      console.error('Error loading accounts:', error);
      // 设置默认值
      const defaultAccount = { id: 'default', name: '用户', createdAt: Date.now(), lastActiveAt: Date.now() };
      setCurrentAccount(defaultAccount);
      setAccounts([defaultAccount]);
    }
  }, []);

  // 账号管理函数
  const handleSwitchAccount = (accountId: string) => {
    try {
      const accountService = AccountService.getInstance();
      accountService.setCurrentAccount(accountId);
      const current = accountService.getCurrentAccount();
      if (current) {
        setCurrentAccount(current);
        setShowAccountMenu(false);
      }
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  const handleCreateAccount = () => {
    if (newAccountName.trim()) {
      try {
        const accountService = AccountService.getInstance();
        const newAccount = accountService.createAccount(newAccountName.trim());
        setCurrentAccount(newAccount);
        setAccounts(accountService.getAccounts());
        setNewAccountName('');
        setShowAccountMenu(false);
      } catch (error) {
        console.error('Error creating account:', error);
      }
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    try {
      const accountService = AccountService.getInstance();
      accountService.deleteAccount(accountId);
      const current = accountService.getCurrentAccount();
      setCurrentAccount(current);
      setAccounts(accountService.getAccounts());
    } catch (error) {
      console.error('Error deleting account:', error);
    }
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
              👤 {currentAccount?.name || '用户'}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                {/* 主题切换 */}
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
                
                {/* 账号管理 */}
                <div className="px-4 py-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">账号管理</div>
                  
                  {/* 当前账号列表 */}
                  <div className="space-y-1 mb-3">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between">
                        <button
                          onClick={() => handleSwitchAccount(account.id)}
                          className={`flex-1 text-left px-2 py-1 text-sm rounded ${
                            currentAccount?.id === account.id
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {currentAccount?.id === account.id && '✓ '}
                          {account.name}
                        </button>
                        {accounts.length > 1 && (
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* 创建新账号 */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="新账号名"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateAccount()}
                    />
                    <button
                      onClick={handleCreateAccount}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      创建
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

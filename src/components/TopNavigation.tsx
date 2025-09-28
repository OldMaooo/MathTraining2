import React, { useState, useEffect } from 'react';
import { GamificationService } from '../services/gamificationService';
import { useTheme } from '../contexts/ThemeContext';
import { AccountService, Account } from '../services/accountService';

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(GamificationService.getInstance().getUserProfile());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  useEffect(() => {
    const gamificationService = GamificationService.getInstance();
    const refresh = () => {
      const p = gamificationService.getUserProfile();
      console.log('[TopNavigation] profile refreshed', p);
      setProfile(p);
    };
    refresh();
    const onUpdated = () => refresh();
    window.addEventListener('mp-profile-updated', onUpdated as any);
    return () => window.removeEventListener('mp-profile-updated', onUpdated as any);
  }, []);

  // 账号管理
  useEffect(() => {
    try {
      const accountService = AccountService.getInstance();
      const current = accountService.getCurrentAccount();
      const allAccounts = accountService.getAccounts();
      
      if (!current && allAccounts.length > 0) {
        // 如果没有当前账号但有账号列表，设置第一个为当前账号
        accountService.setCurrentAccount(allAccounts[0].id);
        setCurrentAccount(allAccounts[0]);
      } else if (!current) {
        // 如果没有任何账号，创建默认账号
        const defaultAccount = accountService.getOrCreateDefaultAccount();
        setCurrentAccount(defaultAccount);
        setAccounts([defaultAccount]);
      } else {
        setCurrentAccount(current);
        setAccounts(allAccounts);
      }
    } catch (error) {
      console.error('Account initialization error:', error);
      // 设置默认值避免崩溃
      setCurrentAccount({ id: 'default', name: '用户', createdAt: Date.now(), lastActiveAt: Date.now() });
      setAccounts([]);
    }
  }, []);

  const gamificationService = GamificationService.getInstance();
  const levelInfo = gamificationService.getLevelInfo(profile.level);
  const nextLevelInfo = gamificationService.getLevelInfo(profile.level + 1);
  
  // 计算经验进度
  const currentLevelExp = levelInfo.expRequired;
  const nextLevelExp = nextLevelInfo?.expRequired || levelInfo.expRequired;
  const expProgress = {
    current: profile.exp - currentLevelExp,
    total: nextLevelExp - currentLevelExp,
    percentage: nextLevelExp > currentLevelExp ? ((profile.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 100
  };

  // 生成周历数据
  const generateWeekCalendar = () => {
    const today = new Date();
    const week = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      
      week.push({
        date: dateStr,
        dayName,
        isToday: dateStr === today.toISOString().split('T')[0],
        hasStreak: false // 简化版本，暂时不显示连胜历史
      });
    }
    
    return week;
  };

  const weekCalendar = generateWeekCalendar();
  
  // 获取任务列表
  const getTaskList = () => {
    const tasks = gamificationService.getDailyTasks();
    return Object.entries(tasks.tasks).map(([key, task]) => ({
      id: key,
      name: task.name,
      description: `目标: ${task.target}`,
      expReward: 1,
      completed: task.completed,
      progress: (task.progress / task.target) * 100
    }));
  };

  // 账号管理方法
  const handleCreateAccount = () => {
    if (newAccountName.trim()) {
      const accountService = AccountService.getInstance();
      const newAccount = accountService.createAccount(newAccountName.trim());
      setAccounts(accountService.getAccounts());
      setNewAccountName('');
      setShowAccountMenu(false);
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    const accountService = AccountService.getInstance();
    accountService.setCurrentAccount(accountId);
    setCurrentAccount(accountService.getCurrentAccount());
    setShowAccountMenu(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) {
      alert('至少需要保留一个账号');
      return;
    }
    
    if (confirm('确定要删除这个账号吗？')) {
      const accountService = AccountService.getInstance();
      accountService.deleteAccount(accountId);
      setAccounts(accountService.getAccounts());
      setCurrentAccount(accountService.getCurrentAccount());
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

          {/* 右侧导航 */}
          <div className="flex items-center space-x-4">
            {/* 经验值 */}
            <div 
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setShowExpTooltip(true)}
              onMouseLeave={() => setShowExpTooltip(false)}
            >
              <div className="h-5 w-5 text-blue-600">🎓</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile.exp}
              </span>
              
              {/* 经验值提示框 */}
              {showExpTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {levelInfo.name} (Lv.{profile.level})
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {profile.exp} / {nextLevelInfo?.expRequired || 'MAX'} EXP
                    </div>
                    {nextLevelInfo && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${expProgress.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          还需 {nextLevelInfo.expRequired - profile.exp} EXP 升级
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 连胜值 */}
            <div 
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setShowStreakTooltip(true)}
              onMouseLeave={() => setShowStreakTooltip(false)}
            >
              <div className="h-5 w-5 text-orange-500">🔥</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile.streak}
              </span>
              
              {/* 连胜提示框 */}
              {showStreakTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile.streak}日连胜
                    </div>
                    <div className="flex justify-center space-x-1 mt-3">
                      {weekCalendar.map((day, index) => (
                        <div key={day.date} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            day.hasStreak 
                              ? 'bg-green-500 text-white' 
                              : day.isToday 
                                ? 'bg-gray-200 text-gray-600' 
                                : 'bg-gray-100 text-gray-400'
                          }`}>
                            {day.hasStreak ? '✓' : day.dayName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {day.dayName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {/* 任务中心弹窗 */}
      {showTaskCenter && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">今日任务</h3>
              <button
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowTaskCenter(false)}
              >
                ×
              </button>
            </div>
            
            {/* 任务进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>任务进度</span>
                <span>{getTaskList().filter(t => t.completed).length}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getTaskList().filter(t => t.completed).length / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* 任务列表 */}
            <div className="space-y-3">
              {getTaskList().map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {task.completed && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        task.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {task.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {task.description}
                    </div>
                    {task.progress !== undefined && !task.completed && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {task.progress}%
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    +{task.expReward}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

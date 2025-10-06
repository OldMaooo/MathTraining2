import React, { useState, useEffect } from 'react';
import { GamificationService } from '../services/gamificationService';
import { useTheme } from '../contexts/ThemeContext';
import { AccountService } from '../services/accountService';
import type { Account } from '../services/accountService';
import { getCurrentLevel, getNextLevel } from '../types/gamification';

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onNavigate }) => {
  
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({ level: 1, exp: 0, streak: 0 });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const [expTooltipTimeout, setExpTooltipTimeout] = useState<NodeJS.Timeout | null>(null);
  const [streakTooltipTimeout, setStreakTooltipTimeout] = useState<NodeJS.Timeout | null>(null);
  const [taskCenterTimeout, setTaskCenterTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userMenuTimeout, setUserMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null);
  const [showDebugChip, setShowDebugChip] = useState<boolean>(true);

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
      // 账号切换时强制刷新个人档案与今日统计
      const onAccountChanged = () => refresh();
      window.addEventListener('mp-account-changed', onAccountChanged as any);
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
      const recent = accountService.getRecentAccounts();
      
      if (!current && allAccounts.length > 0) {
        // 如果没有当前账号但有账号列表，设置第一个为当前账号
        accountService.setCurrentAccount(allAccounts[0].id);
        setCurrentAccount(allAccounts[0]);
        setAccounts(allAccounts);
        setRecentAccounts(accountService.getRecentAccounts());
      } else if (!current) {
        // 如果没有任何账号，创建默认账号
        const defaultAccount = accountService.getOrCreateDefaultAccount();
        setCurrentAccount(defaultAccount);
        setAccounts([defaultAccount]);
        setRecentAccounts([]);
      } else {
        setCurrentAccount(current);
        setAccounts(allAccounts);
        setRecentAccounts(recent);
      }
    } catch (error) {
      console.error('Account initialization error:', error);
      // 设置默认值避免崩溃
      setCurrentAccount({ id: 'default', name: '用户', createdAt: Date.now(), lastActiveAt: Date.now() });
      setAccounts([]);
      setRecentAccounts([]);
    }
  }, []);

  // 清理超时
  useEffect(() => {
    return () => {
      if (expTooltipTimeout) clearTimeout(expTooltipTimeout);
      if (streakTooltipTimeout) clearTimeout(streakTooltipTimeout);
      if (taskCenterTimeout) clearTimeout(taskCenterTimeout);
      if (userMenuTimeout) clearTimeout(userMenuTimeout);
    };
  }, [expTooltipTimeout, streakTooltipTimeout, taskCenterTimeout, userMenuTimeout]);

  const gamificationService = GamificationService.getInstance();
  
  // 统一的浮层管理函数 - 实现互斥显示
  const showTooltip = (tooltipType: 'exp' | 'streak' | 'task' | 'user') => {
    // 先关闭所有其他浮层
    setShowExpTooltip(false);
    setShowStreakTooltip(false);
    setShowTaskCenter(false);
    setShowUserMenu(false);
    setShowAccountMenu(false);
    
    // 清除所有超时
    if (expTooltipTimeout) clearTimeout(expTooltipTimeout);
    if (streakTooltipTimeout) clearTimeout(streakTooltipTimeout);
    if (taskCenterTimeout) clearTimeout(taskCenterTimeout);
    if (userMenuTimeout) clearTimeout(userMenuTimeout);
    
    // 显示指定的浮层
    switch (tooltipType) {
      case 'exp':
        setShowExpTooltip(true);
        break;
      case 'streak':
        setShowStreakTooltip(true);
        break;
      case 'task':
        setShowTaskCenter(true);
        break;
      case 'user':
        setShowUserMenu(true);
        break;
    }
  };

  const hideTooltip = (tooltipType: 'exp' | 'streak' | 'task' | 'user') => {
    const timeout = setTimeout(() => {
      switch (tooltipType) {
        case 'exp':
          setShowExpTooltip(false);
          break;
        case 'streak':
          setShowStreakTooltip(false);
          break;
        case 'task':
          setShowTaskCenter(false);
          break;
        case 'user':
          setShowUserMenu(false);
          break;
      }
    }, 200);

    // 保存超时引用
    switch (tooltipType) {
      case 'exp':
        setExpTooltipTimeout(timeout);
        break;
      case 'streak':
        setStreakTooltipTimeout(timeout);
        break;
      case 'task':
        setTaskCenterTimeout(timeout);
        break;
      case 'user':
        setUserMenuTimeout(timeout);
        break;
    }
  };

  const cancelHideTooltip = (tooltipType: 'exp' | 'streak' | 'task' | 'user') => {
    switch (tooltipType) {
      case 'exp':
        if (expTooltipTimeout) {
          clearTimeout(expTooltipTimeout);
          setExpTooltipTimeout(null);
        }
        break;
      case 'streak':
        if (streakTooltipTimeout) {
          clearTimeout(streakTooltipTimeout);
          setStreakTooltipTimeout(null);
        }
        break;
      case 'task':
        if (taskCenterTimeout) {
          clearTimeout(taskCenterTimeout);
          setTaskCenterTimeout(null);
        }
        break;
      case 'user':
        if (userMenuTimeout) {
          clearTimeout(userMenuTimeout);
          setUserMenuTimeout(null);
        }
        break;
    }
  };
  
  // 使用经验值动态计算当前等级和下一等级
  const currentLevel = getCurrentLevel(profile.exp);
  const nextLevel = getNextLevel(profile.exp);
  
  // 计算经验进度 - 修复计数方式
  const currentLevelExp = currentLevel.expRequired;
  const nextLevelExp = nextLevel?.expRequired || currentLevel.expRequired;
  const expProgress = {
    current: Math.max(0, profile.exp - currentLevelExp), // 当前等级内的经验
    total: nextLevelExp - currentLevelExp, // 当前等级需要的总经验
    percentage: nextLevelExp > currentLevelExp ? Math.min(100, Math.max(0, ((profile.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100)) : 100
  };

  // 生成周历数据
  const generateWeekCalendar = () => {
    const today = new Date();
    const week = [];
    const todayStr = today.toISOString().split('T')[0];
    
    // 计算连胜经验值
    const getStreakExp = (daysAgo: number) => {
      if (daysAgo === 0) return 0; // 今天还没完成
      // 从最远的天数开始：第一天+2，第二天+3，第三天+4...
      return Math.min(2 + (profile.streak - daysAgo), 7);
    };
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      const daysAgo = i; // 0=今天，1=昨天，2=前天...
      
      // 连胜状态判断
      // 如果用户有连胜，那么从今天往前数，连续的天数应该有连胜
      const hasStreak = daysAgo > 0 && daysAgo <= profile.streak;
      const isTodayStreak = daysAgo === 0 && profile.streak > 0;
      
      week.push({
        date: dateStr,
        dayName,
        isToday: dateStr === todayStr,
        hasStreak,
        isTodayStreak,
        expValue: hasStreak ? getStreakExp(daysAgo) : 0
      });
    }
    
    return week;
  };

  const weekCalendar = generateWeekCalendar();
  
  // 获取任务列表
  const getTaskList = () => {
    const tasks = gamificationService.getDailyTasks();
    const taskList = [];
    
    // 每日登录（第一个）
    taskList.push({
      id: 'daily_login',
      name: '每日登录',
      expReward: 1,
      completed: tasks.tasks.daily_login.completed
    });
    
    // 学习时间任务（细分）
    const studyTime = tasks.tasks.study_time;
    taskList.push({ id: 'study_10', name: '学习10分钟', expReward: 3, completed: studyTime.progress >= 10 });
    taskList.push({ id: 'study_20', name: '学习20分钟', expReward: 3, completed: studyTime.progress >= 20 });
    taskList.push({ id: 'study_30', name: '学习30分钟', expReward: 3, completed: studyTime.progress >= 30 });
    
    // 答题任务（细分）
    const correctAnswers = tasks.tasks.correct_answers;
    taskList.push({ id: 'answer_30', name: '答对30题', expReward: 3, completed: correctAnswers.progress >= 30 });
    taskList.push({ id: 'answer_50', name: '答对50题', expReward: 3, completed: correctAnswers.progress >= 50 });
    taskList.push({ id: 'answer_100', name: '答对100题', expReward: 3, completed: correctAnswers.progress >= 100 });
    
    // 其他任务
    taskList.push({
      id: 'consecutive_wins',
      name: '连胜',
      expReward: 2,
      completed: tasks.tasks.consecutive_wins.completed
    });
    
    taskList.push({
      id: 'random_bonus',
      name: '随机奖励',
      expReward: 1,
      completed: tasks.tasks.random_bonus.completed
    });
    
    return taskList;
  };

  // 账号管理方法
  const handleAddAccount = () => {
    if (accountName.trim()) {
      const accountService = AccountService.getInstance();
      const account = accountService.loginOrCreateAccount(accountName.trim());
      setAccounts(accountService.getAccounts());
      setCurrentAccount(account);
      setRecentAccounts(accountService.getRecentAccounts());
      setAccountName('');
      setShowAddAccountModal(false);
      setShowAccountMenu(false);
      
      // 触发账号切换事件
      window.dispatchEvent(new CustomEvent('mp-account-changed'));
    }
  };

  const handleRegisterAccount = () => {
    if (accountName.trim()) {
      const accountService = AccountService.getInstance();
      const account = accountService.createAccount(accountName.trim());
      accountService.setCurrentAccount(account.id);
      setAccounts(accountService.getAccounts());
      setCurrentAccount(account);
      setRecentAccounts(accountService.getRecentAccounts());
      setAccountName('');
      setShowRegisterModal(false);
      setShowAccountMenu(false);
      
      // 触发账号切换事件
      window.dispatchEvent(new CustomEvent('mp-account-changed'));
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    const accountService = AccountService.getInstance();
    accountService.setCurrentAccount(accountId);
    setCurrentAccount(accountService.getCurrentAccount());
    setRecentAccounts(accountService.getRecentAccounts());
    setShowAccountMenu(false);
    
    // 触发账号切换事件
    window.dispatchEvent(new CustomEvent('mp-account-changed'));
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
      setRecentAccounts(accountService.getRecentAccounts());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="w-full px-4 sm:px-6 lg:px-8">
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
              onMouseEnter={() => showTooltip('exp')}
              onMouseLeave={() => hideTooltip('exp')}
            >
              <div className="h-5 w-5 text-blue-600">🎓</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile.exp}
              </span>
              
              {/* 经验值提示框 */}
              {showExpTooltip && (
                <div 
                  className="exp-tooltip absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
                  onMouseEnter={() => cancelHideTooltip('exp')}
                  onMouseLeave={() => hideTooltip('exp')}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {currentLevel.name} (L{currentLevel.level}-{nextLevel ? nextLevel.level : 'MAX'})
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {profile.exp} / {nextLevel ? nextLevel.expRequired : 'MAX'} EXP
                    </div>
                    {nextLevel && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${expProgress.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          还需 {Math.max(0, nextLevel.expRequired - profile.exp)} EXP 升级
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
              onMouseEnter={() => showTooltip('streak')}
              onMouseLeave={() => hideTooltip('streak')}
            >
              <div className="h-5 w-5 text-orange-500">🔥</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile.streak}
              </span>
              
              {/* 连胜提示框 */}
              {showStreakTooltip && (
                <div 
                  className="streak-tooltip absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
                  onMouseEnter={() => cancelHideTooltip('streak')}
                  onMouseLeave={() => hideTooltip('streak')}
                >
                    <div className="text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile.streak}日连胜
                    </div>
                    <div className="flex justify-center space-x-1 mt-3">
                      {weekCalendar.map((day, index) => (
                        <div key={day.date} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            day.isTodayStreak
                              ? 'bg-green-500 text-white' // 当日连胜：绿色+勾
                              : day.hasStreak
                                ? 'bg-green-500 text-white opacity-40' // 历史连胜：绿色+勾+透明度
                                : day.isToday
                                  ? 'border-2 border-gray-300 bg-transparent text-gray-600' // 今日未完成：空心圈+灰字
                                  : 'border-2 border-gray-200 bg-transparent text-gray-400 opacity-50' // 其他：空心圈+浅灰字+低透明度
                          }`}>
                            {day.isTodayStreak || day.hasStreak ? '✓' : day.dayName}
                          </div>
                          {day.expValue > 0 && (
                            <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                              +{day.expValue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* 今日统计（左对齐，新增总时长）*/}
                    {(() => {
                      const dailyStats = gamificationService.getDailyStats();
                      const accuracy = dailyStats.questionsAnswered > 0 
                        ? Math.round((dailyStats.correctAnswers / dailyStats.questionsAnswered) * 100)
                        : 0;
                      const avgTime = dailyStats.questionsAnswered > 0
                        ? Math.round(dailyStats.totalTime / dailyStats.questionsAnswered / 1000)
                        : 0;
                      const totalTimeSec = Math.round((dailyStats.totalTime || 0) / 1000);
                      
                      return (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            今日统计
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div>答题数: <span className="font-medium text-gray-900 dark:text-white">{dailyStats.questionsAnswered}</span></div>
                            <div>答对数: <span className="font-medium text-gray-900 dark:text-white">{dailyStats.correctAnswers}</span></div>
                            <div>正确率: <span className="font-medium text-gray-900 dark:text-white">{accuracy}%</span></div>
                            <div>平均用时: <span className="font-medium text-gray-900 dark:text-white">{avgTime}秒</span></div>
                            <div>答题总时长: <span className="font-medium text-gray-900 dark:text-white">{totalTimeSec}秒</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* 任务中心 */}
            <div 
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => showTooltip('task')}
              onMouseLeave={() => hideTooltip('task')}
            >
              <div className="h-5 w-5 text-purple-600">📋</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                任务
              </span>
            </div>


            {/* 账号管理 */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onMouseEnter={() => showTooltip('user')}
                onMouseLeave={() => hideTooltip('user')}
              >
                <span className="text-sm font-medium">{currentAccount?.name || '用户'}</span>
                <span className="text-xs">▼</span>
              </button>

              {/* 用户菜单 */}
              {showUserMenu && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  onMouseEnter={() => cancelHideTooltip('user')}
                  onMouseLeave={() => hideTooltip('user')}
                >
                  <div className="py-1">
                    {/* 切换账号 */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">切换账号</div>
                      
                      {/* 当前账号 */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            ✓ {currentAccount?.name}{currentAccount?.type === 'admin' ? '(admin)' : ''}
                          </span>
                          {currentAccount?.type === 'admin' && (
                            <></>
                          )}
                        </div>
                      </div>

                      {/* 最近切换的账号 */}
                      {recentAccounts.map(account => (
                        <button
                          type="button"
                          key={account.id}
                          className="w-full flex items-center justify-between py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 group"
                          onMouseEnter={() => setHoveredAccountId(account.id)}
                          onMouseLeave={() => setHoveredAccountId(null)}
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          <span>{account.name}{account.type === 'admin' ? '(admin)' : ''}</span>
                          {hoveredAccountId === account.id && accounts.length > 1 && (
                            <span
                              className="text-gray-400 group-hover:text-gray-500 text-xs px-1"
                              onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                            >
                              ×
                            </span>
                          )}
                        </button>
                      ))}

                      {/* 添加账号 */}
                      <button
                        className="flex items-center space-x-2 w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        onClick={() => setShowAddAccountModal(true)}
                      >
                        <span className="text-green-500">+</span>
                        <span>添加账号</span>
                      </button>
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
                    
                    {/* 深色模式切换 */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        toggleTheme();
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                        <span>{theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}</span>
                      </div>
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
        <div 
          className="task-center absolute top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          onMouseEnter={() => cancelHideTooltip('task')}
          onMouseLeave={() => hideTooltip('task')}
        >
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
                <span>{getTaskList().filter(t => t.completed).length}/{getTaskList().length}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(getTaskList().filter(t => t.completed).length / getTaskList().length) * 100}%` }}
                />
              </div>
            </div>

            {/* 任务列表 */}
            <div className="space-y-1">
              {getTaskList().map(task => (
                <div key={task.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-2 border-gray-300 bg-transparent text-gray-500'
                    }`}>
                      {task.completed ? '✓' : ''}
                    </div>
                    <span className={`text-sm font-medium ${
                      task.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {task.name}
                    </span>
                  </div>
                  <div className={`text-sm font-bold ${
                    task.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    +{task.expReward} EXP
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 添加账号弹窗 */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">添加已有账号</h3>
              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  setAccountName('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleAddAccount}
                disabled={!accountName.trim()}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                确认
              </button>
              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  setShowRegisterModal(true);
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                没有账号，立即注册
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 注册账号弹窗 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">注册新账号</h3>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setAccountName('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleRegisterAccount()}
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRegisterAccount}
                disabled={!accountName.trim()}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                注册
              </button>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowAddAccountModal(true);
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                已有账号，立即登录
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 右下角调试小面板：用于可视化验证账号-数据隔离 */}
      {showDebugChip && (
        <div className="fixed bottom-3 right-3 z-50 select-none">
          <div className="bg-black/70 text-white text-xs rounded px-3 py-2 shadow-lg space-y-1">
            <div className="flex items-center justify-between space-x-3">
              <div className="font-semibold">调试</div>
              <button
                onClick={() => setShowDebugChip(false)}
                className="text-white/60 hover:text-white"
                title="隐藏"
              >
                ×
              </button>
            </div>
            <div>账号: {currentAccount?.name} ({currentAccount?.id?.slice(-6)}) {currentAccount?.type === 'admin' ? '[ADMIN]' : ''}</div>
            <div>存储后缀: _{currentAccount?.id}</div>
            <div>EXP/Level/Streak: {profile.exp} / {getCurrentLevel(profile.exp).level} / {profile.streak}</div>
            {(() => {
              try {
                const daily = GamificationService.getInstance().getDailyStats();
                return (
                  <div>今日: {daily.questionsAnswered}题 / {daily.correctAnswers}对 / {(daily.totalTime/1000)|0}s</div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

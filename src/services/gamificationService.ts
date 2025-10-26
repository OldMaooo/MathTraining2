import type { UserProfile, DailyTasks, DailyStats, RandomBonusData, ExpGain, TaskInfo } from '../types/gamification';
import { STORAGE_KEYS, LEVELS, EXP_RULES } from '../types/gamification';
import { AccountService } from './accountService';
import { CloudStore } from './cloudStore';

export class GamificationService {
  private static instance: GamificationService;

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // 获取当前账号ID（每次都重新获取，不使用缓存）
  private getCurrentAccountId(): string {
    try {
      const accountService = AccountService.getInstance();
      const currentAccount = accountService.getCurrentAccount();
      console.log('[Gamification] 获取当前账号ID:', currentAccount?.id, currentAccount?.name);
      return currentAccount?.id || 'default';
    } catch (error) {
      console.error('Error getting current account ID:', error);
      return 'default';
    }
  }

  // 从云端同步用户数据
  async syncFromCloud(): Promise<void> {
    try {
      console.log('[CloudSync] ========== 开始云端同步流程 ==========');
      
      if (localStorage.getItem('mp-cloud-sync') !== '1') {
        console.log('[CloudSync] 云同步未开启，跳过同步');
        return;
      }

      const accountService = AccountService.getInstance();
      const currentAccount = accountService.getCurrentAccount();
      if (!currentAccount) {
        console.log('[CloudSync] 没有当前账号，跳过同步');
        return;
      }

      console.log('[CloudSync] 开始从云端同步数据...', currentAccount.name);
      
      // 获取当前本地档案（同步前）
      const beforeSyncLocalProfile = this.getUserProfile();
      console.log('[CloudSync] 同步前本地档案:', beforeSyncLocalProfile);
      
      const cloudStore = CloudStore.getInstance();
      // 修复中文字符编码问题 - 只对密码哈希使用编码，账号ID不使用
      const passwordHash = btoa(encodeURIComponent(currentAccount.name + '_password'));
      
      // 确保账户存在
      const cloudAccountId = await cloudStore.ensureAccount(currentAccount.name, passwordHash, currentAccount.type);
      console.log('[CloudSync] 云端账户ID:', cloudAccountId);
      
      // 从云端获取用户档案
      const { data: cloudProfile, error: profileError } = await cloudStore.supabase
        .from('profiles')
        .select('*')
        .eq('account_id', cloudAccountId)
        .limit(1)
        .maybeSingle();
      
      if (profileError) {
        console.error('[CloudSync] 获取云端档案失败:', profileError);
        console.log('[CloudSync] 云端连接失败，保持当前本地数据不变');
        console.log('[CloudSync] 当前本地档案保持不变:', beforeSyncLocalProfile);
        return;
      }
      
      if (cloudProfile) {
        console.log('[CloudSync] 找到云端档案:', cloudProfile);
        
        // 比较云端和本地数据，选择更新的版本
        const cloudProfileData: UserProfile = {
          exp: cloudProfile.exp || 0,
          level: cloudProfile.level || 1,
          streak: cloudProfile.streak || 0,
          lastActiveDate: cloudProfile.last_active_date || new Date().toISOString().split('T')[0],
          totalQuestions: cloudProfile.total_questions || 0,
          correctQuestions: cloudProfile.correct_questions || 0,
          totalTime: cloudProfile.total_time || 0
        };
        
        console.log('[CloudSync] 云端档案数据:', cloudProfileData);
        console.log('[CloudSync] 本地档案数据:', beforeSyncLocalProfile);
        
        // 如果云端数据比本地数据更新（EXP更高），则使用云端数据
        if (cloudProfileData.exp > beforeSyncLocalProfile.exp || 
            (cloudProfileData.exp === beforeSyncLocalProfile.exp && cloudProfileData.streak > beforeSyncLocalProfile.streak)) {
          console.log('[CloudSync] 云端数据更新，同步到本地');
          console.log('[CloudSync] 云端EXP:', cloudProfileData.exp, '本地EXP:', beforeSyncLocalProfile.exp);
          this.saveUserProfileLocalOnly(cloudProfileData);
          console.log('[CloudSync] 云端数据已同步到本地');
          
          // 验证同步后的本地数据
          const afterSyncLocalProfile = this.getUserProfile();
          console.log('[CloudSync] 同步后本地档案:', afterSyncLocalProfile);
        } else if (beforeSyncLocalProfile.exp > cloudProfileData.exp) {
          console.log('[CloudSync] 本地数据更新，同步到云端');
          console.log('[CloudSync] 本地EXP:', beforeSyncLocalProfile.exp, '云端EXP:', cloudProfileData.exp);
          // 本地数据更新，上传到云端
          await cloudStore.upsertProfile(cloudAccountId, beforeSyncLocalProfile);
          console.log('[CloudSync] 本地数据已同步到云端');
        } else {
          console.log('[CloudSync] 本地和云端数据一致，无需同步');
          console.log('[CloudSync] 本地EXP:', beforeSyncLocalProfile.exp, '云端EXP:', cloudProfileData.exp);
        }
      } else {
        console.log('[CloudSync] 云端没有找到档案，保持本地数据');
        console.log('[CloudSync] 当前本地档案保持不变:', beforeSyncLocalProfile);
      }

      // 同步题目日志到云端
      await this.syncQuestionLogsToCloud(cloudAccountId);
      
      // 从云端同步题目日志到本地
      await this.syncQuestionLogsFromCloud(cloudAccountId);
      
      // 最终验证
      const finalLocalProfile = this.getUserProfile();
      console.log('[CloudSync] 最终本地档案:', finalLocalProfile);
      console.log('[CloudSync] ========== 云端同步流程完成 ==========');
      
    } catch (error) {
      console.error('[CloudSync] 从云端同步数据失败:', error);
      console.log('[CloudSync] 同步失败，保持当前本地数据不变');
      
      // 获取失败时的本地数据
      const errorLocalProfile = this.getUserProfile();
      console.log('[CloudSync] 错误时的本地档案:', errorLocalProfile);
    }
  }

  // 获取题目日志（从localStorage读取）
  private getQuestionLogs(): any[] {
    // 首先尝试读取全局的题目日志（PlaySimple.tsx保存的位置）
    const globalStored = localStorage.getItem('mp-question-logs');
    if (globalStored) {
      try {
        const globalLogs = JSON.parse(globalStored);
        console.log('[CloudSync] 从全局mp-question-logs读取到题目日志:', {
          count: globalLogs.length,
          sample: globalLogs.slice(0, 2)
        });
        return globalLogs;
      } catch (error) {
        console.error('[CloudSync] 解析全局题目日志失败:', error);
      }
    }
    
    // 如果全局没有，尝试读取账户特定的题目日志
    const storageKey = this.getAccountStorageKey('mp-question-logs');
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const accountLogs = JSON.parse(stored);
        console.log('[CloudSync] 从账户特定存储读取到题目日志:', {
          storageKey,
          count: accountLogs.length,
          sample: accountLogs.slice(0, 2)
        });
        return accountLogs;
      } catch (error) {
        console.error('[CloudSync] 解析账户题目日志失败:', error);
      }
    }
    
    console.log('[CloudSync] 没有找到任何题目日志');
    return [];
  }

  // 保存题目日志（到localStorage）
  private saveQuestionLogs(logs: any[]): void {
    // 保存到全局存储（与PlaySimple.tsx保持一致）
    localStorage.setItem('mp-question-logs', JSON.stringify(logs));
    
    // 同时保存到账户特定存储（用于云端同步）
    const storageKey = this.getAccountStorageKey('mp-question-logs');
    localStorage.setItem(storageKey, JSON.stringify(logs));
    
    console.log('[CloudSync] 题目日志已保存到localStorage:', {
      globalKey: 'mp-question-logs',
      accountKey: storageKey,
      count: logs.length
    });
  }

  // 同步题目日志到云端
  private async syncQuestionLogsToCloud(cloudAccountId: string): Promise<void> {
    try {
      const questionLogs = this.getQuestionLogs();
      if (questionLogs.length === 0) {
        console.log('[CloudSync] 没有题目日志需要同步');
        return;
      }

      console.log(`[CloudSync] 开始同步 ${questionLogs.length} 条题目日志到云端`);
      console.log('[CloudSync] 本地题目日志详情:', {
        count: questionLogs.length,
        latestLog: questionLogs[questionLogs.length - 1],
        cloudAccountId
      });
      
      const cloudStore = CloudStore.getInstance();
      
      // 先检查云端是否已有数据，避免重复同步
      const { data: existingLogs, error: fetchError } = await cloudStore.supabase
        .from('question_logs')
        .select('id, question_data')
        .eq('account_id', cloudAccountId);
      
      if (fetchError) {
        console.error('[CloudSync] 获取云端现有日志失败:', fetchError);
        return;
      }
      
      // 过滤掉已存在的日志 - 基于题目内容（不包含时间戳，避免精度问题）
      const existingLogsSet = new Set();
      existingLogs?.forEach(log => {
        // 创建基于题目内容的唯一标识（不包含时间戳）
        const questionData = log.question_data;
        if (questionData) {
          const uniqueKey = `${questionData.a}_${questionData.b}_${questionData.operation}_${questionData.userAnswer || questionData.user_answer}`;
          existingLogsSet.add(uniqueKey);
        }
      });
      
      const newLogs = questionLogs.filter(log => {
        // 创建基于题目内容的唯一标识（不包含时间戳）
        const uniqueKey = `${log.a}_${log.b}_${log.operation}_${log.userAnswer || log.user_answer}`;
        return !existingLogsSet.has(uniqueKey);
      });
      
      if (newLogs.length === 0) {
        console.log('[CloudSync] 所有题目日志已存在于云端，无需同步');
        return;
      }
      
      console.log(`[CloudSync] 过滤后需要同步的新日志数量: ${newLogs.length}`);
      
      // 批量插入题目日志到云端（使用insert避免重复）
      const { error } = await cloudStore.supabase
        .from('question_logs')
        .insert(
          newLogs.map((log, index) => {
            // 确保timestamp字段存在
            const timestamp = log.timestamp || log.createdAt || Date.now();
            return {
              // 不指定id，让Supabase自动生成UUID
              account_id: cloudAccountId,
              question_data: {
                ...log,
                timestamp: timestamp
              },
              created_at: new Date(timestamp).toISOString()
            };
          })
        );

      if (error) {
        console.error('[CloudSync] 同步题目日志失败:', error);
        console.error('[CloudSync] 错误详情:', JSON.stringify(error, null, 2));
        console.error('[CloudSync] 同步失败的题目日志数量:', questionLogs.length);
        
        // 如果是表不存在的错误，跳过同步
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "question_logs" does not exist') ||
            error.message?.includes('does not exist')) {
          console.log('[CloudSync] question_logs表不存在，跳过题目日志同步');
        } else {
          console.log('[CloudSync] 其他错误，跳过题目日志同步');
        }
      } else {
        console.log('[CloudSync] 题目日志同步成功');
        console.log('[CloudSync] 成功同步的题目日志数量:', newLogs.length);
      }
    } catch (error) {
      console.error('[CloudSync] 同步题目日志异常:', error);
    }
  }

  // 从云端同步题目日志到本地
  private async syncQuestionLogsFromCloud(cloudAccountId: string): Promise<void> {
    try {
      const cloudStore = CloudStore.getInstance();
      
      // 从云端获取题目日志
      const { data: cloudLogs, error } = await cloudStore.supabase
        .from('question_logs')
        .select('question_data, created_at')
        .eq('account_id', cloudAccountId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[CloudSync] 获取云端题目日志失败:', error);
        console.error('[CloudSync] 错误详情:', JSON.stringify(error, null, 2));
        
        // 如果是表不存在的错误，跳过同步
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "question_logs" does not exist') ||
            error.message?.includes('does not exist')) {
          console.log('[CloudSync] question_logs表不存在，跳过题目日志同步');
        } else {
          console.log('[CloudSync] 其他错误，跳过题目日志同步');
        }
        return;
      }

      if (!cloudLogs || cloudLogs.length === 0) {
        console.log('[CloudSync] 云端没有题目日志');
        return;
      }

      console.log(`[CloudSync] 从云端获取到 ${cloudLogs.length} 条题目日志`);
      console.log('[CloudSync] 云端题目日志详情:', {
        count: cloudLogs.length,
        latestLog: cloudLogs[cloudLogs.length - 1],
        firstLog: cloudLogs[0]
      });

      // 提取题目数据并保存到本地
      const questionLogs = cloudLogs.map(log => {
        const data = log.question_data;
        // 确保timestamp字段存在
        if (data && !data.timestamp && log.created_at) {
          data.timestamp = new Date(log.created_at).getTime();
        }
        return data;
      }).filter(log => log !== null && log !== undefined);
      
      console.log('[CloudSync] 处理后的题目日志:', {
        originalCount: cloudLogs.length,
        processedCount: questionLogs.length,
        latestProcessedLog: questionLogs[questionLogs.length - 1]
      });
      
      this.saveQuestionLogs(questionLogs);

      // 重新计算今日统计
      this.recalculateDailyStatsFromLogs(questionLogs);

      console.log('[CloudSync] 云端题目日志已同步到本地');
    } catch (error) {
      console.error('[CloudSync] 从云端同步题目日志异常:', error);
    }
  }

  // 根据题目日志重新计算今日统计
  private recalculateDailyStatsFromLogs(questionLogs: any[]): void {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('[CloudSync] ========== 开始重新计算今日统计 ==========');
    console.log('[CloudSync] 输入参数:', {
      totalLogs: questionLogs.length,
      today
    });

    // 获取当前今日统计
    const currentDailyStats = this.getDailyStats();
    console.log('[CloudSync] 当前今日统计:', currentDailyStats);

    // 筛选今日的题目日志
    const todayLogs = questionLogs.filter(log => {
      const logDate = new Date(log.timestamp || log.createdAt || Date.now()).toISOString().split('T')[0];
      return logDate === today;
    });

    console.log('[CloudSync] 今日题目日志筛选结果:', {
      totalLogs: questionLogs.length,
      todayLogs: todayLogs.length,
      todayLogsSample: todayLogs.slice(0, 3)
    });

    // 计算今日统计
    let questionsAnswered = 0;
    let correctAnswers = 0;
    let totalTime = 0;

    todayLogs.forEach(log => {
      questionsAnswered++;
      if (log.isCorrect) {
        correctAnswers++;
      }
      totalTime += log.timeSpent || 0;
    });

    // 比较计算结果和当前统计
    const calculatedStats = {
      date: today,
      questionsAnswered,
      correctAnswers,
      totalTime,
      expGained: 0
    };

    console.log('[CloudSync] 计算出的今日统计:', calculatedStats);
    console.log('[CloudSync] 当前今日统计:', currentDailyStats);

    // 直接使用重新计算的统计，因为这是基于云端数据的准确统计
    console.log('[CloudSync] 使用重新计算的准确统计');
    this.saveDailyStats(calculatedStats);
    console.log('[CloudSync] 今日统计已更新:', calculatedStats);

    console.log('[CloudSync] ========== 重新计算今日统计完成 ==========');
  }

  // 仅保存到本地，不触发云同步
  private saveUserProfileLocalOnly(profile: UserProfile): void {
    console.log('[Gamification] ========== 开始保存用户档案到本地 ==========');
    console.log('[Gamification] 要保存的档案数据:', profile);
    
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.USER_PROFILE);
    console.log('[Gamification] 存储键:', storageKey);
    
    // 保存前检查当前存储的数据
    const beforeSave = localStorage.getItem(storageKey);
    console.log('[Gamification] 保存前的存储数据:', beforeSave);
    
    localStorage.setItem(storageKey, JSON.stringify(profile));
    
    // 保存后验证
    const afterSave = localStorage.getItem(storageKey);
    console.log('[Gamification] 保存后的存储数据:', afterSave);
    
    try {
      console.log('[Gamification] saveUserProfileLocalOnly 完成', profile);
      window.dispatchEvent(new CustomEvent('mp-profile-updated'));
      console.log('[Gamification] 已触发 mp-profile-updated 事件');
    } catch (error) {
      console.error('[Gamification] 触发事件失败:', error);
    }
    
    console.log('[Gamification] ========== 保存用户档案到本地完成 ==========');
  }

  // 获取账号特定的存储键
  private getAccountStorageKey(baseKey: string): string {
    const accountId = this.getCurrentAccountId();
    return `${baseKey}_${accountId}`;
  }

  // 获取用户档案
  getUserProfile(): UserProfile {
    console.log('[Gamification] ========== 开始获取用户档案 ==========');
    
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.USER_PROFILE);
    console.log('[Gamification] 存储键:', storageKey);
    
    const stored = localStorage.getItem(storageKey);
    console.log('[Gamification] 从localStorage读取的原始数据:', stored);
    
    if (stored) {
      try {
        const parsedProfile = JSON.parse(stored);
        console.log('[Gamification] 解析后的档案数据:', parsedProfile);
        console.log('[Gamification] ========== 获取用户档案完成 ==========');
        return parsedProfile;
      } catch (error) {
        console.error('[Gamification] 解析档案数据失败:', error);
        console.log('[Gamification] ========== 获取用户档案失败 ==========');
      }
    }

    console.log('[Gamification] 没有找到存储的档案，返回默认档案');
    // 默认用户档案
    const defaultProfile: UserProfile = {
      exp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalQuestions: 0,
      correctQuestions: 0,
      totalTime: 0
    };

    console.log('[Gamification] 默认档案:', defaultProfile);
    this.saveUserProfile(defaultProfile);
    console.log('[Gamification] ========== 获取用户档案完成（默认） ==========');
    return defaultProfile;
  }

  // 保存用户档案
  saveUserProfile(profile: UserProfile): void {
    console.log('[Gamification] ========== 开始保存用户档案 ==========');
    console.log('[Gamification] 要保存的档案数据:', profile);
    
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.USER_PROFILE);
    console.log('[Gamification] 存储键:', storageKey);
    
    // 保存前检查当前存储的数据
    const beforeSave = localStorage.getItem(storageKey);
    console.log('[Gamification] 保存前的存储数据:', beforeSave);
    
    localStorage.setItem(storageKey, JSON.stringify(profile));
    
    // 保存后验证
    const afterSave = localStorage.getItem(storageKey);
    console.log('[Gamification] 保存后的存储数据:', afterSave);
    
    try {
      console.log('[Gamification] saveUserProfile 完成', profile);
      window.dispatchEvent(new CustomEvent('mp-profile-updated'));
      console.log('[Gamification] 已触发 mp-profile-updated 事件');
    } catch (error) {
      console.error('[Gamification] 触发事件失败:', error);
    }

    // 立即同步到云端
    console.log('[Gamification] 开始同步档案到云端...');
    this.syncProfileToCloud(profile);
    console.log('[Gamification] ========== 保存用户档案完成 ==========');
  }

  // 同步用户档案到云端
  private async syncProfileToCloud(profile: UserProfile): Promise<void> {
    try {
      if (localStorage.getItem('mp-cloud-sync') === '1') {
        console.log('[CloudSync] 开始同步用户档案到云端...');
        const accountService = AccountService.getInstance();
        const currentAccount = accountService.getCurrentAccount();
        if (currentAccount) {
          console.log('[CloudSync] 当前账号:', currentAccount);
          // 先确保账户存在
          const passwordHash = btoa(encodeURIComponent(currentAccount.name + '_password'));
          const cloudAccountId = await CloudStore.getInstance().ensureAccount(currentAccount.name, passwordHash, currentAccount.type);
          console.log('[CloudSync] 账户ID:', cloudAccountId);
          await CloudStore.getInstance().upsertProfile(cloudAccountId, profile);
          console.log('[CloudSync] 用户档案同步成功');
        } else {
          console.log('[CloudSync] 未找到当前账号');
        }
      } else {
        console.log('[CloudSync] 云同步未开启');
      }
    } catch (error) {
      console.error('[CloudSync] 云同步异常:', error);
    }
  }

  // 添加经验值
  addExp(exp: number): void {
    const profile = this.getUserProfile();
    profile.exp += exp;
    
    // 检查是否升级
    const newLevel = this.calculateLevel(profile.exp);
    if (newLevel > profile.level) {
      profile.level = newLevel;
      // 可以在这里触发升级通知
    }

    console.log('[Gamification] addExp', { expAdded: exp, newExp: profile.exp });
    this.saveUserProfile(profile);
  }

  // 计算等级
  calculateLevel(exp: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (exp >= LEVELS[i].expRequired) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }

  // 获取等级信息
  getLevelInfo(level: number) {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  }

  // 计算经验获得
  calculateExpGain(accuracy: number, totalTime: number, correctCount: number): ExpGain {
    let total = 0;
    const details: { [key: string]: number } = {};

    // 正确率奖励
    if (accuracy >= 90) {
      details.accuracy = EXP_RULES.HIGH_ACCURACY;
      total += EXP_RULES.HIGH_ACCURACY;
    } else if (accuracy >= 80) {
      details.accuracy = EXP_RULES.MEDIUM_ACCURACY;
      total += EXP_RULES.MEDIUM_ACCURACY;
    } else if (accuracy >= 60) {
      details.accuracy = EXP_RULES.LOW_ACCURACY;
      total += EXP_RULES.LOW_ACCURACY;
    }

    // 时间奖励（分钟）
    const minutes = Math.floor(totalTime / 1000 / 60);
    if (minutes >= 10) {
      details.time = EXP_RULES.LONG_STUDY;
      total += EXP_RULES.LONG_STUDY;
    } else if (minutes >= 5) {
      details.time = EXP_RULES.MEDIUM_STUDY;
      total += EXP_RULES.MEDIUM_STUDY;
    }

    // 题目数量奖励
    if (correctCount >= 20) {
      details.questions = EXP_RULES.MANY_QUESTIONS;
      total += EXP_RULES.MANY_QUESTIONS;
    } else if (correctCount >= 10) {
      details.questions = EXP_RULES.SOME_QUESTIONS;
      total += EXP_RULES.SOME_QUESTIONS;
    }

    return { total, details };
  }

  // 更新连胜
  updateStreak(): void {
    const profile = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];
    
    // 连胜判定规则：当日答对题数 >= 10 才记为达成
    const todayStats = this.getDailyStats();
    const meetStreakToday = todayStats.date === today && (todayStats.correctAnswers >= 10);
    if (profile.lastActiveDate === today && !meetStreakToday) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (profile.lastActiveDate === yesterdayStr) {
      // 连续天数
      profile.streak += 1;
    } else {
      // 中断了，重新开始
      profile.streak = 1;
    }

    profile.lastActiveDate = today;
    this.saveUserProfile(profile);
  }

  // 获取每日任务
  getDailyTasks(): DailyTasks {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.DAILY_TASKS);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultTasks: DailyTasks = {
      date: today,
      tasks: {
        daily_login: { name: '每日登录', target: 1, progress: 0, completed: false },
        study_time: { name: '学习10分钟', target: 10, progress: 0, completed: false },
        correct_answers: { name: '答对100题', target: 100, progress: 0, completed: false },
        consecutive_wins: { name: '3局连胜', target: 3, progress: 0, completed: false },
        random_bonus: { name: '获得随机奖励', target: 1, progress: 0, completed: false }
      }
    };

    this.saveDailyTasks(defaultTasks);
    return defaultTasks;
  }

  // 保存每日任务
  saveDailyTasks(tasks: DailyTasks): void {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.DAILY_TASKS);
    localStorage.setItem(storageKey, JSON.stringify(tasks));

    try {
      if (localStorage.getItem('mp-cloud-sync') === '1') {
        const accountService = AccountService.getInstance();
        const currentAccount = accountService.getCurrentAccount();
        if (currentAccount) {
          const passwordHash = btoa(encodeURIComponent(currentAccount.name + '_password'));
          CloudStore.getInstance().ensureAccount(currentAccount.name, passwordHash, currentAccount.type)
            .then(cloudAccountId => {
              return CloudStore.getInstance().upsertDailyTasks(cloudAccountId, tasks);
            })
            .catch(() => {});
        }
      }
    } catch {}
  }

  // 更新每日任务
  updateDailyTasks(taskKey: keyof DailyTasks['tasks'], value: number): void {
    const tasks = this.getDailyTasks();
    const today = new Date().toISOString().split('T')[0];
    
    // 如果是新的一天，重置任务
    if (tasks.date !== today) {
      tasks.date = today;
      Object.keys(tasks.tasks).forEach(key => {
        tasks.tasks[key as keyof typeof tasks.tasks] = {
          ...tasks.tasks[key as keyof typeof tasks.tasks],
          progress: 0,
          completed: false
        };
      });
    }

    const task = tasks.tasks[taskKey];
    if (task) {
      task.progress = Math.min(task.progress + value, task.target);
      task.completed = task.progress >= task.target;
    }

    this.saveDailyTasks(tasks);
  }

  // 获取随机奖励数据
  getRandomBonusData(): RandomBonusData {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.RANDOM_BONUS);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultData: RandomBonusData = {
      date: today,
      used: 0,
      maxPerDay: 2
    };

    this.saveRandomBonusData(defaultData);
    return defaultData;
  }

  // 保存随机奖励数据
  saveRandomBonusData(data: RandomBonusData): void {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.RANDOM_BONUS);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  // 更新随机奖励数据
  updateRandomBonusData(used: number): void {
    const data = this.getRandomBonusData();
    const today = new Date().toISOString().split('T')[0];
    
    // 如果是新的一天，重置
    if (data.date !== today) {
      data.date = today;
      data.used = 0;
    }

    data.used = Math.min(data.used + used, data.maxPerDay);
    this.saveRandomBonusData(data);
  }

  // 获取每日统计
  getDailyStats(): DailyStats {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.DAILY_STATS);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultStats: DailyStats = {
      date: today,
      questionsAnswered: 0,
      correctAnswers: 0,
      totalTime: 0,
      expGained: 0
    };

    this.saveDailyStats(defaultStats);
    return defaultStats;
  }

  // 保存每日统计
  saveDailyStats(stats: DailyStats): void {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.DAILY_STATS);
    localStorage.setItem(storageKey, JSON.stringify(stats));

    try {
      if (localStorage.getItem('mp-cloud-sync') === '1') {
        const accountService = AccountService.getInstance();
        const currentAccount = accountService.getCurrentAccount();
        if (currentAccount) {
          const passwordHash = btoa(encodeURIComponent(currentAccount.name + '_password'));
          CloudStore.getInstance().ensureAccount(currentAccount.name, passwordHash, currentAccount.type)
            .then(cloudAccountId => {
              return CloudStore.getInstance().upsertDailyStats(cloudAccountId, stats);
            })
            .catch(() => {});
        }
      }
    } catch {}
  }
}
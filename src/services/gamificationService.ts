import type { UserProfile, DailyTasks, DailyStats, RandomBonusData, ExpGain, TaskInfo } from '../types/gamification';
import { STORAGE_KEYS, LEVELS, EXP_RULES } from '../types/gamification';
import { AccountService } from './accountService';

export class GamificationService {
  private static instance: GamificationService;

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // 获取当前账号ID
  private getCurrentAccountId(): string {
    try {
      const accountService = AccountService.getInstance();
      const currentAccount = accountService.getCurrentAccount();
      return currentAccount?.id || 'default';
    } catch (error) {
      console.error('Error getting current account ID:', error);
      return 'default';
    }
  }

  // 获取账号特定的存储键
  private getAccountStorageKey(baseKey: string): string {
    const accountId = this.getCurrentAccountId();
    return `${baseKey}_${accountId}`;
  }

  // 获取用户档案
  getUserProfile(): UserProfile {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.USER_PROFILE);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

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

    this.saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  // 保存用户档案
  saveUserProfile(profile: UserProfile): void {
    const storageKey = this.getAccountStorageKey(STORAGE_KEYS.USER_PROFILE);
    localStorage.setItem(storageKey, JSON.stringify(profile));
    try {
      console.log('[Gamification] saveUserProfile', profile);
      window.dispatchEvent(new CustomEvent('mp-profile-updated'));
    } catch {}
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
    
    if (profile.lastActiveDate === today) {
      // 今天已经更新过了
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
  }
}
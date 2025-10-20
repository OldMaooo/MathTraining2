// 学习路径服务
import { 
  LevelConfig,
  ChapterConfig,
  LevelProgress, 
  ChapterProgress, 
  LearningPathProgress, 
  StarRating, 
  UnlockStatus,
  ParentReward
} from '../types/learningPath';
import levelsConfig from '../config/levels.json';

export class LearningPathService {
  private static instance: LearningPathService;
  private progress: LearningPathProgress;
  private parentRewards: ParentReward[];

  private constructor() {
    this.progress = this.loadProgress();
    this.parentRewards = this.loadParentRewards();
  }

  public static getInstance(): LearningPathService {
    if (!LearningPathService.instance) {
      LearningPathService.instance = new LearningPathService();
    }
    return LearningPathService.instance;
  }

  // 加载进度数据
  private loadProgress(): LearningPathProgress {
    try {
      const stored = localStorage.getItem('mp-learning-path-progress');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load learning path progress:', error);
    }

    // 默认进度
    return {
      currentLevel: '1-1',
      chapters: [],
      levels: [],
      totalStars: 0,
      completionRate: 0
    };
  }

  // 保存进度数据
  private saveProgress(): void {
    try {
      localStorage.setItem('mp-learning-path-progress', JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save learning path progress:', error);
    }
  }

  // 加载家长奖励设置
  private loadParentRewards(): ParentReward[] {
    try {
      const stored = localStorage.getItem('mp-parent-rewards');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load parent rewards:', error);
    }
    return [];
  }

  // 保存家长奖励设置
  private saveParentRewards(): void {
    try {
      localStorage.setItem('mp-parent-rewards', JSON.stringify(this.parentRewards));
    } catch (error) {
      console.error('Failed to save parent rewards:', error);
    }
  }

  // 获取关卡进度
  public getLevelProgress(levelId: string): LevelProgress | null {
    return this.progress.levels.find(l => l.levelId === levelId) || null;
  }

  // 更新关卡进度
  public updateLevelProgress(levelId: string, time: number, accuracy: number): StarRating {
    const levelConfig = this.getLevelConfig(levelId);
    if (!levelConfig) {
      throw new Error(`Level config not found: ${levelId}`);
    }

    let levelProgress = this.getLevelProgress(levelId);
    if (!levelProgress) {
      // 创建新进度
      levelProgress = {
        levelId,
        stars: { bronze: false, silver: false, gold: false },
        bestTime: time,
        bestAccuracy: accuracy,
        attempts: 1,
        lastPlayed: new Date().toISOString(),
        personalBest: { time: time, accuracy: accuracy }
      };
      this.progress.levels.push(levelProgress);
    } else {
      // 更新现有进度
      levelProgress.attempts++;
      levelProgress.lastPlayed = new Date().toISOString();
      
      if (time < levelProgress.bestTime) {
        levelProgress.bestTime = time;
        levelProgress.personalBest.time = time;
      }
      if (accuracy > levelProgress.bestAccuracy) {
        levelProgress.bestAccuracy = accuracy;
        levelProgress.personalBest.accuracy = accuracy;
      }
    }

    // 计算星级
    const starRating = this.calculateStarRating(levelId, time, accuracy, levelProgress);
    levelProgress.stars = starRating;

    // 更新总星数
    this.updateTotalStars();
    this.updateCompletionRate();

    this.saveProgress();
    return starRating;
  }

  // 计算星级评定
  private calculateStarRating(levelId: string, time: number, accuracy: number, progress: LevelProgress): StarRating {
    const config = this.getLevelConfig(levelId);
    if (!config) {
      return { bronze: false, silver: false, gold: false, reason: { bronze: '', silver: '', gold: '' } };
    }

    const reasons = { bronze: '', silver: '', gold: '' };
    let bronze = false, silver = false, gold = false;

    // 铜星：个人进步达标
    if (config.requirements.bronze.type === 'personal_progress') {
      const improvement = this.calculatePersonalImprovement(levelId, time, accuracy);
      if (improvement >= config.requirements.bronze.value) {
        bronze = true;
        reasons.bronze = `个人进步${improvement.toFixed(1)}%`;
      } else {
        reasons.bronze = `需要进步${config.requirements.bronze.value}%，当前${improvement.toFixed(1)}%`;
      }
    }

    // 银星：达到客观标准
    if (time <= config.requirements.silver.time && accuracy >= config.requirements.silver.accuracy) {
      silver = true;
      reasons.silver = `用时${time.toFixed(1)}s ≤ ${config.requirements.silver.time}s，准确率${accuracy.toFixed(1)}% ≥ ${config.requirements.silver.accuracy}%`;
    } else {
      const timeOk = time <= config.requirements.silver.time;
      const accuracyOk = accuracy >= config.requirements.silver.accuracy;
      reasons.silver = `需要：用时≤${config.requirements.silver.time}s${timeOk ? '✓' : '✗'}，准确率≥${config.requirements.silver.accuracy}%${accuracyOk ? '✓' : '✗'}`;
    }

    // 金星：超越标准20%+
    const goldTime = config.requirements.gold.time;
    const goldAccuracy = config.requirements.gold.accuracy;
    if (time <= goldTime && accuracy >= goldAccuracy) {
      gold = true;
      reasons.gold = `用时${time.toFixed(1)}s ≤ ${goldTime}s，准确率${accuracy.toFixed(1)}% ≥ ${goldAccuracy}%`;
    } else {
      const timeOk = time <= goldTime;
      const accuracyOk = accuracy >= goldAccuracy;
      reasons.gold = `需要：用时≤${goldTime}s${timeOk ? '✓' : '✗'}，准确率≥${goldAccuracy}%${accuracyOk ? '✓' : '✗'}`;
    }

    return { bronze, silver, gold, reason: reasons };
  }

  // 计算个人进步
  private calculatePersonalImprovement(levelId: string, currentTime: number, currentAccuracy: number): number {
    const progress = this.getLevelProgress(levelId);
    if (!progress || progress.attempts <= 1) {
      return 100; // 首次尝试，认为进步100%
    }

    const prevTime = progress.personalBest.time;
    const prevAccuracy = progress.personalBest.accuracy;
    
    // 计算综合进步（时间更快 + 准确率更高）
    const timeImprovement = prevTime > 0 ? ((prevTime - currentTime) / prevTime) * 100 : 0;
    const accuracyImprovement = currentAccuracy > prevAccuracy ? ((currentAccuracy - prevAccuracy) / 100) * 100 : 0;
    
    return Math.max(0, (timeImprovement + accuracyImprovement) / 2);
  }

  // 检查关卡解锁状态
  public checkUnlockStatus(levelId: string): UnlockStatus {
    const config = this.getLevelConfig(levelId);
    if (!config) {
      return { isUnlocked: false, reason: '关卡配置不存在' };
    }

    // 第一关默认解锁
    if (levelId === '1-1') {
      return { isUnlocked: true, reason: '第一关默认解锁' };
    }

    // 检查前置条件
    const condition = config.unlockCondition;
    if (condition.includes('铜星')) {
      const requiredLevel = condition.replace('铜星', '');
      const progress = this.getLevelProgress(requiredLevel);
      if (!progress || !progress.stars.bronze) {
        return { 
          isUnlocked: false, 
          reason: `需要完成关卡${requiredLevel}并获得铜星`,
          requiredLevel,
          requiredStars: 1
        };
      }
    }

    return { isUnlocked: true, reason: '已解锁' };
  }

  // 获取关卡配置
  private getLevelConfig(levelId: string): LevelConfig | null {
    for (const chapter of levelsConfig.chapters) {
      const level = chapter.levels.find(l => l.id === levelId);
      if (level) {
        return level;
      }
    }
    return null;
  }

  // 获取所有章节配置
  public getChapters(): ChapterConfig[] {
    return levelsConfig.chapters;
  }

  // 获取指定章节的关卡
  public getChapterLevels(chapterId: number): LevelConfig[] {
    const chapter = levelsConfig.chapters.find(c => c.id === chapterId);
    return chapter ? chapter.levels : [];
  }

  // 更新总星数
  private updateTotalStars(): void {
    this.progress.totalStars = this.progress.levels.reduce((total, level) => {
      return total + (level.stars.bronze ? 1 : 0) + (level.stars.silver ? 1 : 0) + (level.stars.gold ? 1 : 0);
    }, 0);
  }

  // 更新完成率
  private updateCompletionRate(): void {
    const totalLevels = this.progress.levels.length;
    const completedLevels = this.progress.levels.filter(l => l.stars.bronze).length;
    this.progress.completionRate = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0;
  }

  // 获取当前进度
  public getProgress(): LearningPathProgress {
    return this.progress;
  }

  // 设置家长奖励
  public setParentReward(levelId: string, rewards: { bronze: string, silver: string, gold: string }): void {
    const existing = this.parentRewards.find(r => r.levelId === levelId);
    if (existing) {
      existing.rewards = rewards;
    } else {
      this.parentRewards.push({ levelId, rewards });
    }
    this.saveParentRewards();
  }

  // 获取家长奖励
  public getParentReward(levelId: string): { bronze: string, silver: string, gold: string } | null {
    const reward = this.parentRewards.find(r => r.levelId === levelId);
    return reward ? reward.rewards : null;
  }
}

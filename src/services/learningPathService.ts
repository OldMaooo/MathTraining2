// 学习路径服务
import type { 
  LevelConfig,
  ChapterConfig,
  LevelProgress, 
  ChapterProgress, 
  LearningPathProgress, 
  StarRating, 
  UnlockStatus,
  ParentReward
} from '../types/learningPath';
// import levelsConfig from '../config/levels.json' assert { type: 'json' };

// 临时硬编码数据用于调试
const levelsConfig = {
  "chapters": [
    {
      "id": 1,
      "name": "基础数感训练",
      "description": "Level 0-1: 建立数感基础，掌握凑十法",
      "difficultyRange": "1-18以内",
      "levels": [
        {
          "id": "level-0-basic-number-sense",
          "name": "基础数感 (1-9)",
          "chapter": 1,
          "order": 1,
          "content": "1-9的加减能瞬间反应，不思考",
          "questionCount": 20,
          "difficulty": {
            "range": "1-9",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 5, "accuracy": 80 },
            "silver": { "time": 3, "accuracy": 90 },
            "gold": { "time": 2, "accuracy": 95 }
          },
          "unlockCondition": "无"
        },
        {
          "id": "level-1-make-ten",
          "name": "凑十基础",
          "chapter": 1,
          "order": 2,
          "content": "掌握凑成10的组合，6-9与任一数",
          "questionCount": 20,
          "difficulty": {
            "range": "1-18",
            "operations": ["addition"]
          },
          "requirements": {
            "bronze": { "time": 8, "accuracy": 80 },
            "silver": { "time": 6, "accuracy": 90 },
            "gold": { "time": 4, "accuracy": 95 }
          },
          "unlockCondition": "level-0-basic-number-sense银星"
        }
      ]
    },
    {
      "id": 2,
      "name": "一位数运算",
      "description": "Level 2-3: 一位数与两位数运算，掌握进位技巧",
      "difficultyRange": "1-99以内",
      "levels": [
        {
          "id": "level-2-single-digit-no-carry",
          "name": "一位数运算(无进位)",
          "chapter": 2,
          "order": 1,
          "content": "一位数加两位数，不触发进位",
          "questionCount": 20,
          "difficulty": {
            "range": "1-99",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 12, "accuracy": 80 },
            "silver": { "time": 9, "accuracy": 90 },
            "gold": { "time": 6, "accuracy": 95 }
          },
          "unlockCondition": "level-1-make-ten银星"
        },
        {
          "id": "level-3-single-digit-with-carry",
          "name": "一位数运算(有进位)",
          "chapter": 2,
          "order": 2,
          "content": "熟练用凑整思维处理进位",
          "questionCount": 20,
          "difficulty": {
            "range": "1-99",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 12, "accuracy": 80 },
            "silver": { "time": 9, "accuracy": 90 },
            "gold": { "time": 6, "accuracy": 95 }
          },
          "unlockCondition": "level-2-single-digit-no-carry银星"
        }
      ]
    },
    {
      "id": 3,
      "name": "两位数基础运算",
      "description": "Level 4-5: 两位数加减，掌握按位合并和简单进位",
      "difficultyRange": "1-99以内",
      "levels": [
        {
          "id": "level-4-double-digit-no-carry",
          "name": "两位数运算(无跨十)",
          "chapter": 3,
          "order": 1,
          "content": "两位数相加相减，个位不跨十",
          "questionCount": 20,
          "difficulty": {
            "range": "1-99",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 16, "accuracy": 80 },
            "silver": { "time": 12, "accuracy": 90 },
            "gold": { "time": 8, "accuracy": 95 }
          },
          "unlockCondition": "level-3-single-digit-with-carry银星"
        },
        {
          "id": "level-5-double-digit-single-carry",
          "name": "两位数运算(单处进位)",
          "chapter": 3,
          "order": 2,
          "content": "处理一种进位或借位，用凑整或分拆法",
          "questionCount": 20,
          "difficulty": {
            "range": "1-99",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 16, "accuracy": 80 },
            "silver": { "time": 12, "accuracy": 90 },
            "gold": { "time": 8, "accuracy": 95 }
          },
          "unlockCondition": "level-4-double-digit-no-carry银星"
        }
      ]
    },
    {
      "id": 4,
      "name": "高级运算技巧",
      "description": "Level 6-7: 复杂进位和多步运算",
      "difficultyRange": "1-199以内",
      "levels": [
        {
          "id": "level-6-double-digit-multiple-carry",
          "name": "两位数运算(多处进位)",
          "chapter": 4,
          "order": 1,
          "content": "涉及两个位置都需处理的进位或退位",
          "questionCount": 20,
          "difficulty": {
            "range": "1-199",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 20, "accuracy": 80 },
            "silver": { "time": 15, "accuracy": 90 },
            "gold": { "time": 10, "accuracy": 95 }
          },
          "unlockCondition": "level-5-double-digit-single-carry银星"
        },
        {
          "id": "level-7-triple-operations",
          "name": "三数运算/混合步骤",
          "chapter": 4,
          "order": 2,
          "content": "心算三项相加或加减混合，提高耐干扰能力",
          "questionCount": 15,
          "difficulty": {
            "range": "1-199",
            "operations": ["addition", "subtraction"]
          },
          "requirements": {
            "bronze": { "time": 30, "accuracy": 80 },
            "silver": { "time": 24, "accuracy": 90 },
            "gold": { "time": 18, "accuracy": 95 }
          },
          "unlockCondition": "level-6-double-digit-multiple-carry银星"
        }
      ]
    }
  ]
};

// 确保数据完整
console.log('🔍 硬编码数据章节数量:', levelsConfig.chapters.length);
levelsConfig.chapters.forEach((chapter, index) => {
  console.log(`📖 章节 ${index + 1}: ${chapter.name}, 关卡数: ${chapter.levels.length}`);
});

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
      currentLevel: 'level-0-basic-number-sense',
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

    // 铜星：达到基础要求
    if (time <= config.requirements.bronze.time && accuracy >= config.requirements.bronze.accuracy) {
      bronze = true;
      reasons.bronze = `用时${time.toFixed(1)}s ≤ ${config.requirements.bronze.time}s，准确率${accuracy.toFixed(1)}% ≥ ${config.requirements.bronze.accuracy}%`;
    } else {
      const timeOk = time <= config.requirements.bronze.time;
      const accuracyOk = accuracy >= config.requirements.bronze.accuracy;
      reasons.bronze = `需要：用时≤${config.requirements.bronze.time}s${timeOk ? '✓' : '✗'}，准确率≥${config.requirements.bronze.accuracy}%${accuracyOk ? '✓' : '✗'}`;
    }

    // 银星：达到中等标准
    if (time <= config.requirements.silver.time && accuracy >= config.requirements.silver.accuracy) {
      silver = true;
      reasons.silver = `用时${time.toFixed(1)}s ≤ ${config.requirements.silver.time}s，准确率${accuracy.toFixed(1)}% ≥ ${config.requirements.silver.accuracy}%`;
    } else {
      const timeOk = time <= config.requirements.silver.time;
      const accuracyOk = accuracy >= config.requirements.silver.accuracy;
      reasons.silver = `需要：用时≤${config.requirements.silver.time}s${timeOk ? '✓' : '✗'}，准确率≥${config.requirements.silver.accuracy}%${accuracyOk ? '✓' : '✗'}`;
    }

    // 金星：达到高级标准
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

    // 临时：所有关卡都解锁用于测试
    return { isUnlocked: true, reason: '测试模式：所有关卡解锁' };

    // 检查前置条件
    const condition = config.unlockCondition;
    if (condition === '无') {
      return { isUnlocked: true, reason: '无前置条件' };
    }
    
    if (condition.includes('银星')) {
      const requiredLevel = condition.replace('银星', '');
      const progress = this.getLevelProgress(requiredLevel);
      if (!progress || !progress.stars.silver) {
        return { 
          isUnlocked: false, 
          reason: `需要完成关卡${requiredLevel}并获得银星`,
          requiredLevel,
          requiredStars: 2
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
    try {
      console.log('🔍 LearningPathService.getChapters() 被调用');
      console.log('🔍 levelsConfig:', levelsConfig);
      console.log('🔍 levelsConfig.chapters:', levelsConfig.chapters);
      console.log('🔍 章节数量:', levelsConfig.chapters?.length || 0);
      return levelsConfig.chapters || [];
    } catch (error) {
      console.error('Failed to get chapters:', error);
      return [];
    }
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

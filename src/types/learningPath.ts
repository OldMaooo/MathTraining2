// 学习路径系统类型定义

export interface Level {
  id: string;                    // 关卡ID，如 "1-1"
  name: string;                  // 关卡名称
  chapter: number;               // 所属章节
  order: number;                 // 章节内顺序
  content: string;               // 内容描述
  questionCount: number;         // 题目数量
  requirements: {
    bronze: { type: 'personal_progress', value: number };  // 铜星：个人进步
    silver: { time: number, accuracy: number };            // 银星：客观标准
    gold: { time: number, accuracy: number };              // 金星：超越标准
  };
  unlockCondition: string;       // 解锁条件，如 "1-1铜星"
  parentRewards: {
    bronze: string;              // 铜星奖励文本
    silver: string;              // 银星奖励文本
    gold: string;                // 金星奖励文本
  };
}

export interface Chapter {
  id: number;
  name: string;
  description: string;
  difficultyRange: string;       // 如 "10-20以内"
  levels: Level[];
}

export interface LevelProgress {
  levelId: string;
  stars: {
    bronze: boolean;
    silver: boolean;
    gold: boolean;
  };
  bestTime: number;              // 最佳用时（秒）
  bestAccuracy: number;          // 最佳准确率（0-100）
  attempts: number;              // 尝试次数
  lastAttemptTime: number;       // 最后尝试时间（毫秒）
  lastAttemptAccuracy: number;   // 最后尝试准确率（0-100）
  lastAttemptDate: string;       // 最后尝试日期（YYYY-MM-DD）
  lastPlayed: string;            // 最后游玩时间
}

export interface ChapterProgress {
  chapterId: number;
  completedLevels: number;       // 已完成关卡数
  totalLevels: number;           // 总关卡数
  starsEarned: number;           // 获得星数
  totalStars: number;            // 总星数
  isUnlocked: boolean;           // 是否解锁
}

export interface LearningPathProgress {
  currentLevel: string;          // 当前关卡ID
  chapters: ChapterProgress[];   // 各章节进度
  levels: LevelProgress[];       // 各关卡进度
  totalStars: number;            // 总星数
  completionRate: number;        // 完成率（0-100）
}

// 三星评级结果
export interface StarRating {
  bronze: boolean;
  silver: boolean;
  gold: boolean;
  reason: {
    bronze: string;              // 铜星获得原因
    silver: string;              // 银星获得原因
    gold: string;                // 金星获得原因
  };
}

// 关卡解锁状态
export interface UnlockStatus {
  isUnlocked: boolean;
  reason: string;                // 解锁/未解锁原因
  requiredLevel?: string;        // 需要完成的关卡
  requiredStars?: number;        // 需要的星数
}

// 家长奖励设置
export interface ParentReward {
  levelId: string;
  rewards: {
    bronze: string;
    silver: string;
    gold: string;
  };
}

// 关卡配置
export interface LevelConfig {
  id: string;
  name: string;
  chapter: number;
  order: number;
  content: string;
  questionCount: number;
  difficulty: {
    range: string;               // 如 "10-20以内"
    operations: string[];        // 如 ["addition", "subtraction"]
  };
  requirements: {
    bronze: { type: 'personal_progress', value: number };
    silver: { time: number, accuracy: number };
    gold: { time: number, accuracy: number };
  };
  unlockCondition: string;
}

// 章节配置
export interface ChapterConfig {
  id: number;
  name: string;
  description: string;
  difficultyRange: string;
  levels: LevelConfig[];
}

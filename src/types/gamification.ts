// 游戏化系统类型定义

export interface UserProfile {
  exp: number;           // 总经验值
  level: number;         // 当前等级
  streak: number;        // 连胜天数
  lastActiveDate: string; // 最后活跃日期
  totalQuestions: number; // 总题目数
  correctQuestions: number; // 答对题目数
  totalTime: number;     // 总学习时间(毫秒)
}

export interface DailyTasks {
  date: string;          // 日期
  tasks: {
    daily_login: TaskInfo;
    study_time: TaskInfo;
    correct_answers: TaskInfo;
    consecutive_wins: TaskInfo;
    random_bonus: TaskInfo;
  };
}

export interface TaskInfo {
  name: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface DailyStats {
  date: string;          // 日期
  questionsAnswered: number; // 答题数
  correctAnswers: number; // 答对数
  totalTime: number;     // 总时间(毫秒)
  expGained: number;     // 获得经验
}

export interface RandomBonusData {
  date: string;          // 日期
  used: number;          // 已使用次数(0-2)
  maxPerDay: number;     // 每日最大使用次数
}

export interface LevelInfo {
  level: number;
  name: string;
  expRequired: number;
}

export interface ExpGain {
  total: number;         // 总经验
  details: { [key: string]: number }; // 详细分解
}

// localStorage 键名常量
export const STORAGE_KEYS = {
  USER_PROFILE: 'mp-user-profile',
  DAILY_TASKS: 'mp-daily-tasks',
  DAILY_STATS: 'mp-daily-stats',
  RANDOM_BONUS: 'mp-random-bonus',
} as const;

// 等级配置
export const LEVELS: LevelInfo[] = [
  { level: 1, name: '青铜菜鸡', expRequired: 0 },
  { level: 2, name: '白银战神', expRequired: 200 },
  { level: 3, name: '黄金卷王', expRequired: 400 },
  { level: 4, name: '钻石屠夫', expRequired: 800 },
  { level: 5, name: '学神天尊', expRequired: 1600 },
];

// 经验获取规则
export const EXP_RULES = {
  HIGH_ACCURACY: 5,      // 90%+ 正确率
  MEDIUM_ACCURACY: 3,    // 80-89% 正确率
  LOW_ACCURACY: 1,       // 60-79% 正确率
  LONG_STUDY: 3,         // 学习10分钟+
  MEDIUM_STUDY: 1,       // 学习5-9分钟
  MANY_QUESTIONS: 2,     // 答对20题+
  SOME_QUESTIONS: 1,     // 答对10-19题
} as const;
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

// 等级配置 - 25级经验值体系
const expRequirements = [
  0,    // L1 青铜菜鸡
  30,   // L2 白银菜鸡  
  70,   // L3 黄金菜鸡
  120,  // L4 钻石菜鸡
  180,  // L5 黑曜石菜鸡
  250,  // L6 青铜战神
  330,  // L7 白银战神
  420,  // L8 黄金战神
  520,  // L9 钻石战神
  630,  // L10 黑曜石战神
  750,  // L11 青铜卷王
  880,  // L12 白银卷王
  1020, // L13 黄金卷王
  1170, // L14 钻石卷王
  1330, // L15 黑曜石卷王
  1500, // L16 青铜屠夫
  1680, // L17 白银屠夫
  1870, // L18 黄金屠夫
  2070, // L19 钻石屠夫
  2280, // L20 黑曜石屠夫
  2500, // L21 青铜天尊
  2730, // L22 白银天尊
  2970, // L23 黄金天尊
  3220, // L24 钻石天尊
  3480  // L25 黑曜石天尊
];

const levelNames = [
  '青铜菜鸡', '白银菜鸡', '黄金菜鸡', '钻石菜鸡', '黑曜石菜鸡',
  '青铜战神', '白银战神', '黄金战神', '钻石战神', '黑曜石战神',
  '青铜卷王', '白银卷王', '黄金卷王', '钻石卷王', '黑曜石卷王',
  '青铜屠夫', '白银屠夫', '黄金屠夫', '钻石屠夫', '黑曜石屠夫',
  '青铜天尊', '白银天尊', '黄金天尊', '钻石天尊', '黑曜石天尊'
];

export const LEVELS: LevelInfo[] = expRequirements.map((exp, index) => ({
  level: index + 1,
  name: levelNames[index],
  expRequired: exp
}));

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

// 等级相关工具函数
export const getCurrentLevel = (exp: number): LevelInfo => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].expRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
};

export const getNextLevel = (exp: number): LevelInfo | null => {
  const currentLevel = getCurrentLevel(exp);
  const currentIndex = LEVELS.findIndex(level => level.level === currentLevel.level);
  return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
};

export const getExpProgress = (exp: number): number => {
  const currentLevel = getCurrentLevel(exp);
  const nextLevel = getNextLevel(exp);
  
  if (!nextLevel) return 100; // 已达到最高等级
  
  const currentExp = exp - currentLevel.expRequired;
  const requiredExp = nextLevel.expRequired - currentLevel.expRequired;
  
  return Math.min(100, Math.max(0, (currentExp / requiredExp) * 100));
};
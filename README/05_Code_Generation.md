# 代码生成与预览

## 开发里程碑

### M0 - 基础功能（今天就能用）
- [ ] 项目初始化和基础配置
- [ ] 题目生成系统（退位减法为主）
- [ ] 基础UI组件（计时器、数字键盘、进度条）
- [ ] 练习页面核心逻辑
- [ ] 结果页面和统计
- [ ] localStorage数据持久化

### M1 - 增强体验（1-2天）
- [ ] 错误分类和即时反馈
- [ ] 连击系统和微激励
- [ ] 错题强化功能
- [ ] 音效和震动反馈
- [ ] 首次使用引导

### M2 - 智能调节（本周内）
- [ ] 自适应难度调节
- [ ] 个人最佳成绩追踪
- [ ] 学习建议引擎
- [ ] 简单的趋势图表

### M3 - 完善功能（后续）
- [ ] PWA支持
- [ ] 多主题切换
- [ ] 数据导出功能
- [ ] 家长监控面板

## 核心组件设计

### 题目生成器
```typescript
interface Question {
  id: string;
  a: number;
  b: number;
  operation: '+' | '-';
  hasBorrow: boolean;
  correctAnswer: number;
}

class QuestionGenerator {
  generateBorrowSubtraction(range: number): Question;
  generateMixedQuestions(count: number, borrowRatio: number): Question[];
}
```

### 错误分类器
```typescript
type ErrorType = 'borrow' | 'carry' | 'careless' | 'timeout';

class ErrorClassifier {
  classify(question: Question, answer: number, timeUsed: number): ErrorType;
}
```

### 自适应调节器
```typescript
class AdaptiveController {
  adjustDifficulty(history: Attempt[]): Config;
  getNextConfig(current: Config, performance: Performance): Config;
}
```

## 数据模型
```typescript
interface Session {
  id: string;
  config: Config;
  questions: Question[];
  attempts: Attempt[];
  summary: SessionSummary;
}

interface Attempt {
  questionId: string;
  answer: number | null;
  correct: boolean;
  timeMs: number;
  errorType?: ErrorType;
  timestamp: number;
}

interface Profile {
  personalBest: Record<string, SessionSummary>;
  badges: string[];
  history: SessionSummary[];
}
```

## 测试策略
- 单元测试：题目生成算法、错误分类逻辑
- 集成测试：完整练习流程
- 用户测试：真实使用场景验证



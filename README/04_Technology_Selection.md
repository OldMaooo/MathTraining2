# 技术框架与实现思路

## 技术栈选择

### 前端框架
**推荐：React + Vite + TypeScript**
- **React**：组件化开发，适合构建交互式界面
- **Vite**：快速开发服务器，热更新体验好
- **TypeScript**：类型安全，减少运行时错误

### 样式方案
**推荐：Tailwind CSS**
- 快速开发，无需写大量CSS
- 响应式设计支持好
- 适合移动端开发

### 状态管理
**推荐：Zustand**
- 轻量级，学习成本低
- 适合中小型项目
- 支持持久化

### 数据存储
**推荐：localStorage + IndexedDB**
- localStorage：存储用户配置和简单数据
- IndexedDB：存储练习历史和详细数据
- 无需后端，部署简单

## 项目结构
```
src/
├── pages/           # 页面组件
│   ├── Start.tsx    # 开始页
│   ├── Play.tsx     # 练习页
│   └── Review.tsx   # 结果页
├── components/      # 通用组件
│   ├── Timer.tsx    # 倒计时器
│   ├── Numpad.tsx   # 数字键盘
│   ├── ProgressBar.tsx # 进度条
│   └── Combo.tsx    # 连击显示
├── logic/          # 业务逻辑
│   ├── generator.ts # 题目生成
│   ├── classifier.ts # 错误分类
│   └── adaptive.ts  # 自适应算法
├── store/          # 状态管理
│   ├── session.ts  # 练习会话
│   └── profile.ts  # 用户档案
└── utils/          # 工具函数
    └── storage.ts  # 存储工具
```

## 核心算法

### 题目生成算法
```typescript
// 生成退位减法题目
function generateBorrowSubtraction(range: number): Question {
  // 确保个位需要借位
  // 控制退位题目比例
}

// 错误分类算法
function classifyError(question: Question, answer: number): ErrorType {
  // 借位错误、进位混淆、粗心错误、超时
}
```

### 自适应难度调节
```typescript
// 2-1阶梯算法
function adjustDifficulty(consecutiveCorrect: number, hasError: boolean): Config {
  // 连续2题正确：提高难度或缩短时间
  // 出现错误：降低难度或延长时间
}
```

## 部署方案
- **静态部署**：Vercel、Netlify 或 GitHub Pages
- **PWA支持**：可安装到设备桌面
- **离线使用**：支持无网络环境练习

## 开发工具
- **代码编辑器**：VS Code
- **版本控制**：Git
- **包管理**：npm 或 yarn
- **构建工具**：Vite



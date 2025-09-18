# 计算挑战赛 - 部署说明

## 项目概述
这是一个基于React + TypeScript + Vite开发的数学练习应用，专为小学生设计，包含多种数学题型。

## 功能特性
- 🎯 9种数学题型：退位减法、进位加法、加减混合、乘法、除法、乘除混合、四则混合、加减法填空、乘除法填空
- ⏱️ 精确计时：支持自定义单题时间限制，精确到小数点后2位
- 📊 数据统计：实时显示答题进度、正确率、速度对比
- 🎨 现代UI：基于Tailwind CSS的响应式设计
- 📱 移动端适配：支持手机、平板等设备

## 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **状态管理**: Zustand
- **开发工具**: ESLint + PostCSS

## 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署状态
- ✅ 项目已准备就绪
- ⏳ 等待推送到GitHub仓库
- 📝 需要确认GitHub仓库权限

## 部署步骤
1. 确保GitHub仓库 `MathTraining2` 存在且有推送权限
2. 执行 `git push -f origin main` 强制推送
3. 在GitHub Pages中启用自动部署

## 项目结构
```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── logic/         # 业务逻辑
├── store/         # 状态管理
└── main.tsx       # 应用入口
```

## 联系方式
如有问题请联系开发者。

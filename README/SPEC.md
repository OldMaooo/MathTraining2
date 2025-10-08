# 综合规范（合并版）

说明：本文件合并了现有 SPEC-1004 与后续新增/修订规范。若存在冲突：
- 已实现的功能以代码现状为准；
- 未实现但有冲突的，以最新修订为主。

## 账号与权限
- 账号类型：`parent` | `child` | `admin`（默认注册为 parent）。
- admin：仅限特定账号名（当前为 `mao1986`），显示调试面板与开发者工具。
- parent：可在“我的 → 添加账号”创建多个 child；拥有管理权限（题目难度/时长、清空错题、删除账号等）。
- child：仅用于练习，数据与父级隔离。数据按账号后缀隔离存储。
- 结构：
  - `Account { id, name, type, parentId?, createdAt, lastActiveAt }`
  - 子账号用 `parentId` 指向父账号。

## 连胜/任务/经验
- 等级体系：25 级，经验曲线与命名见 SPEC-1004（保持一致）。
- 经验进度：结算与头部均展示，进度条带动画，暗色模式兼容。
- 连胜判定（最新修订）：当日答对题数 ≥ 10 记为“达成今日连胜”；周历从周一开始，封顶加成 +8；
  - 今日：绿色圆+勾+绿色数值；
  - 历史已得：绿色圆+勾+半透明绿色数值；
  - 历史未得：空心圈，无数值；
  - 未来：空心圈，显示灰色“+可获得”数值。
- 每日任务中心：进度条（蓝/紫），含日常项：每日登录、学习时长、答对题数、连胜、随机奖励（支持“领取”）。

## 做题与计时
- READY/GO：开场 READY 期间暂停倒计时，顶部显示剩余总秒数；GO 结束后自动解除暂停并恢复。
- 总时长显示：使用“单题时长 × 题数”；错题惩罚扣除“单题时长”。
- 提交去抖与状态：useRef + 500ms 防抖，兜底超时复位。
- Admin 一键做题：在调试面板中可启停；节奏 0.6–1.2s 随机；支持正确率与数量设置。

## 历史与错题
- 每轮完成后写入 `mp-history`（含完整日志与统计）。
- 错题保存到 `mp-wrong-questions_{accountId}`；仅 parent/admin 可清空或基于错题生成试卷。

## UI/UX
- 统一使用 TailwindCSS，深色模式通过 `dark:` 变体。
- 头部悬浮层（经验/连胜/任务/用户）采用延时关闭+互斥显示；所有浮层在入口正下方居中或右对齐以避免溢出。
- 经验旁附环形进度指示。

## 兼容与迁移
- 旧账户无 type 时：启动时补为 parent；名称为 `mao1986` 的补为 admin。
- 子账号仅在新建时带 parentId，老数据不改动。

## 经验/等级 详细规范（原 SPEC-1004 合并）

### 等级体系
- 25个等级，从 L1 到 L25；名称与经验要求如下：

```text
L1 青铜菜鸡(0), L2 白银菜鸡(30), L3 黄金菜鸡(70), L4 钻石菜鸡(120), L5 黑曜石菜鸡(180),
L6 青铜战神(250), L7 白银战神(330), L8 黄金战神(420), L9 钻石战神(520), L10 黑曜石战神(630),
L11 青铜卷王(750), L12 白银卷王(880), L13 黄金卷王(1020), L14 钻石卷王(1170), L15 黑曜石卷王(1330),
L16 青铜屠夫(1500), L17 白银屠夫(1680), L18 黄金屠夫(1870), L19 钻石屠夫(2070), L20 黑曜石屠夫(2280),
L21 青铜天尊(2500), L22 白银天尊(2730), L23 黄金天尊(2970), L24 钻石天尊(3220), L25 黑曜石天尊(3480)
```

对应实现（src/types/gamification.ts）：

```startLine:endLine:/Users/mao/Documents/Coding/Development/Projects/Web/加减法练习/src/types/gamification.ts
64:91:const expRequirements = [
  0,    30,   70,   120,  180,
  250,  330,  420,  520,  630,
  750,  880,  1020, 1170, 1330,
  1500, 1680, 1870, 2070, 2280,
  2500, 2730, 2970, 3220, 3480
];
```

### 经验获取规则
- 准确率：≥90/+5，≥80/+3，≥60/+1
- 学习时长（分钟）：≥10/+3，≥5/+1
- 题量：≥20/+2，≥10/+1

对应实现（EXP_RULES 与 calculateExpGain）：

```startLine:endLine:/Users/mao/Documents/Coding/Development/Projects/Web/加减法练习/src/types/gamification.ts
107:116:export const EXP_RULES = {
  HIGH_ACCURACY: 5,
  MEDIUM_ACCURACY: 3,
  LOW_ACCURACY: 1,
  LONG_STUDY: 3,
  MEDIUM_STUDY: 1,
  MANY_QUESTIONS: 2,
  SOME_QUESTIONS: 1,
} as const;
```

```startLine:endLine:/Users/mao/Documents/Coding/Development/Projects/Web/加减法练习/src/services/gamificationService.ts
99:136:  calculateExpGain(accuracy: number, totalTime: number, correctCount: number): ExpGain {
    let total = 0;
    const details: { [key: string]: number } = {};
    // 正确率奖励 ...（同文档规则）
    return { total, details };
  }
```

### 经验进度展示
- 结算页：线性进度条，h-3，2s 动画，dark 适配。
- 头部：🎓右侧环形进度（SVG 双圆，前景dash控制，-90°旋转）。

## 音效系统（原 SPEC-1004 合并）
- 目录：public/sfx/（correct.wav, wrong.wav, start.wav, success.mp3）。
- 播放：异步 `audio.play()`，错误容忍；入口：答对/答错/开始/结算。

## 调试面板（原 SPEC-1004 合并）
- 右上角悬浮，黑底半透；显示状态、题目进度、答案、提交状态、音效测试按钮。
- Admin 独享；支持一键做题开关与两个滑杆（正确率/数量）。

## 历史记录与输入框修复（原 SPEC-1004 合并）
- 历史：每轮完成写入 `mp-history`，包含题目日志、统计、时间、准确率等。
- 输入框：影子状态 + onBlur 同步，避免清空值导致抖动；高度 36px（首页三项统一）。

## 实现状态（截至最新提交）
- [x] 25级等级体系与经验进度（结算页与头部环形进度）
- [x] 深色模式与头部悬浮层互斥/延时关闭
- [x] 连胜周历（周一开始、四态展示、封顶+8、显式未来可得值）
- [x] 连胜规则：当日答对≥10判定达成（服务侧更新）
- [x] 每日任务中心（含随机奖励“领取”按钮、每日上限）
- [x] READY/GO 期间暂停倒计时，顶部显示总秒数，GO 后恢复
- [x] 总时长=单题×题数；错题扣单题时长
- [x] 提交防抖/状态防卡死（useRef + 500ms）
- [x] 历史记录写入与错题集保存
- [x] Admin 调试面板与一键做题（开关、正确率滑杆、数量滑杆、0.6–1.2s 自动答题节奏）
- [x] 账号体系：多账号、admin=mao1986 自动判定；“我的”菜单右对齐与管理项
- [ ] 账号扩展：parent/child 角色与父子关联管理（已入规范，等待实现）



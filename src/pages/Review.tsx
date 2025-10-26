import { useState, useEffect, useRef } from 'react';
import { colors } from '../styles/colors';
import { getCurrentLevel, getNextLevel, getExpProgress } from '../types/gamification';
import { GamificationService } from '../services/gamificationService';

interface ReviewProps {
  onRestart: () => void;
}

// 饼图组件（绿色=正确，红色=错误，总和=已答）
const PieChart: React.FC<{ correct: number; wrong: number; total: number }> = ({ correct, wrong, total }) => {
  // 对齐 Figma 视觉：更大半径与更粗线宽
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const correctLen = total > 0 ? (correct / total) * circumference : 0;
  const wrongLen = total > 0 ? (wrong / total) * circumference : 0;

  // 已移除：这里不应放在 PieChart 内部使用 brokeRecord。实际渲染逻辑在 Review 组件中处理。

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
          {/* 背景环 */}
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
          {/* 正确（绿色）段 */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="22"
            strokeDasharray={`${correctLen} ${circumference - correctLen}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
          {/* 错误（红色）段，紧随绿色之后 */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="22"
            strokeDasharray={`${wrongLen} ${circumference - wrongLen}`}
            strokeDashoffset={circumference - correctLen}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
          {/* 中心文字（显示正确率）*/}
          <text
            x="110"
            y="110"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-3xl font-extrabold text-gray-800 dark:text-gray-200"
            fill="currentColor"
            style={{ transform: 'rotate(90deg)', transformOrigin: '110px 110px' }}
          >
            {total > 0 ? Math.round((correct / total) * 100) : 0}%
          </text>
        </svg>
      </div>
    </div>
  );
};

// 速度对比条状图组件
const SpeedChart: React.FC<{ 
  currentSpeed: number; 
  bestSpeed: number | null; 
  brokeRecord: boolean; 
}> = ({ currentSpeed, bestSpeed, brokeRecord }) => {
  const maxSpeed = Math.max(currentSpeed, bestSpeed || 0);
  const currentWidth = maxSpeed > 0 ? (currentSpeed / maxSpeed) * 100 : 0;
  const bestWidth = maxSpeed > 0 && bestSpeed ? (bestSpeed / maxSpeed) * 100 : 0;

  return (
    <div className="w-full max-w-md">
      
      {/* 历史最佳速度 - 始终显示，即使没有历史记录也显示占位 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">历史最佳</span>
          <span className={`text-sm font-medium ${colors.status.success}`}>
            {bestSpeed !== null ? `${bestSpeed.toFixed(2)}s` : '暂无记录'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3.5">
          <div 
            className="bg-green-500 h-3.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${bestWidth}%` }}
          />
        </div>
      </div>
      
      {/* 本次速度 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">本次速度</span>
          <span className={`text-sm font-medium ${brokeRecord ? colors.status.success : 'text-gray-600 dark:text-gray-400'}`}>
            {currentSpeed.toFixed(2)}s
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3.5">
          <div 
            className={`h-3.5 rounded-full transition-all duration-700 ease-out ${
              brokeRecord 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gray-400'
            }`}
            style={{ width: `${currentWidth}%` }}
          />
        </div>
        {brokeRecord && bestSpeed !== null && (
          <div className="text-center mt-2">
            <span className={`text-xs ${colors.status.success} font-medium`}>🎉 破纪录！</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const Review: React.FC<ReviewProps> = ({ onRestart }) => {
  // 成功音效
  const sfxBase = (import.meta as any).env?.BASE_URL || '/';
  const successRef = useRef<HTMLAudioElement | null>(null);
  
  // 撒花动画
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiUrl, setConfettiUrl] = useState<string | null>(null);
  const playSuccess = () => {
    try {
      // 你当前的文件是 success.mp3，这里做多格式回退的解析
      const url = `${sfxBase}sfx/success.mp3`;
      if (!successRef.current) successRef.current = new Audio(url);
      successRef.current.currentTime = 0;
      successRef.current.play().catch(() => {});
    } catch {}
  };
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeUsed, setTimeUsed] = useState(0);
  const [questionType, setQuestionType] = useState('退位减法');
  const [localStorageData, setLocalStorageData] = useState<Record<string, string | null>>({});
  const [avgTime, setAvgTime] = useState<number>(0);
  const [bestAvgTime, setBestAvgTime] = useState<number | null>(null);
  const [brokeRecord, setBrokeRecord] = useState(false);
  const [improveSeconds, setImproveSeconds] = useState<number>(0);
  const [improvePercent, setImprovePercent] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [expDetail, setExpDetail] = useState<{ accuracy: number; totalTimeSec: number; correct: number; total: number; expGain: any } | null>(null);
  // 结果页调试临时移除
  const [showQuestionAnalysis, setShowQuestionAnalysis] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [questionLogs, setQuestionLogs] = useState<Array<{
    a: number;
    b: number;
    operation: '+' | '-' | '×' | '÷';
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
    timeTaken: number;
    displayText: string;
    isFillBlank?: boolean;
    blankPosition?: 'a' | 'b' | 'result';
  }>>([]);
  const [sortField, setSortField] = useState<string>('question');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // 读取可配置的 Lottie 撒花 URL（优先），否则使用 Canvas 撒花作为兜底
  useEffect(() => {
    try {
      const url = localStorage.getItem('mp-confetti-url');
      setConfettiUrl(url && url.trim() ? url : null);
    } catch {}
  }, []);

  // 如果没有配置 Lottie URL，则使用 Canvas 动画兜底
  useEffect(() => {
    if (confettiUrl) return; // 使用 Lottie 时不启用 Canvas 撒花
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    // 设置canvas尺寸
    const setSize = () => {
      try {
        const w = window.innerWidth || document.documentElement.clientWidth || 375;
        const h = window.innerHeight || document.documentElement.clientHeight || 667;
        canvas.width = w;
        canvas.height = h;
      } catch {}
    };
    setSize();
    window.addEventListener('resize', setSize);

    // 简单的撒花动画
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const confettiPieces: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // 创建彩纸片
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    for (let i = 0; i < 100; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confettiPieces.forEach((piece, index) => {
        // 更新位置
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.1; // 重力
        piece.rotation += piece.rotationSpeed;

        // 绘制彩纸片
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation * Math.PI / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
        ctx.restore();

        // 移除超出屏幕的彩纸片
        if (piece.y > canvas.height + 50) {
          confettiPieces.splice(index, 1);
        }
      });

      // 继续动画
      if (confettiPieces.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    // 开始动画
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', setSize);
    };
  }, [confettiUrl]);

  // 当设置了 Lottie URL 时，按需加载 lottie-player 并显示一次动画
  useEffect(() => {
    if (!confettiUrl) return;
    let scriptEl: HTMLScriptElement | null = null;
    let containerEl: HTMLDivElement | null = null;
    try {
      // 注入 lottie-player 脚本（若未加载）
      if (!(window as any).lottiePlayerLoaded) {
        scriptEl = document.createElement('script');
        scriptEl.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
        scriptEl.async = true;
        scriptEl.onload = () => ((window as any).lottiePlayerLoaded = true);
        document.head.appendChild(scriptEl);
      }
      // 创建覆盖层容器
      containerEl = document.createElement('div');
      containerEl.style.position = 'fixed';
      containerEl.style.inset = '0';
      containerEl.style.pointerEvents = 'none';
      containerEl.style.zIndex = '10';
      containerEl.style.display = 'flex';
      containerEl.style.alignItems = 'center';
      containerEl.style.justifyContent = 'center';
      // 创建 lottie-player 元素
      const player = document.createElement('lottie-player');
      player.setAttribute('src', confettiUrl);
      player.setAttribute('autoplay', '');
      player.setAttribute('style', 'width:100%;height:100%;');
      // 播放完成后自动移除
      player.addEventListener('complete', () => {
        if (containerEl && containerEl.parentNode) {
          containerEl.parentNode.removeChild(containerEl);
        }
      });
      containerEl.appendChild(player as unknown as Node);
      document.body.appendChild(containerEl);
    } catch {}
    return () => {
      try {
        if (containerEl && containerEl.parentNode) {
          containerEl.parentNode.removeChild(containerEl);
        }
      } catch {}
      try {
        if (scriptEl && scriptEl.parentNode) {
          // 不强行移除脚本，避免重复加载；保留以供后续页面复用
        }
      } catch {}
    };
  }, [confettiUrl]);
  
  useEffect(() => {
    // 从localStorage获取成绩和配置
    const savedCorrectCount = localStorage.getItem('math-practice-correct');
    const savedWrongCount = localStorage.getItem('math-practice-wrong');
    const savedAnsweredQuestions = localStorage.getItem('math-practice-answered');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedQuestionType = localStorage.getItem('questionType');
    
    if (savedCorrectCount) {
      setCorrectCount(parseInt(savedCorrectCount));
    }
    if (savedWrongCount) {
      setWrongCount(parseInt(savedWrongCount));
    }
    if (savedAnsweredQuestions) {
      setAnsweredQuestions(parseInt(savedAnsweredQuestions));
    }
    if (savedQuestionCount) {
      setTotalQuestions(parseInt(savedQuestionCount));
    }
    if (savedTimeLimit) {
      setTimeUsed(parseInt(savedTimeLimit));
    } else {
      setTimeUsed(5); // 默认5秒
    }
    if (savedQuestionType) {
      const typeMap: Record<string, string> = {
        'borrow': '退位减法',
        'carry': '进位加法',
        'mixed': '加减混合',
        'multiply': '乘法',
        'divide': '除法',
        'multiply_divide': '乘除混合',
        'all_four': '四则混合',
        'fill_add_subtract': '加减法填空',
        'fill_multiply_divide': '乘除法填空'
      };
      setQuestionType(typeMap[savedQuestionType] || '退位减法');
    }

    // 保存localStorage原始数据用于调试
    setLocalStorageData({
      'questionType': localStorage.getItem('questionType'),
      'range': localStorage.getItem('range'),
      'questionCount': localStorage.getItem('questionCount'),
      'timeLimit': localStorage.getItem('timeLimit'),
      'math-practice-correct': localStorage.getItem('math-practice-correct'),
      'math-practice-wrong': localStorage.getItem('math-practice-wrong'),
      'math-practice-answered': localStorage.getItem('math-practice-answered'),
    });

    // 读取本轮每题用时并计算平均
    const timesRaw = localStorage.getItem('mp-times');
    if (timesRaw) {
      try {
        const arr: number[] = JSON.parse(timesRaw) || [];
        if (arr.length > 0) {
          const sum = arr.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
          const avg = sum / arr.length;
          setAvgTime(avg);
          setTotalTime(sum); // 设置总用时
          // 历史最佳对比（越小越好），改为从 mp-history 计算最小 avgTime
          try {
            const hRaw = localStorage.getItem('mp-history');
            const list: Array<{ avgTime: number; ts?: number; type?: string; timeLimit?: number }> = hRaw ? JSON.parse(hRaw) : [];
            const currentType = localStorage.getItem('questionType');
            // 只计算当前题型的历史最佳成绩
            const currentTypeRecords = list.filter(record => record.type === currentType);
            const minHistory = currentTypeRecords.length > 0 ? Math.min(...currentTypeRecords.map(x => x.avgTime)) : null;
            setBestAvgTime(minHistory);

            // 没有历史时，不显示“破纪录”，只展示本次速度
            if (minHistory == null) {
              setBrokeRecord(false);
              setImproveSeconds(0);
              setImprovePercent(0);
            } else if (Number.isFinite(avg) && avg < minHistory) {
              setBrokeRecord(true);
              const improveSec = Math.max(0, minHistory - avg);
              setImproveSeconds(improveSec);
              const improvePct = minHistory > 0 ? (improveSec / minHistory) * 100 : 0;
              setImprovePercent(improvePct);
            } else {
              setBrokeRecord(false);
              setImproveSeconds(0);
              setImprovePercent(0);
            }

            // 记录当前成绩到历史（确保线上首次访问也能建立历史）
            list.push({ avgTime: avg, ts: Date.now(), type: localStorage.getItem('questionType') || undefined, timeLimit: Number(localStorage.getItem('timeLimit') || 0) || undefined });
            localStorage.setItem('mp-history', JSON.stringify(list));

            // 同步 mp-best-avg 以兼容旧口径读取位置
            const newBest = list.length > 0 ? Math.min(...list.map(x => x.avgTime)) : avg;
            localStorage.setItem('mp-best-avg', String(newBest));
          } catch (e) {
            console.error("Error processing history:", e);
          }
        }
      } catch (e) {
        console.error("Error processing history:", e);
      }
    }
    // 调试读取移除
  }, []);

  // 结果页兜底：如果有上一轮结算结果，进入时再弹一次提示
  useEffect(() => {
    try {
      const exp = localStorage.getItem('mp-last-exp');
      const acc = localStorage.getItem('mp-last-accuracy');
      const tm = localStorage.getItem('mp-last-time');
      const detail = localStorage.getItem('mp-last-exp-details');
      if (detail) {
        try { setExpDetail(JSON.parse(detail)); } catch {}
      }
      if (exp) {
        const evt = new CustomEvent('mp-toast', { detail: { type: 'success', title: `+${exp} EXP`, message: `准确率 ${acc || '-'}%，用时 ${tm || '-'}s` } });
        window.dispatchEvent(evt);
        // 清理，避免重复
        localStorage.removeItem('mp-last-exp');
        localStorage.removeItem('mp-last-accuracy');
        localStorage.removeItem('mp-last-time');
        localStorage.removeItem('mp-last-exp-details');
      }
    } catch {}
  }, []);

  // 加载题目日志
  useEffect(() => {
    try {
      const logsData = localStorage.getItem('mp-question-logs');
      if (logsData) {
        const logs = JSON.parse(logsData);
        setQuestionLogs(logs);
      }
    } catch (error) {
      console.error('加载题目日志失败:', error);
    }
  }, []);

  // 排序题目日志
  const sortedQuestionLogs = [...questionLogs].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'question':
        aValue = a.displayText;
        bValue = b.displayText;
        break;
      case 'correct':
        aValue = a.isCorrect ? 1 : 0;
        bValue = b.isCorrect ? 1 : 0;
        break;
      case 'time':
        aValue = a.timeTaken;
        bValue = b.timeTaken;
        break;
      case 'operation':
        aValue = a.operation;
        bValue = b.operation;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const computedWrong = Math.max(0, totalQuestions - correctCount);
  
  const getPerformanceLevel = (acc: number) => {
    if (acc >= 90) return { level: '优秀', color: colors.status.success, emoji: '🏆' };
    if (acc >= 80) return { level: '良好', color: colors.status.info, emoji: '🥈' };
    if (acc >= 70) return { level: '及格', color: colors.status.warning, emoji: '🥉' };
    return { level: '需要练习', color: colors.status.error, emoji: '📚' };
  };
  
  const performance = getPerformanceLevel(accuracy);
  
  const getEncouragement = (acc: number) => {
    if (acc >= 90) return '🎉 太棒了！继续保持这个水平！';
    if (acc >= 80) return '👍 不错！再练习几次就能更好了！';
    if (acc >= 70) return '💪 加油！多练习就能提高！';
    return '📚 不要灰心，多练习退位减法，一定能进步的！';
  };
  
  useEffect(() => {
    // 进入结果页时延迟0.2s播放成功音效
    const t = setTimeout(() => {
      try { playSuccess(); } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, []);

  // 等级提升检测（使用服务，确保账号隔离）
  useEffect(() => {
    try {
      const gamification = GamificationService.getInstance();
      const profile = gamification.getUserProfile();
      const curr = getCurrentLevel(profile.exp);
      if (curr.level > (profile.level || 1)) {
        setShowLevelUp(true);
        setTimeout(() => setLevelUpAnimation(true), 100);
        gamification.saveUserProfile({ ...profile, level: curr.level });
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-start pt-8 p-2 sm:p-6">
              {/* 顶部右侧：按钮组 */}
              <div className="w-full max-w-6xl flex justify-between items-center mb-2">
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {questionType}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('go-history'))}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/70 hover:bg-white dark:bg-gray-800 transition shadow-sm"
                  >
                    历史记录
                  </button>
                </div>
              </div>
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">练习完成</h1>
      </div>
      
      {/* 主要内容区域 - 左右两组布局 */}
      {/* 等宽卡片容器，整体约80%宽 */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 mb-10 items-stretch justify-center" style={{ maxWidth: '80%' }}>
        {/* 左卡：正确率 */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg p-6 flex-1">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">正确率</div>
          <div className="flex flex-col items-center">
            <PieChart correct={correctCount} wrong={computedWrong} total={totalQuestions} />
            <div className="grid grid-cols-2 gap-8 mt-2 text-center">
              <div 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700 rounded-lg p-2 transition-colors"
                onClick={() => setShowQuestionAnalysis(true)}
                title="点击查看错题分析"
              >
                <div className={`text-3xl font-bold ${colors.status.success} mb-1`}>{correctCount}</div>
                <div className="text-gray-600 dark:text-gray-400">答对题数</div>
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700 rounded-lg p-2 transition-colors"
                onClick={() => setShowQuestionAnalysis(true)}
                title="点击查看错题分析"
              >
                <div className={`text-3xl font-bold ${colors.status.error} mb-1`}>{computedWrong}</div>
                <div className="text-gray-600 dark:text-gray-400">答错题数</div>
              </div>
            </div>
          </div>
          {/* 调试块移除 */}
        </div>

        {/* 右卡：答题速度 + 本轮总用时 */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg p-6 flex-1">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">答题速度</div>
          <div className="flex flex-col items-center">
            <SpeedChart currentSpeed={avgTime} bestSpeed={bestAvgTime} brokeRecord={brokeRecord} />
            <div className="w-full mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">{totalTime.toFixed(2)}s</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">本轮总用时</div>
                <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">答题数: {answeredQuestions}</div>
              </div>
            </div>
          {/* 经验结算（总计与明细） */}
          <div className="w-full mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">经验结算</div>
            {expDetail ? (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className={`text-base font-bold ${colors.status.success} mb-2`}>总计：+{expDetail.expGain?.total || 0} EXP</div>
                <div className="space-y-1">
                  {/* 明细展示 */}
                  {(() => {
                    const items: Array<{ label: string; value: number }> = [];
                    const d: any = expDetail.expGain?.details || {};
                    
                    // 准确率奖励
                    if (d.accuracy) {
                      items.push({ label: `准确率奖励（${expDetail.accuracy}%）`, value: d.accuracy });
                    }
                    
                    // 学习时长奖励
                    if (d.time) {
                      items.push({ label: `学习时长奖励（${(expDetail.totalTimeSec || 0).toFixed(0)}秒）`, value: d.time });
                    }
                    
                    // 题量奖励
                    if (d.questions) {
                      items.push({ label: `题量奖励（${expDetail.correct}/${expDetail.total}题）`, value: d.questions });
                    }
                    
                    return items.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{it.label}</span>
                            <span className={`font-semibold ${colors.status.success}`}>+{it.value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500">无明细可展示</div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">本轮未读取到结算明细</div>
            )}
          </div>
          
          {/* 等级进度条（使用服务读取，确保账号隔离） */}
          {(() => {
            const gamification = GamificationService.getInstance();
            const userProfile = gamification.getUserProfile();
            const currentLevel = getCurrentLevel(userProfile.exp);
            const nextLevel = getNextLevel(userProfile.exp);
            const expProgress = getExpProgress(userProfile.exp);
            
            return (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">等级进度</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    L{currentLevel.level} {currentLevel.name}
                  </div>
                </div>
                {nextLevel ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{userProfile.exp - currentLevel.expRequired} EXP</span>
                      <span>{nextLevel.expRequired - currentLevel.expRequired} EXP</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-2000 ease-out bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${expProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                      距离下一级还需 {nextLevel.expRequired - userProfile.exp} EXP
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-yellow-600 dark:text-yellow-400 font-semibold">
                    🏆 已达到最高等级！
                  </div>
                )}
              </div>
            );
          })()}
          </div>
        </div>
      </div>

      {/* 全屏覆盖的撒花 canvas，不占用布局 */}
      <canvas
        ref={confettiCanvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, width: '100%', height: '100%' }}
      />

      {/* 统计调试信息（默认隐藏，按需开启） */}
      {/* <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">📊 统计调试</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold ${colors.status.info} mb-1">
              {totalQuestions}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总题数 (设置)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {answeredQuestions}
            </div>
            <div className="text-gray-600 dark:text-gray-400">已答题数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold ${colors.status.success} mb-1">
              {correctCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">答对数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold ${colors.status.error} mb-1">
              {wrongCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">答错数量</div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-lg text-gray-700 dark:text-gray-300">
            <strong>未答数量:</strong> {totalQuestions - answeredQuestions}
          </div>
          <div className="text-lg text-gray-700 dark:text-gray-300">
            <strong>正确率计算:</strong> (答对数量 / 总题数) × 100% = ({correctCount} / {totalQuestions}) × 100% = {accuracy}%
          </div>
        </div>

        <div className="text-center mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>数据验证:</strong> 答对 ({correctCount}) + 答错 ({wrongCount}) = 已答 ({correctCount + wrongCount})
          </div>
          <div className={`text-sm font-bold ${correctCount + wrongCount === answeredQuestions ? '${colors.status.success}' : '${colors.status.error}'}`}>
            验证结果: {correctCount + wrongCount === answeredQuestions ? '✅ 匹配' : '❌ 不匹配'}
          </div>
        </div>

        <details className="text-center">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-300">
            查看 localStorage 原始数据
          </summary>
          <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto text-left">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </details>
      </div> */}
      
              {/* 操作按钮 */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    onRestart();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 px-10 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  再来一局
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('go-home'))}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xl font-bold py-4 px-10 rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  回首页
                </button>
              </div>

              {/* 题目分析浮层 */}
              {showQuestionAnalysis && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[80vh] overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">题目分析</h2>
                      <button
                        onClick={() => setShowQuestionAnalysis(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-6 overflow-auto max-h-[60vh]">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <th 
                              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                              onClick={() => handleSort('question')}
                            >
                              题目 {sortField === 'question' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                              onClick={() => handleSort('correct')}
                            >
                              对错 {sortField === 'correct' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                              onClick={() => handleSort('time')}
                            >
                              用时(秒) {sortField === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedQuestionLogs.map((log, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                                {log.isCorrect ? (
                                  <span>
                                    <span className="text-gray-800 dark:text-gray-200">{log.displayText.replace('?', '')}</span>
                                    <span className={`${colors.status.success} font-semibold`}>{log.correctAnswer}</span>
                                  </span>
                                ) : (
                                  <span>
                                    <span className="text-gray-800 dark:text-gray-200">{log.displayText.replace('?', '')}</span>
                                    <span className={`${colors.status.success} font-semibold`}>{log.correctAnswer}</span>
                                    <span className={`${colors.status.error}`}> （{log.userAnswer}）</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.isCorrect 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {log.isCorrect ? '✓' : '✗'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.timeTaken.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

      {/* 等级提升弹窗 */}
      {showLevelUp && (() => {
        const userProfile = JSON.parse(localStorage.getItem('mp-user-profile') || '{"exp": 0}');
        const currentLevel = getCurrentLevel(userProfile.exp);
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all duration-500 ${
              levelUpAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                等级提升！
              </h2>
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                恭喜你升级到 <span className="font-bold text-blue-600 dark:text-blue-400">L{currentLevel.level} {currentLevel.name}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                继续努力，向更高等级前进！
              </div>
              <button 
                onClick={() => {
                  setShowLevelUp(false);
                  setLevelUpAnimation(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                太棒了！
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

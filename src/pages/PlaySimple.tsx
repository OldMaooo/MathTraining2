import { useState, useEffect, useRef } from 'react';
import { GamificationService } from '../services/gamificationService';
import { AccountService } from '../services/accountService';
import { CloudStore } from '../services/cloudStore';
import { ToastManager } from '../components/Toast';
import { colors } from '../styles/colors';

  // 动态加载Lottie
const loadLottie = async () => {
  try {
    // 加载Lottie player
    if (!(window as any).lottie) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    
    // 加载DotLottie
    if (!(window as any).DotLottie) {
      try {
        // const { DotLottie } = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm');
        // (window as any).DotLottie = DotLottie;
      } catch (importError) {
        console.warn('Failed to load DotLottie:', importError);
      }
    }
  } catch (error) {
    console.warn('Failed to load Lottie:', error as Error);
  }
};

interface PlaySimpleQuestion {
  a: number;
  b: number;
  operation: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  displayText: string;
  isFillBlank?: boolean; // 是否为填空题
  blankPosition?: 'a' | 'b' | 'result'; // 空白位置
}

interface PlaySimpleProps {
  onFinish: () => void;
  onExit: () => void;
}

// 退位减法题目生成函数（保证加/减项都在范围内，且必须发生退位）
const generateBorrowSubtraction = (range: number): PlaySimpleQuestion => {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 200; i++) {
    a = Math.max(1, Math.floor(Math.random() * range) + 1);
    b = Math.max(1, Math.floor(Math.random() * range) + 1);
    if (a >= b && (a % 10) < (b % 10)) break; // 需要借位
  }
  if (!(a >= b && (a % 10) < (b % 10))) {
    // 兜底：构造一个一定借位的数对
    const low = Math.min(9, Math.max(1, range - 1));
    const high = Math.min(range, low + 10);
    b = Math.max(1, Math.min(range, low));
    a = Math.max(b, Math.min(range, high));
    if (!((a % 10) < (b % 10))) {
      // 强制让个位满足借位条件
      const aOnes = (a % 10);
      const targetBOnes = Math.min(9, aOnes + 1);
      b = Math.max(1, Math.min(range, Math.floor(b / 10) * 10 + targetBOnes));
      if (b > a) a = b + 1 <= range ? b + 1 : b; // 再兜底
    }
  }
  return { a, b, operation: '-', correctAnswer: a - b, displayText: `${a} - ${b} =` };
};

// 进位加法题目生成函数（保证加/减项都在范围内，且必须发生进位）
const generateCarryAddition = (range: number): PlaySimpleQuestion => {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 200; i++) {
    a = Math.max(1, Math.floor(Math.random() * range) + 1);
    b = Math.max(1, Math.floor(Math.random() * range) + 1);
    if (((a % 10) + (b % 10)) >= 10) break; // 需要进位
  }
  if (!(((a % 10) + (b % 10)) >= 10)) {
    // 兜底：构造一个一定进位的数对
    const aOnes = Math.min(9, Math.max(0, (Math.floor(Math.random() * 10))));
    const bOnes = 10 - aOnes;
    a = Math.max(1, Math.min(range, aOnes + 10 * Math.floor(Math.random() * Math.max(1, Math.floor(range / 10)))));
    b = Math.max(1, Math.min(range, bOnes + 10 * Math.floor(Math.random() * Math.max(1, Math.floor(range / 10)))));
    if (((a % 10) + (b % 10)) < 10) {
      const adjust = 10 - ((a % 10) + (b % 10));
      b = Math.min(range, b + adjust);
    }
  }
  return { a, b, operation: '+', correctAnswer: a + b, displayText: `${a} + ${b} =` };
};

// 题型名称映射
const getQuestionTypeName = (type: string): string => {
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
  return typeMap[type] || '未知题型';
};

export const PlaySimple: React.FC<PlaySimpleProps> = ({ onFinish, onExit }) => {
  // 音效
  const sfxBase = (import.meta as any).env?.BASE_URL || '/';
  const sfxCorrectRef = useRef<HTMLAudioElement | null>(null);
  const sfxWrongRef = useRef<HTMLAudioElement | null>(null);
  const sfxStartRef = useRef<HTMLAudioElement | null>(null);
  // 预热音频和加载Lottie（iOS需要用户交互后才能播放，所以仅创建并load）
  useEffect(() => {
    try {
      sfxCorrectRef.current = new Audio(resolveSfxUrl('correct'));
      sfxWrongRef.current = new Audio(resolveSfxUrl('wrong'));
      sfxStartRef.current = new Audio(resolveSfxUrl('start'));
      sfxCorrectRef.current.load();
      sfxWrongRef.current.load();
      sfxStartRef.current.load();
    } catch {}
    
    // 动态加载Lottie
    loadLottie();
  }, []);
  // 解析音效URL：优先使用存在的特定格式映射，其次按常见扩展名回退
  const resolveSfxUrl = (name: 'correct'|'wrong'|'start'|'success') => {
    // 已知你当前放置的文件：correct.wav / wrong.wav / start.wav / success.mp3
    const known: Record<string, string> = {
      correct: `${sfxBase}sfx/correct.wav`,
      wrong: `${sfxBase}sfx/wrong.wav`,
      start: `${sfxBase}sfx/start.wav`,
      success: `${sfxBase}sfx/success.mp3`,
    };
    if (known[name]) return known[name];
    const exts = ['mp3','wav','m4a','ogg'];
    return `${sfxBase}sfx/${name}.${exts[0]}`;
  };
  const ensureSfx = () => {
    if (!sfxCorrectRef.current) sfxCorrectRef.current = new Audio(resolveSfxUrl('correct'));
    if (!sfxWrongRef.current) sfxWrongRef.current = new Audio(resolveSfxUrl('wrong'));
    if (!sfxStartRef.current) sfxStartRef.current = new Audio(resolveSfxUrl('start'));
  };
  const playSfx = (type: 'correct' | 'wrong' | 'start') => {
    try {
      ensureSfx();
      const map = {
        correct: sfxCorrectRef.current!,
        wrong: sfxWrongRef.current!,
        start: sfxStartRef.current!,
      } as const;
      map[type].currentTime = 0;
      map[type].play().catch(() => {});
    } catch {}
  };
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [questions, setQuestions] = useState<PlaySimpleQuestion[]>([]);
  const [showFeedback, setShowFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [expDebug, setExpDebug] = useState<any>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastStartTime, setLastStartTime] = useState<number>(() => Date.now());
  const [perQuestionTimes, setPerQuestionTimes] = useState<number[]>([]);
  const [questionType, setQuestionType] = useState('退位减法');
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null); // 暂停开始时间
  const [totalPauseTime, setTotalPauseTime] = useState(0); // 总暂停时间
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => Date.now()); // 会话开始时间
  const [displayTime, setDisplayTime] = useState(Date.now()); // 用于强制更新显示
  const [showReadyAnimation, setShowReadyAnimation] = useState(true);
  const [showGoAnimation, setShowGoAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Array<{
    timestamp: string;
    action: string;
    data: any;
  }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [burstInProgress, setBurstInProgress] = useState(false);
  const [burstTarget, setBurstTarget] = useState(0);
  const [burstCompleted, setBurstCompleted] = useState(0);
  const [autoAnswerSettings, setAutoAnswerSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('mp-admin-auto');
      if (raw) {
        const obj = JSON.parse(raw);
        const acc = Math.min(100, Math.max(0, parseInt(String(obj.accuracy ?? 80)) || 80));
        const cnt = Math.max(1, parseInt(String(obj.autoCount ?? 5)) || 5);
        return { enabled: false, accuracy: acc, autoCount: cnt };
      }
    } catch {}
    return { enabled: false, accuracy: 80, autoCount: 5 };
  });
  const autoAnswerTimerRef = useRef<number | null>(null);
  // 管理条数字输入的影子值，允许用户清空再输入
  const [shadowAutoCount, setShadowAutoCount] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('mp-admin-auto');
      if (raw) {
        const obj = JSON.parse(raw);
        const cnt = Math.max(1, parseInt(String(obj.autoCount ?? 5)) || 5);
        return String(cnt);
      }
    } catch {}
    return '5';
  });
  const [autoAnsweredCount, setAutoAnsweredCount] = useState(0);
  const [randomBonusIndex, setRandomBonusIndex] = useState<number | null>(null);
  const [debugStatus, setDebugStatus] = useState('空闲');
  const [isSubmittingHistory, setIsSubmittingHistory] = useState<Array<{timestamp: string, status: string}>>([]);

  // 检查当前账号是否为admin
  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        const accountService = AccountService.getInstance();
        const currentAccount = accountService.getCurrentAccount();
        setIsAdmin(currentAccount?.type === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    
    // 监听账号切换事件
    const handleAccountChange = () => {
      checkAdminStatus();
    };
    
    window.addEventListener('mp-account-changed', handleAccountChange);
    return () => window.removeEventListener('mp-account-changed', handleAccountChange);
  }, []);

  // 游戏化与提示
  const gamification = GamificationService.getInstance();
  const toast = ToastManager.getInstance();

  // 引用型状态，防竞态读取
  const currentQuestionRef = useRef(0);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  const isSubmittingRef = useRef(false);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  const answeredQuestionsRef = useRef(0);
  useEffect(() => { answeredQuestionsRef.current = answeredQuestions; }, [answeredQuestions]);
  const burstStartAnsweredRef = useRef(0);
  const burstStartQuestionRef = useRef(0);

  // 统一的设置持久化/读取工具，避免 NaN 导致的 0%
  const clampInt = (n: any, min: number, max: number, fallback: number) => {
    const v = typeof n === 'number' ? n : parseInt(String(n || ''));
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, v));
  };
  const persistAutoSettings = (next?: Partial<{ accuracy: number; autoCount: number }>) => {
    try {
      const savedRaw = localStorage.getItem('mp-admin-auto');
      const saved = savedRaw ? JSON.parse(savedRaw) : {};
      const acc = clampInt(
        next?.accuracy ?? saved.accuracy ?? autoAnswerSettings.accuracy,
        0, 100, autoAnswerSettings.accuracy
      );
      const count = clampInt(
        next?.autoCount ?? saved.autoCount ?? autoAnswerSettings.autoCount,
        1, Math.max(1, questions.length || 9999), autoAnswerSettings.autoCount
      );
      const toSave = JSON.stringify({ accuracy: acc, autoCount: count });
      localStorage.setItem('mp-admin-auto', toSave);
      // 同步到状态/影子值
      setAutoAnswerSettings(prev => ({ ...prev, accuracy: acc, autoCount: count }));
      setShadowAutoCount(String(count));
    } catch {}
  };

  // 载入并保存一键设置
  useEffect(() => {
    // 首次装载：从本地读取并校验
    persistAutoSettings();
  }, []);
  useEffect(() => {
    // 设置变更：统一持久化
    persistAutoSettings({
      accuracy: autoAnswerSettings.accuracy,
      autoCount: autoAnswerSettings.autoCount
    });
  }, [autoAnswerSettings.accuracy, autoAnswerSettings.autoCount, questions.length]);

  const finalizeGamification = (finalCorrect: number, finalTotal: number, times: number[]) => {
    try {
      const accuracy = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;
      const totalTimeSec = times.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);
      const expGain = gamification.calculateExpGain(accuracy, totalTimeSec * 1000, finalCorrect);
      gamification.addExp(expGain.total);
      gamification.updateStreak();
      gamification.updateDailyTasks('daily_login', 1);
      gamification.updateDailyTasks('study_time', Math.round(totalTimeSec / 60));
      gamification.updateDailyTasks('correct_answers', finalCorrect);
      // 写入每日统计（账号隔离）
      try {
        const stats = gamification.getDailyStats();
        const updated = {
          ...stats,
          questionsAnswered: (stats.questionsAnswered || 0) + finalTotal,
          correctAnswers: (stats.correctAnswers || 0) + finalCorrect,
          totalTime: (stats.totalTime || 0) + totalTimeSec * 1000,
          expGained: (stats.expGained || 0) + (expGain.total || 0)
        };
        gamification.saveDailyStats(updated);
      } catch {}
      // 写入本次结算结果，供结果页兜底展示提示
      try {
        localStorage.setItem('mp-last-exp', String(expGain.total));
        localStorage.setItem('mp-last-accuracy', String(accuracy));
        localStorage.setItem('mp-last-time', totalTimeSec.toFixed(2));
        localStorage.setItem('mp-last-exp-details', JSON.stringify({
          accuracy,
          totalTimeSec,
          correct: finalCorrect,
          total: finalTotal,
          expGain
        }));
        localStorage.setItem('mp-exp-awarded', '1');
        const logRaw = localStorage.getItem('mp-debug-log');
        const logArr = logRaw ? JSON.parse(logRaw) : [];
        logArr.push({ ts: Date.now(), tag: 'finalizeGamification', accuracy, totalTimeSec, finalCorrect, finalTotal, expGain });
        localStorage.setItem('mp-debug-log', JSON.stringify(logArr).slice(0, 50000));
        setExpDebug({ accuracy, totalTimeSec, finalCorrect, finalTotal, expGain });
      } catch {}
      // 延时触发，避免与页面切换竞态
      setTimeout(() => {
        try {
          toast.show({ type: 'success', title: `+${expGain.total} EXP`, message: `准确率 ${accuracy}%，用时 ${totalTimeSec.toFixed(2)}s` });
        } catch {}
      }, 150);
    } catch {}
  };
  
  // 调试函数
  const addDebugInfo = (action: string, data: any) => {
    try {
      const timestamp = new Date().toLocaleTimeString() + '.' + Date.now().toString().slice(-3);
      setDebugInfo(prev => [...prev.slice(-9), { timestamp, action, data }]);
      console.log(`[${timestamp}] ${action}:`, data);
    } catch (error) {
      console.error('addDebugInfo error:', error as Error);
      console.log(`[DEBUG ERROR] ${action}:`, data);
    }
  };

  // 实时更新显示时间
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime(Date.now());
    }, 100); // 每100ms更新一次
    return () => clearInterval(interval);
  }, []);

  // 取消旧的 localStorage 开关依赖，统一以当前账号类型判定 admin（见上方 useEffect）

  // 更新调试状态
  useEffect(() => {
    if (isSubmitting) {
      setDebugStatus('提交中');
      setIsSubmittingHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        status: '提交中'
      }]);
          } else {
      setDebugStatus('空闲');
    }
  }, [isSubmitting]);

  // 开场动画逻辑
  useEffect(() => {
    if (showReadyAnimation) {
      // READY 开始即暂停
      setIsPaused(true);
      setPauseStartTime(Date.now());
      playSfx('start');
      const timer = setTimeout(() => {
        setShowReadyAnimation(false);
        setShowGoAnimation(true);
      }, 1000); // 停留1秒
      return () => clearTimeout(timer);
    }
  }, [showReadyAnimation]);

  useEffect(() => {
    if (showGoAnimation) {
      const timer = setTimeout(() => {
        setShowGoAnimation(false);
        // READY/GO结束后确保恢复计时
        if (pauseStartTime) {
          setTotalPauseTime(prev => prev + (Date.now() - pauseStartTime));
          setPauseStartTime(null);
        }
        setIsPaused(false);
      }, 1000); // 停留1秒
      return () => clearTimeout(timer);
    }
  }, [showGoAnimation]);
  
  // 暂停计时器：计算总暂停时间
  const getTotalPauseTime = () => {
    const currentPauseTime = pauseStartTime ? (Date.now() - pauseStartTime) : 0;
    const total = totalPauseTime + currentPauseTime;
    console.log('getTotalPauseTime计算:', {
      totalPauseTime: (totalPauseTime / 1000).toFixed(3),
      currentPauseTime: (currentPauseTime / 1000).toFixed(3),
      pauseStartTime,
      now: Date.now(),
      total: (total / 1000).toFixed(3)
    });
    return total;
  };
  
  // 获取当前题目的实际答题时间
  const getCurrentQuestionTime = () => {
    const now = Date.now();
    const totalTime = now - lastStartTime;
    const pauseTime = getTotalPauseTime();
    return Math.max(0, totalTime - pauseTime);
  };
  
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
  
  // 从localStorage加载配置并生成题目（支持自定义题集）
  useEffect(() => {
    const questionType = localStorage.getItem('questionType') || 'borrow';
    const range = parseInt(localStorage.getItem('range') || '20');
    const timePerQuestion = parseInt(localStorage.getItem('timeLimit') || '5');
    const useWrongSet = localStorage.getItem('mp-start-with-wrong-set') === '1';
    let questionCount = parseInt(localStorage.getItem('questionCount') || '10');
    
    // 设置题型名称
    setQuestionType(getQuestionTypeName(questionType));
    
    // 计算总时间
    const totalTime = timePerQuestion * questionCount;
    setTimeLeft(totalTime);
    // 保存本次练习的总题数，并重置统计
    localStorage.setItem('questionCount', questionCount.toString());
    localStorage.setItem('math-practice-correct', '0');
    localStorage.setItem('math-practice-wrong', '0');
    localStorage.setItem('math-practice-answered', '0');
    localStorage.setItem('mp-times', JSON.stringify([]));

  // 生成题目
    const newQuestions: PlaySimpleQuestion[] = [];
    
    if (useWrongSet) {
      try {
        const raw = localStorage.getItem('mp-latest-wrong-set');
        const arr: Array<{ a: number; b: number; operation: '+' | '-' | '×' | '÷' }> = raw ? JSON.parse(raw) : [];
        const limited = Array.isArray(arr) ? arr : [];
        questionCount = limited.length || questionCount;
        for (let i = 0; i < limited.length; i++) {
          const it = limited[i];
          let correct: number;
          if (it.operation === '+') {
            correct = it.a + it.b;
          } else if (it.operation === '-') {
            correct = it.a - it.b;
          } else if (it.operation === '×') {
            correct = it.a * it.b;
          } else if (it.operation === '÷') {
            correct = it.a / it.b;
          } else {
            correct = 0;
          }
          newQuestions.push({ 
            a: it.a, 
            b: it.b, 
            operation: it.operation, 
            correctAnswer: correct, 
            displayText: `${it.a} ${it.operation} ${it.b} =` 
          });
        }
      } catch {
        // 解析失败则退回普通生成
      }
      // 用完即关，不影响下一轮
      localStorage.removeItem('mp-start-with-wrong-set');
    }
    
    if (newQuestions.length === 0) {
      // 使用简化的题目生成逻辑
    for (let i = 0; i < questionCount; i++) {
      let question: PlaySimpleQuestion;
        if (questionType === 'borrow') {
          question = generateBorrowSubtraction(range);
        } else if (questionType === 'carry') {
        question = generateCarryAddition(range);
        } else if (questionType === 'multiply') {
          // 九九乘法表范围（2-9）
          const a = Math.floor(Math.random() * 8) + 2; // 2-9
          const b = Math.floor(Math.random() * 8) + 2; // 2-9
          question = { a, b, operation: '×', correctAnswer: a * b, displayText: `${a} × ${b} =` };
        } else if (questionType === 'divide') {
          // 九九乘法表范围（2-9）
          const a = Math.floor(Math.random() * 8) + 2; // 2-9
          const b = Math.floor(Math.random() * 8) + 2; // 2-9
          const product = a * b;
          question = { a: product, b, operation: '÷', correctAnswer: a, displayText: `${product} ÷ ${b} =` };
        } else if (questionType === 'multiply_divide') {
          // 乘除混合（两次运算的复合题目）- 确保能除得尽
          const a = Math.floor(Math.random() * 8) + 2; // 2-9
          const b = Math.floor(Math.random() * 8) + 2; // 2-9
          const firstResult = a * b;
          // 从firstResult的因数中选择除数，确保能除得尽
          const factors = [];
          for (let i = 2; i <= Math.min(9, firstResult); i++) {
            if (firstResult % i === 0) {
              factors.push(i);
            }
          }
          const c = factors[Math.floor(Math.random() * factors.length)];
          const finalResult = firstResult / c;
          question = { 
            a: firstResult, 
            b: c, 
            operation: '÷', 
            correctAnswer: finalResult, 
            displayText: `${a} × ${b} ÷ ${c} =` 
          };
        } else if (questionType === 'all_four') {
          // 四则混合（两次运算的复合题目）
          const operations = [
            () => {
              // 除法 + 加法
              const a = Math.floor(Math.random() * 8) + 2;
              const b = Math.floor(Math.random() * 8) + 2;
              const c = Math.floor(Math.random() * 20) + 1;
              const firstResult = a * b;
              const finalResult = firstResult / a + c;
    return {
                a: firstResult, 
                b: a, 
                operation: '÷' as const, 
                correctAnswer: finalResult, 
                displayText: `${firstResult} ÷ ${a} + ${c} =` 
              };
            },
            () => {
              // 乘法 + 减法
              const a = Math.floor(Math.random() * 8) + 2;
              const b = Math.floor(Math.random() * 8) + 2;
              const c = Math.floor(Math.random() * 20) + 1;
              const firstResult = a * b;
              const finalResult = firstResult - c;
              return { 
                a: firstResult, 
                b: c, 
                operation: '-' as const, 
                correctAnswer: finalResult, 
                displayText: `${a} × ${b} - ${c} =` 
              };
            }
          ];
          const operation = operations[i % operations.length];
          question = operation();
        } else if (questionType === 'fill_add_subtract') {
          // 加减法填空（限制和不超过两位数）
          const isAdd = Math.random() < 0.5;
          if (isAdd) {
            // 加法填空
            const a = Math.floor(Math.random() * Math.min(50, range)) + 1;
            const b = Math.floor(Math.random() * Math.min(50, range)) + 1;
            const result = a + b;
            if (result <= 99) { // 确保和不超过两位数
              const blankPos = Math.random() < 0.5 ? 'a' : 'b';
              if (blankPos === 'a') {
                question = { 
                  a: b, 
                  b: result, 
      operation: '+',
                  correctAnswer: a, 
                  displayText: `? + ${b} = ${result}`,
                  isFillBlank: true,
                  blankPosition: 'a'
                };
              } else {
                question = { 
                  a: a, 
                  b: result, 
                  operation: '+', 
                  correctAnswer: b, 
                  displayText: `${a} + ? = ${result}`,
                  isFillBlank: true,
                  blankPosition: 'b'
                };
              }
            } else {
              // 如果和超过两位数，重新生成
              i--;
              continue;
            }
          } else {
            // 减法填空
            const a = Math.floor(Math.random() * Math.min(50, range)) + 20; // 确保被减数足够大
            const b = Math.floor(Math.random() * Math.min(30, a - 1)) + 1;
            const result = a - b;
            const blankPos = Math.random() < 0.5 ? 'a' : 'b';
            if (blankPos === 'a') {
              question = { 
                a: b, 
                b: result, 
      operation: '-',
                correctAnswer: a, 
                displayText: `? - ${b} = ${result}`,
                isFillBlank: true,
                blankPosition: 'a'
              };
            } else {
              question = { 
                a: a, 
                b: result, 
                operation: '-', 
                correctAnswer: b, 
                displayText: `${a} - ? = ${result}`,
                isFillBlank: true,
                blankPosition: 'b'
              };
            }
          }
        } else if (questionType === 'fill_multiply_divide') {
          // 乘除法填空
          const isMultiply = Math.random() < 0.5;
          if (isMultiply) {
            // 乘法填空
            const a = Math.floor(Math.random() * 8) + 2; // 2-9
            const b = Math.floor(Math.random() * 8) + 2; // 2-9
            const result = a * b;
            const blankPos = Math.random() < 0.5 ? 'a' : 'b';
            if (blankPos === 'a') {
              question = { 
                a: b, 
                b: result, 
      operation: '×',
                correctAnswer: a, 
                displayText: `? × ${b} = ${result}`,
                isFillBlank: true,
                blankPosition: 'a'
              };
            } else {
              question = { 
                a: a, 
                b: result, 
                operation: '×', 
                correctAnswer: b, 
                displayText: `${a} × ? = ${result}`,
                isFillBlank: true,
                blankPosition: 'b'
              };
            }
          } else {
            // 除法填空
            const divisor = Math.floor(Math.random() * 8) + 2; // 2-9
            const quotient = Math.floor(Math.random() * 8) + 2; // 2-9
            const dividend = divisor * quotient;
            const blankPos = Math.random() < 0.5 ? 'a' : 'b';
            if (blankPos === 'a') {
              question = { 
                a: quotient, // 商
                b: divisor, // 除数
      operation: '÷',
                correctAnswer: dividend, // 被除数
                displayText: `? ÷ ${divisor} = ${quotient}`,
                isFillBlank: true,
                blankPosition: 'a'
              };
            } else {
              question = { 
                a: dividend, // 被除数
                b: quotient, // 商
                operation: '÷', 
                correctAnswer: divisor, // 除数
                displayText: `${dividend} ÷ ? = ${quotient}`,
                isFillBlank: true,
                blankPosition: 'b'
              };
            }
          }
        } else if (questionType === 'mixed') {
          // 加减混合（两步运算：连加、连减、加后减、减后加）
          const operations = [
            () => {
              // 连加：a + b + c
              const a = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const b = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const c = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const firstResult = a + b;
              const finalResult = firstResult + c;
              return { 
                a: firstResult, 
                b: c, 
                operation: '+' as const, 
                correctAnswer: finalResult, 
                displayText: `${a} + ${b} + ${c} =` 
              };
            },
            () => {
              // 连减：a - b - c
              const a = Math.floor(Math.random() * Math.min(40, range * 2)) + 20;
              const b = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const c = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const firstResult = a - b;
              const finalResult = firstResult - c;
              return { 
                a: firstResult, 
                b: c, 
                operation: '-' as const, 
                correctAnswer: finalResult, 
                displayText: `${a} - ${b} - ${c} =` 
              };
            },
            () => {
              // 加后减：(a + b) - c
              const a = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const b = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const c = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const firstResult = a + b;
              const finalResult = firstResult - c;
              return { 
                a: firstResult, 
                b: c, 
                operation: '-' as const, 
                correctAnswer: finalResult, 
                displayText: `${a} + ${b} - ${c} =` 
              };
            },
            () => {
              // 减后加：(a - b) + c
              const a = Math.floor(Math.random() * Math.min(40, range * 2)) + 20;
              const b = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const c = Math.floor(Math.random() * Math.min(20, range)) + 1;
              const firstResult = a - b;
              const finalResult = firstResult + c;
              return { 
                a: firstResult, 
                b: c, 
                operation: '+' as const, 
                correctAnswer: finalResult, 
                displayText: `${a} - ${b} + ${c} =` 
              };
            }
          ];
          const operation = operations[i % operations.length];
          question = operation();
        } else {
          // 默认混合模式（加减）
          if (i % 2 === 0) {
        question = generateBorrowSubtraction(range);
      } else {
            question = generateCarryAddition(range);
      }
        }
      newQuestions.push(question);
      }
    }
    
            // 随机奖励：每日可触发2次，且仅在第3~第6轮内、每轮最多一次
            try {
              const today = new Date().toISOString().split('T')[0];
              const roundKey = `mp-round-index_${today}`;
              const roundIndex = parseInt(localStorage.getItem(roundKey) || '0') + 1; // 从1开始计数
              localStorage.setItem(roundKey, String(roundIndex));
              const bonusData = gamification.getRandomBonusData();
              const canAppear = bonusData.used < bonusData.maxPerDay && roundIndex >= 3 && roundIndex <= 6;
              if (canAppear && newQuestions.length > 0) {
                const idx = Math.floor(Math.random() * newQuestions.length);
                setRandomBonusIndex(idx);
          } else {
                setRandomBonusIndex(null);
              }
            } catch {}

            setQuestions(newQuestions);
            const now = Date.now();
            setLastStartTime(now);
            setSessionStartTime(now);
            setPerQuestionTimes([]);
            setTotalPauseTime(0);
            setPauseStartTime(null);
            setAutoAnsweredCount(0);
  }, []);

  // 自动答题逻辑（管理员一键做题）
  useEffect(() => {
    if (!autoAnswerSettings.enabled || !isAdmin || questions.length === 0 || burstInProgress) return;
    if (autoAnsweredCount >= autoAnswerSettings.autoCount) return;
    if (currentQuestion >= questions.length) return;
    if (isSubmitting) return;

    const currentQ = questions[currentQuestion];
    if (!currentQ) return;

    // 0.6-1.2秒的更快自动答题节奏
    const delay = 600 + Math.random() * 600;
    const timer = window.setTimeout(() => {
      const shouldAnswerCorrectly = Math.random() * 100 < autoAnswerSettings.accuracy;
      const answer = shouldAnswerCorrectly ? currentQ.correctAnswer : currentQ.correctAnswer + (Math.random() > 0.5 ? 1 : -1);
      setUserAnswer(answer.toString());
      setAutoAnsweredCount(prev => prev + 1);
      window.setTimeout(() => handleSubmit(), 200);
    }, delay);
    autoAnswerTimerRef.current = timer;

    return () => {
      if (autoAnswerTimerRef.current) {
        clearTimeout(autoAnswerTimerRef.current);
        autoAnswerTimerRef.current = null;
      }
    };
  }, [currentQuestion, autoAnswerSettings, isAdmin, questions, autoAnsweredCount, isSubmitting, burstInProgress]);

  // 一口气做完（顺序做满设定题数或至本轮结束）
  const startBurstAutoAnswer = async () => {
    if (!isAdmin || questions.length === 0 || burstInProgress) return;
    const target = Math.min(questions.length - currentQuestion, Math.max(1, autoAnswerSettings.autoCount));
    setBurstTarget(target);
    setBurstCompleted(0);
    setBurstInProgress(true);
    // 记录突发开始时的真实统计，用于显示差值，防止视觉漂移
    burstStartAnsweredRef.current = answeredQuestionsRef.current;
    burstStartQuestionRef.current = currentQuestionRef.current;
    for (let i = 0; i < target; i++) {
      if (currentQuestionRef.current >= questions.length) break;
      let guard = 0;
      while (isSubmittingRef.current && guard++ < 50) await new Promise(r => setTimeout(r, 10));
      const indexBefore = currentQuestionRef.current;
      const q = questions[indexBefore];
      if (!q) break;
      const shouldCorrect = Math.random() * 100 < autoAnswerSettings.accuracy;
      const answer = shouldCorrect ? q.correctAnswer : q.correctAnswer + (Math.random() > 0.5 ? 1 : -1);
      setUserAnswer(String(answer));
      await new Promise(r => setTimeout(r, 10));
      handleSubmit();
      // 等待 currentQuestion 变化或到达末尾，避免越界 21/20
      const start = Date.now();
      while (Date.now() - start < 1200) {
        if (currentQuestionRef.current > indexBefore || currentQuestionRef.current >= questions.length) break;
        await new Promise(r => setTimeout(r, 10));
      }
      if (currentQuestionRef.current > indexBefore || currentQuestionRef.current >= questions.length) {
        setBurstCompleted(prev => prev + 1);
        setAutoAnsweredCount(prev => prev + 1);
      } else {
        // 未推进，结束突发，避免假计数
        break;
      }
      if (currentQuestionRef.current >= questions.length) break;
    }
    setBurstInProgress(false);
  };

  // 批量结算：按准确率一次性完成 N 道题，直接推进题号并写日志
  const runBatchAutoAnswer = () => {
    if (!isAdmin || questions.length === 0) return;
    const remaining = questions.length - currentQuestionRef.current;
    const target = Math.min(remaining, Math.max(1, autoAnswerSettings.autoCount));
    if (target <= 0) return;

    const effectiveAccuracy = clampInt(autoAnswerSettings.accuracy, 0, 100, 80);
    const shouldCorrectCount = Math.round(target * effectiveAccuracy / 100);
    const shouldWrongCount = target - shouldCorrectCount;
    const singleQuestionTime = parseInt(localStorage.getItem('timeLimit') || '5');

    const logs: typeof questionLogs = [];
    let correct = 0;
    let wrong = 0;
    const times: number[] = [];

    for (let i = 0; i < target; i++) {
      const q = questions[currentQuestionRef.current + i];
      if (!q) break;
      const isCorrect = i < shouldCorrectCount;
      correct += isCorrect ? 1 : 0;
      wrong += isCorrect ? 0 : 1;
      const timeTaken = Math.max(0.2, Math.min(2, singleQuestionTime * 0.3));
      times.push(timeTaken);
      logs.push({
        a: q.a,
        b: q.b,
        operation: q.operation,
        correctAnswer: q.correctAnswer,
        userAnswer: isCorrect ? q.correctAnswer : q.correctAnswer + (Math.random() > 0.5 ? 1 : -1),
        isCorrect,
        timeTaken,
        displayText: q.displayText,
        isFillBlank: q.isFillBlank,
        blankPosition: q.blankPosition,
      });
    }

    // 写入错题集与惩罚
    if (wrong > 0) {
      setTimeLeft(prev => Math.max(0, prev - wrong * singleQuestionTime));
      try {
        const existingWrong = localStorage.getItem('mp-wrong-questions');
        const arr = existingWrong ? JSON.parse(existingWrong) : [];
        logs.forEach((lg, idx) => {
          if (!lg.isCorrect) {
            arr.push({
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              ...lg,
              createdAt: Date.now(),
              questionType: localStorage.getItem('questionType') || 'unknown',
              isTestMode: localStorage.getItem('isTestMode') === 'true'
            });
          }
        });
        localStorage.setItem('mp-wrong-questions', JSON.stringify(arr));
      } catch {}
    }

    // 写入题目日志与用时
    setQuestionLogs(prev => {
      const updated = [...prev, ...logs];
      try { localStorage.setItem('mp-question-logs', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setPerQuestionTimes(prev => {
      const updated = [...prev, ...times];
      try { localStorage.setItem('mp-times', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 更新计数/得分/答案统计
    setScore(prev => prev + correct);
    setAnsweredQuestions(prev => {
      const next = prev + correct + wrong;
      localStorage.setItem('math-practice-answered', String(next));
      return next;
    });
    setCorrectCount(prev => prev + correct);
    setWrongCount(prev => prev + wrong);
    // 同步写入结果页读取的统计键
    try {
      const newCorrect = (parseInt(localStorage.getItem('math-practice-correct') || '0') || 0) + correct;
      const newWrong = (parseInt(localStorage.getItem('math-practice-wrong') || '0') || 0) + wrong;
      localStorage.setItem('math-practice-correct', String(newCorrect));
      localStorage.setItem('math-practice-wrong', String(newWrong));
    } catch {}

    // 更新每日统计并触发连胜计算
    try {
      const stats = gamification.getDailyStats();
      const updated = {
        ...stats,
        questionsAnswered: (stats.questionsAnswered || 0) + correct + wrong,
        correctAnswers: (stats.correctAnswers || 0) + correct,
        totalTime: (stats.totalTime || 0) + times.reduce((s, t) => s + t * 1000, 0),
      };
      gamification.saveDailyStats(updated);
      gamification.updateStreak();
      window.dispatchEvent(new Event('mp-profile-updated'));
    } catch {}

    // 推进题号
    const nextIndex = Math.min(questions.length, currentQuestionRef.current + target);
    setCurrentQuestion(nextIndex);

    // 结束判断
    if (nextIndex >= questions.length) {
      onFinish();
    }
  };
  
  // 计时器（READY/GO 动画期间暂停倒计时）
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && !showReadyAnimation && !showGoAnimation) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onFinish();
            return 0;
          }
          return prev - 1;
        });
      }
        }, 1000);
    return () => clearInterval(timer);
  }, [onFinish, isPaused, showReadyAnimation, showGoAnimation]);
  
  // 键盘输入处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 当在 Admin 控件中输入时，禁止把数字落到答题输入
      if (isAdminTyping) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.closest && target.closest('#mp-admin-bar'))) return;
      if (e.key === 'p' || e.key === 'P') {
        // P键：暂停/继续
        e.preventDefault();
        setIsPaused(prev => {
          const newPaused = !prev;
          if (newPaused) {
            // 开始暂停
            const now = Date.now();
            setPauseStartTime(now);
          } else {
            // 结束暂停，累计暂停时间
            setPauseStartTime(prevPauseStart => {
              if (prevPauseStart) {
                const now = Date.now();
                setTotalPauseTime(prev => prev + (now - prevPauseStart));
                return null;
              }
              return prevPauseStart;
            });
          }
          return newPaused;
        });
        return;
      }
      
      if (e.key >= '0' && e.key <= '9') {
        // 如果当前暂停，自动继续计时
        if (isPaused) {
          if (pauseStartTime) {
            setTotalPauseTime(prev => prev + (Date.now() - pauseStartTime));
            setPauseStartTime(null);
          }
          setIsPaused(false);
        }
        setUserAnswer(prev => prev + e.key);
        setIsWrong(false);
      } else if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
        setIsWrong(false);
      } else if (e.key === 'Enter' || e.key === ' ') {
        // 阻止默认行为，避免空格键触发其他元素
        e.preventDefault();
        // 直接在这里处理提交逻辑，避免循环依赖
        if (userAnswer === '' || userAnswer === null || userAnswer === undefined || questions.length === 0 || !questions[currentQuestion] || isSubmitting) return;
        
        setIsSubmitting(true);
        
    const answer = parseInt(userAnswer);
        const isCorrect = answer === questions[currentQuestion].correctAnswer;
        const now = Date.now();

        console.log('提交答案调试信息(键盘):', {
      userAnswer: answer,
          correctAnswer: questions[currentQuestion].correctAnswer,
      isCorrect,
          currentQuestion,
          totalQuestions: questions.length,
          question: questions[currentQuestion]
        });
        // 计算实际答题时间，使用新的计时逻辑
        const currentQuestionTime = getCurrentQuestionTime();
        const durationSec = Math.max(0, currentQuestionTime / 1000);
        
        console.log('键盘提交答案时的计时信息:', {
      answer,
          isCorrect,
          now,
          sessionStartTime,
          lastStartTime,
          pauseStartTime,
          totalPauseTime: (totalPauseTime / 1000).toFixed(3),
          currentQuestionTime: (currentQuestionTime / 1000).toFixed(3),
          durationSec: durationSec.toFixed(3),
          isPaused
        });
        const nextAnswered = answeredQuestions + 1;
        const nextTimes = [...perQuestionTimes, durationSec];
        setPerQuestionTimes(nextTimes);
        localStorage.setItem('mp-times', JSON.stringify(nextTimes));
        // 记录本题日志
        const q = questions[currentQuestion];
        const questionLog = {
          a: q.a,
          b: q.b,
          operation: q.operation,
          correctAnswer: q.correctAnswer,
          userAnswer: answer,
          isCorrect,
          timeTaken: durationSec,
          displayText: q.displayText,
          isFillBlank: q.isFillBlank,
          blankPosition: q.blankPosition,
        };
    setQuestionLogs(prev => [...prev, questionLog]);

        // 保存题目日志到localStorage
        try {
          const updatedLogs = [...questionLogs, questionLog];
          localStorage.setItem('mp-question-logs', JSON.stringify(updatedLogs));
        } catch (error) {
          console.error('保存题目日志失败:', error as Error);
        }

        // 云端同步题目日志
        try {
          if (localStorage.getItem('mp-cloud-sync') === '1') {
            const accountService = AccountService.getInstance();
            const currentAccount = accountService.getCurrentAccount();
            if (currentAccount) {
              const passwordHash = btoa(currentAccount.name + '_password');
              CloudStore.getInstance().ensureAccount(currentAccount.name, passwordHash, currentAccount.type)
                .then(cloudAccountId => {
                  return CloudStore.getInstance().logQuestion(cloudAccountId, {
                    questionText: q.displayText,
                    userAnswer: answer,
                    correctAnswer: q.correctAnswer,
                    isCorrect,
                    timeTaken: durationSec
                  });
                })
                .then(() => {
                  console.log('[CloudSync] 题目日志同步成功');
                })
                .catch(error => {
                  console.error('[CloudSync] 题目日志同步失败:', error);
                });
            }
          }
        } catch (error) {
          console.error('[CloudSync] 题目日志同步异常:', error);
        }
        
        // 如果是错题，增加5秒惩罚时间
        if (!isCorrect) {
          // 错题惩罚：从剩余时间扣除5秒
          setTimeLeft(prev => Math.max(0, prev - 5));
          
          const wrongQuestion = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...questionLog,
            createdAt: Date.now(),
            questionType: localStorage.getItem('questionType') || 'unknown',
            isTestMode: localStorage.getItem('isTestMode') === 'true'
          };
          
          try {
            const existingWrongQuestions = localStorage.getItem('mp-wrong-questions');
            const wrongQuestions = existingWrongQuestions ? JSON.parse(existingWrongQuestions) : [];
            wrongQuestions.push(wrongQuestion);
            localStorage.setItem('mp-wrong-questions', JSON.stringify(wrongQuestions));
          } catch (error) {
            console.error('保存错题失败:', error as Error);
          }

          // 云端同步错题记录
          try {
            if (localStorage.getItem('mp-cloud-sync') === '1') {
              const accountService = AccountService.getInstance();
              const currentAccount = accountService.getCurrentAccount();
              if (currentAccount) {
                const passwordHash = btoa(currentAccount.name + '_password');
                CloudStore.getInstance().ensureAccount(currentAccount.name, passwordHash, currentAccount.type)
                  .then(cloudAccountId => {
                    return CloudStore.getInstance().logWrongQuestion(cloudAccountId, {
                      questionText: q.displayText,
                      correctAnswer: q.correctAnswer,
                      wrongAnswer: answer
                    });
                  })
                  .then(() => {
                    console.log('[CloudSync] 错题记录同步成功');
                  })
                  .catch(error => {
                    console.error('[CloudSync] 错题记录同步失败:', error);
                  });
              }
            }
          } catch (error) {
            console.error('[CloudSync] 错题记录同步异常:', error);
          }
        }
        
        if (isCorrect) {
          // 键盘提交-答对音效
          playSfx('correct');
          const nextCorrect = correctCount + 1;
          setScore(prev => prev + 1);
          setAnsweredQuestions(prev => prev + 1);
          setCorrectCount(prev => prev + 1);
          // 立即持久化
          localStorage.setItem('math-practice-answered', nextAnswered.toString());
          localStorage.setItem('math-practice-correct', nextCorrect.toString());
          localStorage.setItem('math-practice-wrong', wrongCount.toString());
          
          setUserAnswer('');
          setIsWrong(false);
          
          if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setLastStartTime(now);
            // 重置每题的暂停时间
            setTotalPauseTime(0);
            setPauseStartTime(null);
            // 重置提交状态
            setIsSubmitting(false);
    } else {
            // 保存最终统计结果与历史记录
            localStorage.setItem('math-practice-score', (score + 1).toString());
            console.log('保存最终统计(回车):', { correct: nextCorrect, wrong: wrongCount, answered: nextAnswered });
            // 历史记录（仅完成时写入）
            try {
              const historyRaw = localStorage.getItem('mp-history');
              const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
              const total = nextTimes.length;
              const correct = nextCorrect;
              const wrong = Math.max(0, total - correct);
              const avg = total > 0 ? nextTimes.reduce((s,n)=>s+n,0) / total : 0;
              // 从localStorage获取完整的questionLogs数组（已经包含了当前题目）
              let fullLogs: any[] = [];
              try {
                const storedLogs = localStorage.getItem('mp-question-logs');
                if (storedLogs) {
                  fullLogs = JSON.parse(storedLogs);
                }
              } catch (error) {
                console.error('获取题目日志失败:', error as Error);
                fullLogs = [];
              }
              
              console.log('保存历史记录-正确分支:', {
                questionLogsLength: questionLogs.length,
                questionLogs,
                fullLogsLength: fullLogs.length,
                fullLogs: fullLogs
              });
              
              // 更新questionLogs状态
              setQuestionLogs(prevLogs => [...prevLogs, ...questionLogs]);
              const wrongDetails = fullLogs.filter(x => !x.isCorrect).sort((p, c) => c.durationSec - p.durationSec);
              const slowCorrectDetails = fullLogs.filter(x => x.isCorrect && x.durationSec >= 4).sort((p, c) => c.durationSec - p.durationSec);
              const record = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                questionCount: total,
                correct,
                wrong,
                accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
                avgTime: avg,
                times: nextTimes,
                type: localStorage.getItem('questionType') || 'unknown',
                timeLimit: parseInt(localStorage.getItem('timeLimit') || '5'),
                isManual: false,
                questionLogs: fullLogs || [],
                wrongDetails,
                slowCorrectDetails
              };
              history.unshift(record);
              localStorage.setItem('mp-history', JSON.stringify(history));
            } catch {}
            // 游戏化结算
            finalizeGamification(nextCorrect, nextTimes.length, nextTimes);
            onFinish();
          }
        } else {
          playSfx('wrong');
          // 答错时的效果 - 显示红色报警但立即进入下一题
          console.log('答错调试信息(键盘):', {
            userAnswer: answer,
            correctAnswer: questions[currentQuestion].correctAnswer,
            question: questions[currentQuestion],
            currentQuestion,
            totalQuestions: questions.length
          });
          
          setIsWrong(true);
          setShowFeedback({
            isCorrect: false,
            message: '❌ 答错了'
          });
          const nextWrong = wrongCount + 1;
          setAnsweredQuestions(prev => prev + 1);
          setWrongCount(prev => prev + 1);
          // 立即持久化
          localStorage.setItem('math-practice-answered', nextAnswered.toString());
          localStorage.setItem('math-practice-correct', correctCount.toString());
          localStorage.setItem('math-practice-wrong', nextWrong.toString());
          
          // 答错直接跳下一题，不给修改机会
      setUserAnswer('');
          setIsWrong(false);
          
          if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setLastStartTime(now);
            // 重置每题的暂停时间
            setTotalPauseTime(0);
            setPauseStartTime(null);
            // 重置提交状态
            setIsSubmitting(false);
          } else {
            console.log('保存最终统计(回车):', { correct: correctCount, wrong: nextWrong, answered: nextAnswered });
            // 历史记录（仅完成时写入）
            try {
              const historyRaw = localStorage.getItem('mp-history');
              const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
              const total = nextTimes.length;
              const correct = correctCount;
              const wrong = Math.max(0, total - correct);
              const avg = total > 0 ? nextTimes.reduce((s,n)=>s+n,0) / total : 0;
              // 从localStorage获取完整的questionLogs数组（已经包含了当前题目）
              let fullLogs: any[] = [];
              try {
                const storedLogs = localStorage.getItem('mp-question-logs');
                if (storedLogs) {
                  fullLogs = JSON.parse(storedLogs);
                }
              } catch (error) {
                console.error('获取题目日志失败:', error as Error);
                fullLogs = [];
              }
              
              console.log('保存历史记录-错误分支:', {
                questionLogsLength: questionLogs.length,
                questionLogs,
                fullLogsLength: fullLogs.length,
                fullLogs: fullLogs
              });
              
              // 更新questionLogs状态
              setQuestionLogs(prevLogs => [...prevLogs, ...questionLogs]);
              const wrongDetails = fullLogs.filter(x => !x.isCorrect).sort((p, c) => c.durationSec - p.durationSec);
              const slowCorrectDetails = fullLogs.filter(x => x.isCorrect && x.durationSec >= 4).sort((p, c) => c.durationSec - p.durationSec);
              const record = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                questionCount: total,
                correct,
                wrong,
                accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
                avgTime: avg,
                times: nextTimes,
                type: localStorage.getItem('questionType') || 'unknown',
                timeLimit: parseInt(localStorage.getItem('timeLimit') || '5'),
                isManual: false,
                questionLogs: fullLogs || [],
                wrongDetails,
                slowCorrectDetails
              };
              history.unshift(record);
              localStorage.setItem('mp-history', JSON.stringify(history));
            } catch {}
            // 游戏化结算
            finalizeGamification(correctCount, nextTimes.length, nextTimes);
            onFinish();
          }
          
          // 1.5秒后清除反馈
        setTimeout(() => {
            setShowFeedback(null);
          }, 1500);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, currentQuestion, questions, score, answeredQuestions, correctCount, wrongCount, onFinish]);
  
  // 处理数字输入，如果暂停则自动继续
  const handleNumberInput = (digit: string) => {
    if (isPaused) {
      const now = Date.now();
      if (pauseStartTime) {
        setTotalPauseTime(prev => prev + (now - pauseStartTime));
        setPauseStartTime(null);
      }
      setIsPaused(false);
    }
    setUserAnswer(prev => prev + digit);
    setIsWrong(false);
  };

  const handleSubmit = () => {
    addDebugInfo('提交按钮点击', {
      userAnswer,
      isSubmitting,
      currentQuestion,
      questionsLength: questions.length,
      hasCurrentQuestion: !!questions[currentQuestion]
    });
    
    if (userAnswer === '' || userAnswer === null || userAnswer === undefined || questions.length === 0 || !questions[currentQuestion] || isSubmitting) {
      addDebugInfo('提交被阻止', {
        reason: {
          emptyAnswer: userAnswer === '',
          nullAnswer: userAnswer === null,
          undefinedAnswer: userAnswer === undefined,
          noQuestions: questions.length === 0,
          noCurrentQuestion: !questions[currentQuestion],
          isSubmitting
        }
      });
      return;
    }
    
    addDebugInfo('开始提交', { userAnswer, currentQuestion });
    setIsSubmitting(true);
    
    const answer = parseInt(userAnswer);
    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    const now = Date.now();
    
    addDebugInfo('答案验证', {
      userAnswer: answer,
      correctAnswer: questions[currentQuestion].correctAnswer,
      isCorrect,
      question: questions[currentQuestion]
    });
    
    addDebugInfo('开始计算答题时间', { currentQuestion, questionsLength: questions.length });
    
    // 计算实际答题时间，使用新的计时逻辑
    const currentQuestionTime = getCurrentQuestionTime();
    const durationSec = Math.max(0, currentQuestionTime / 1000);
    
    addDebugInfo('答题时间计算完成', { 
      currentQuestionTime, 
      durationSec, 
      isCorrect,
      willProceedToNext: true
    });
    
    console.log('提交答案时的计时信息:', {
      answer,
      isCorrect,
      now,
      sessionStartTime,
      lastStartTime,
      pauseStartTime,
      totalPauseTime: (totalPauseTime / 1000).toFixed(3),
      currentQuestionTime: (currentQuestionTime / 1000).toFixed(3),
      durationSec: durationSec.toFixed(3),
      isPaused
    });
    const nextAnswered = answeredQuestions + 1;
    const nextTimes = [...perQuestionTimes, durationSec];
    setPerQuestionTimes(nextTimes);
    localStorage.setItem('mp-times', JSON.stringify(nextTimes));

    // 记录题目日志
    const q = questions[currentQuestion];
    const questionLog = {
      a: q.a,
      b: q.b,
      operation: q.operation,
      correctAnswer: q.correctAnswer,
      userAnswer: answer,
      isCorrect,
      timeTaken: durationSec,
      displayText: q.displayText,
      isFillBlank: q.isFillBlank,
      blankPosition: q.blankPosition,
    };
    
    // 使用函数式更新并获取最新状态
    setQuestionLogs(prev => {
      const newLogs = [...prev, questionLog];
      console.log('更新questionLogs:', {
        prevLength: prev.length,
        newLogsLength: newLogs.length,
        questionLog: questionLog
      });
      return newLogs;
    });
    
    // 保存题目日志到localStorage
    try {
      const updatedLogs = [...questionLogs, questionLog];
      localStorage.setItem('mp-question-logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('保存题目日志失败:', error as Error);
    }
    
    // 如果是错题，增加5秒惩罚时间并保存到错题集
    if (!isCorrect) {
      try {
        addDebugInfo('开始处理错题', { isCorrect, questionLog });
        
        // 错题惩罚：扣除单题时长
        const singleQuestionTime = parseInt(localStorage.getItem('timeLimit') || '5');
        addDebugInfo('准备增加惩罚时间(扣单题时长)', { before: timeLeft, singleQuestionTime });
        setTimeLeft(prev => {
          const next = Math.max(0, prev - singleQuestionTime);
          addDebugInfo('惩罚完成(扣单题时长)', { after: next });
          return next;
        });
        
        addDebugInfo('开始创建错题对象', { questionLogKeys: Object.keys(questionLog) });
        
        let wrongQuestion;
        try {
          addDebugInfo('创建错题ID', { timestamp: Date.now() });
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          addDebugInfo('ID创建完成', { id });
          
          addDebugInfo('获取localStorage数据', { 
            questionType: localStorage.getItem('questionType'),
            isTestMode: localStorage.getItem('isTestMode')
          });
          
          wrongQuestion = {
            id: id,
            ...questionLog,
            createdAt: Date.now(),
            questionType: localStorage.getItem('questionType') || 'unknown',
            isTestMode: localStorage.getItem('isTestMode') === 'true'
          };
          
          addDebugInfo('错题对象创建完成', { wrongQuestion });
        } catch (error) {
          addDebugInfo('错题对象创建失败', { error: (error as Error).message, questionLog });
          return; // 如果创建失败，直接返回
        }
        
        addDebugInfo('开始保存错题到localStorage', { wrongQuestion });
        
        try {
          addDebugInfo('获取现有错题列表', {});
          const existingWrongQuestions = localStorage.getItem('mp-wrong-questions');
          addDebugInfo('现有错题数据', { existingWrongQuestions: existingWrongQuestions?.substring(0, 100) + '...' });
          
          const wrongQuestions = existingWrongQuestions ? JSON.parse(existingWrongQuestions) : [];
          addDebugInfo('解析错题列表', { wrongQuestionsLength: wrongQuestions.length });
          
          wrongQuestions.push(wrongQuestion);
          addDebugInfo('添加新错题到列表', { newLength: wrongQuestions.length });
          
          const jsonString = JSON.stringify(wrongQuestions);
          addDebugInfo('序列化错题数据', { jsonLength: jsonString.length });
          
          localStorage.setItem('mp-wrong-questions', jsonString);
          addDebugInfo('错题保存成功', { wrongQuestionsLength: wrongQuestions.length });
        } catch (error) {
          console.error('保存错题失败:', error as Error);
          addDebugInfo('错题保存失败', { error: (error as Error).message, stack: (error as Error).stack });
        }
        
        addDebugInfo('错题处理完成', { isCorrect, questionLog });
      } catch (error) {
        console.error('错题处理整体失败:', error as Error);
        addDebugInfo('错题处理整体失败', { error: (error as Error).message, stack: (error as Error).stack });
      }
    }
    
    addDebugInfo('准备判断答案', { 
      isCorrect, 
      answer, 
      correctAnswer: questions[currentQuestion].correctAnswer,
      willEnterCorrectBranch: isCorrect,
      willEnterWrongBranch: !isCorrect
    });
    
    if (isCorrect) {
      // 按钮提交-答对音效
      playSfx('correct');
      addDebugInfo('答案正确', { 
        currentQuestion, 
        nextQuestion: currentQuestion + 1,
        totalQuestions: questions.length 
      });
      
      setScore(prev => prev + 1);
      setAnsweredQuestions(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
      const nextCorrect = correctCount + 1;
      // 立即持久化
      localStorage.setItem('math-practice-answered', nextAnswered.toString());
      localStorage.setItem('math-practice-correct', nextCorrect.toString());
      localStorage.setItem('math-practice-wrong', wrongCount.toString());
      setUserAnswer('');
      setIsWrong(false);
      
      if (currentQuestion < questions.length - 1) {
        addDebugInfo('跳转到下一题', { 
          from: currentQuestion, 
          to: currentQuestion + 1,
          isSubmitting: false 
        });
        setCurrentQuestion(prev => prev + 1);
        setLastStartTime(now);
        // 重置每题的暂停时间
        setTotalPauseTime(0);
        setPauseStartTime(null);
        // 重置提交状态
        setIsSubmitting(false);
      } else {
        addDebugInfo('练习完成', { 
          totalQuestions: questions.length,
          correct: nextCorrect,
          wrong: wrongCount 
        });
        // 保存最终统计结果
        localStorage.setItem('math-practice-score', (score + 1).toString());
        console.log('保存最终统计(按钮):', { correct: nextCorrect, wrong: wrongCount, answered: nextAnswered });
        
            // 保存历史记录
            try {
              const historyRaw = localStorage.getItem('mp-history');
              const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
              const total = nextTimes.length;
              const correct = nextCorrect;
              const wrong = Math.max(0, total - correct);
              const avg = total > 0 ? nextTimes.reduce((s,n)=>s+n,0) / total : 0;
              
              // 从localStorage获取完整的questionLogs数组（已经包含了当前题目）
              let fullLogs: any[] = [];
              try {
                const storedLogs = localStorage.getItem('mp-question-logs');
                if (storedLogs) {
                  fullLogs = JSON.parse(storedLogs);
                }
              } catch (error) {
                console.error('获取题目日志失败:', error as Error);
                fullLogs = [];
              }
          
          console.log('保存历史记录-按钮提交:', {
            fullLogsLength: fullLogs.length,
            fullLogs: fullLogs,
            currentQuestion: currentQuestion,
            questionsLength: questions.length,
            isLastQuestion: currentQuestion === questions.length - 1
          });
          
          const wrongDetails = fullLogs.filter(x => !x.isCorrect).sort((p, c) => c.durationSec - p.durationSec);
          const slowCorrectDetails = fullLogs.filter(x => x.isCorrect && x.durationSec >= 4).sort((p, c) => c.durationSec - p.durationSec);
          const record = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            questionCount: total,
            correct,
            wrong,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            avgTime: avg,
            times: nextTimes,
            type: localStorage.getItem('questionType') || 'unknown',
            timeLimit: parseInt(localStorage.getItem('timeLimit') || '5'),
            isManual: false,
            questionLogs: fullLogs || [],
            wrongDetails,
            slowCorrectDetails
          };
          
          history.unshift(record);
          localStorage.setItem('mp-history', JSON.stringify(history));
          
          console.log('历史记录保存完成-按钮提交:', {
            historyLength: history.length,
            savedRecordId: record.id,
            savedRecordQuestionLogsLength: record.questionLogs.length
          });
        } catch (error) {
          console.error('保存历史记录失败:', error as Error);
        }
        // 重置提交状态，避免停留在“提交中”
        setIsSubmitting(false);
        
        onFinish();
      }
        } else {
          // 键盘提交-答错音效
          playSfx('wrong');
      // 答错时的效果 - 显示红色报警但立即进入下一题
      console.log('进入答错分支:', {
        isCorrect,
        answer,
        correctAnswer: questions[currentQuestion].correctAnswer,
        currentQuestion,
        questionsLength: questions.length,
        isLastQuestion: currentQuestion === questions.length - 1,
        isSubmitting
      });
      
      addDebugInfo('答案错误', {
        userAnswer: answer,
        correctAnswer: questions[currentQuestion].correctAnswer,
        currentQuestion,
        nextQuestion: currentQuestion + 1,
        totalQuestions: questions.length
      });
      
      setIsWrong(true);
      setShowFeedback({
        isCorrect: false,
        message: '❌ 答错了'
      });
      
      setAnsweredQuestions(prev => prev + 1);
      setWrongCount(prev => prev + 1);
      const nextWrong = wrongCount + 1;
      // 立即持久化
      localStorage.setItem('math-practice-answered', nextAnswered.toString());
      localStorage.setItem('math-practice-correct', correctCount.toString());
      localStorage.setItem('math-practice-wrong', nextWrong.toString());
      
      // 答错直接跳下一题，不给修改机会
      setUserAnswer('');
      setIsWrong(false);
      
      if (currentQuestion < questions.length - 1) {
        addDebugInfo('答错跳转到下一题', { 
          from: currentQuestion, 
          to: currentQuestion + 1,
          isSubmitting: false 
        });
        setCurrentQuestion(prev => prev + 1);
        setLastStartTime(now);
        // 重置每题的暂停时间
        setTotalPauseTime(0);
        setPauseStartTime(null);
        // 重置提交状态
        setIsSubmitting(false);
      } else {
        console.log('答错练习完成:', { 
          totalQuestions: questions.length,
          correct: correctCount,
          wrong: nextWrong,
          currentQuestion,
          questionsLength: questions.length
        });
        console.log('保存最终统计(按钮):', { correct: correctCount, wrong: nextWrong, answered: nextAnswered });
        
            // 保存历史记录
            try {
              const historyRaw = localStorage.getItem('mp-history');
              const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
              const total = nextTimes.length;
              const correct = correctCount;
              const wrong = Math.max(0, total - correct);
              const avg = total > 0 ? nextTimes.reduce((s,n)=>s+n,0) / total : 0;
              
              // 从localStorage获取完整的questionLogs数组（已经包含了当前题目）
              let fullLogs: any[] = [];
              try {
                const storedLogs = localStorage.getItem('mp-question-logs');
                if (storedLogs) {
                  fullLogs = JSON.parse(storedLogs);
                }
              } catch (error) {
                console.error('获取题目日志失败:', error as Error);
                fullLogs = [];
              }
          
          console.log('保存历史记录-答错分支:', {
            fullLogsLength: fullLogs.length,
            fullLogs: fullLogs,
            currentQuestion: currentQuestion,
            questionsLength: questions.length,
            isLastQuestion: currentQuestion === questions.length - 1
          });
          
          const wrongDetails = fullLogs.filter(x => !x.isCorrect).sort((p, c) => c.durationSec - p.durationSec);
          const slowCorrectDetails = fullLogs.filter(x => x.isCorrect && x.durationSec >= 4).sort((p, c) => c.durationSec - p.durationSec);
          const record = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            questionCount: total,
            correct,
            wrong,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            avgTime: avg,
            times: nextTimes,
            type: localStorage.getItem('questionType') || 'unknown',
            timeLimit: parseInt(localStorage.getItem('timeLimit') || '5'),
            isManual: false,
            questionLogs: fullLogs || [],
            wrongDetails,
            slowCorrectDetails
          };
          
          history.unshift(record);
          localStorage.setItem('mp-history', JSON.stringify(history));
          
          console.log('历史记录保存完成-答错分支:', {
            historyLength: history.length,
            savedRecordId: record.id,
            savedRecordQuestionLogsLength: record.questionLogs.length
          });
        } catch (error) {
          console.error('保存历史记录失败:', error as Error);
        }
        
        onFinish();
      }
      
      // 1.5秒后清除反馈
      setTimeout(() => {
        setShowFeedback(null);
      }, 1500);
    }
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 text-2xl font-medium transition-colors"
            >
              ←
            </button>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {questionType}
        </div>
      </div>

        <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {(showReadyAnimation || showGoAnimation) ? `${timeLeft}秒` : (isPaused ? '⏸️ 暂停' : `${timeLeft}秒`)}
        </div>
      </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const now = Date.now();
                console.log('暂停按钮点击:', {
                  isPaused,
                  pauseStartTime,
                  totalPauseTime,
                  now,
                  sessionStartTime,
                  lastStartTime
                });
                setIsPaused(prev => {
                  const newPaused = !prev;
                  if (newPaused) {
                    // 开始暂停
                    setPauseStartTime(now);
                    console.log('开始暂停，设置暂停开始时间:', now);
                  } else {
                    // 结束暂停，累计暂停时间
                    if (pauseStartTime) {
                      const pauseDuration = now - pauseStartTime;
                      setTotalPauseTime(prev => {
                        const newTotal = prev + pauseDuration;
                        console.log('结束暂停，累计暂停时间:', { prev, pauseDuration, newTotal });
                        return newTotal;
                      });
                      setPauseStartTime(null);
                    }
                  }
                  return newPaused;
                });
              }}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-blue-100 active:text-blue-700"
            >
              {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
            </button>
            <div className="text-gray-600 dark:text-gray-400 text-lg font-medium">
              {currentQuestion + 1}/{questions.length}
        </div>
      </div>
        </div>
      </div>

      {/* Admin 内联控制条（倒计时下方通栏） */}
      {isAdmin && (
        <div id="mp-admin-bar" className="w-full bg-black/40 dark:bg-black/50 text-white text-xs py-2 px-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span>正确率</span>
            <input
              type="range"
              min="0"
              max="100"
              value={autoAnswerSettings.accuracy}
              onChange={(e) => {
                const val = clampInt(e.target.value, 0, 100, autoAnswerSettings.accuracy);
                setAutoAnswerSettings(prev => ({ ...prev, accuracy: val }));
                persistAutoSettings({ accuracy: val });
              }}
              onFocus={() => setIsAdminTyping(true)}
              onBlur={() => setIsAdminTyping(false)}
              className="w-40 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-8 text-right">{autoAnswerSettings.accuracy}%</span>
      </div>
          <div className="flex items-center gap-2">
            <span>做题数</span>
            <input
              type="number"
              min={1}
              max={questions.length}
              value={shadowAutoCount}
              onChange={(e) => {
                setShadowAutoCount(e.target.value);
                const parsed = clampInt(e.target.value, 1, Math.max(1, questions.length), autoAnswerSettings.autoCount);
                persistAutoSettings({ autoCount: parsed });
              }}
              onFocus={() => setIsAdminTyping(true)}
              onBlur={() => {
                setIsAdminTyping(false);
                setAutoAnswerSettings(prev => ({
                  ...prev,
                  autoCount: Math.min(questions.length, Math.max(1, parseInt(shadowAutoCount || '1'))) 
                }));
              }}
              className="w-16 px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
            />
            <span className="opacity-70">/ {questions.length}</span>
          </div>
          <button
            onClick={() => {
              // 先将影子做题数落库到真实设置，避免未失焦导致未保存
              const parsed = clampInt(shadowAutoCount, 1, Math.max(1, questions.length), autoAnswerSettings.autoCount);
              setAutoAnswerSettings(prev => ({ ...prev, autoCount: parsed }));
              persistAutoSettings({ autoCount: parsed });
              // 批量结算，瞬时完成
              runBatchAutoAnswer();
            }}
            className="ml-auto px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
          >一键做题</button>
          <button
            onClick={() => setAutoAnswerSettings(prev => ({ ...prev, enabled: false }))}
            className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700"
          >停止</button>
          {autoAnswerSettings.enabled && (
            <span className="ml-2 opacity-80">
              已完成 {(answeredQuestionsRef.current - burstStartAnsweredRef.current)}/{burstTarget || autoAnswerSettings.autoCount}
              </span>
            )}
          </div>
      )}
      {/* 调试条已移除 */}

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-8">
        {/* 题目显示（适配窄屏不换行，自动缩放） */}
        <div className="relative mb-8 sm:mb-12 w-full max-w-full px-1 sm:px-2">
          {/* 开场动画 */}
          {(showReadyAnimation || showGoAnimation) && (
            <div className="flex items-center justify-center h-32">
              <div className={`text-6xl sm:text-8xl font-bold transition-all duration-500 ${
                showReadyAnimation ? 'animate-bounce text-blue-600' : 'animate-bounce text-green-600'
              }`}>
                {showReadyAnimation ? 'Ready' : 'GO'}
              </div>
            </div>
          )}

          {/* 题目内容 - 在动画期间隐藏 */}
          {!(showReadyAnimation || showGoAnimation) && (
            <div className={`font-bold text-gray-800 dark:text-gray-200 mb-4 transition-all duration-300 whitespace-nowrap text-center ${
              isWrong ? 'animate-pulse' : ''
            }`} style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>
            {questions.length > 0 && (() => {
              const question = questions[currentQuestion];
              if (question?.isFillBlank) {
                // 填空题：将问号替换为用户输入，问号用蓝色
                const displayText = question.displayText;
                const userInput = userAnswer || '?';
                const parts = displayText.split('?');
                return (
                  <>
                    {parts[0]}
                    <span className={`font-bold transition-colors duration-300 align-baseline ${
                      userAnswer ? (isWrong ? 'text-red-500' : 'text-blue-600') : 'text-blue-500'
                    }`} style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>
                      {userInput}
                    </span>
                    {parts[1]}
                  </>
                );
              } else {
                // 普通题目：显示题目和用户输入
                return (
                  <>
                    <span className={`${currentQuestion === randomBonusIndex ? 'bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : ''}`}>
                      {question?.displayText}
                    </span>
                    <span className={`font-bold ml-2 transition-colors duration-300 align-baseline ${
                      isWrong ? 'text-red-500' : 'text-blue-600'
                    }`} style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>
                      {userAnswer || '?'}
                    </span>
                  </>
                );
              }
            })()}
          </div>
          )}
          
          {/* 小反馈信息 - 固定在题目上方 */}
          {showFeedback && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-600 bg-red-100 px-4 py-2 rounded-lg shadow-lg">
              {showFeedback.message}
            </div>
          )}
        </div>
      </div>

      {/* 数字键盘 - 移动端置底，桌面端居中 */}
      <div className="w-full sm:max-w-sm sm:mx-auto sm:px-0 sm:mt-8">
        <div className="grid grid-cols-4 grid-rows-4 gap-0.5 sm:gap-3">
          {/* 第一行 */}
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-1" onClick={() => handleNumberInput('1')}>1</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-1" onClick={() => handleNumberInput('2')}>2</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-1" onClick={() => handleNumberInput('3')}>3</button>
          <button className={`aspect-square text-sm sm:text-lg font-bold rounded-lg ${colors.status.errorBg} ${colors.status.error} hover:bg-red-200 dark:hover:bg-red-800/40 transition shadow col-start-4 row-start-1`} onClick={() => setUserAnswer(prev => prev.slice(0, -1))}>删除</button>

          {/* 第二行 */}
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-2" onClick={() => handleNumberInput('4')}>4</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-2" onClick={() => handleNumberInput('5')}>5</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-2" onClick={() => handleNumberInput('6')}>6</button>
          {/* 提交按钮占两行 */}
          <button className={`text-sm sm:text-lg font-bold rounded-lg ${colors.status.successBg} ${colors.status.success} hover:bg-green-600 dark:hover:bg-green-700 transition shadow disabled:bg-gray-400 disabled:cursor-not-allowed col-start-4 row-start-2 row-span-2`} onClick={handleSubmit} disabled={userAnswer === '' || userAnswer === null || userAnswer === undefined || isSubmitting}>
            {isSubmitting ? '提交中...' : '提交'}
        </button>

          {/* 第三行 */}
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-3" onClick={() => handleNumberInput('7')}>7</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-3" onClick={() => handleNumberInput('8')}>8</button>
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-3" onClick={() => handleNumberInput('9')}>9</button>

          {/* 第四行：0 在第二列 */}
          <button className="aspect-square text-4xl sm:text-[2.5em] font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-4" onClick={() => handleNumberInput('0')}>0</button>
        </div>
      </div>
    </div>
  );
};
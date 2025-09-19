import { useState, useEffect } from 'react';

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [questions, setQuestions] = useState<PlaySimpleQuestion[]>([]);
  const [showFeedback, setShowFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastStartTime, setLastStartTime] = useState<number>(() => Date.now());
  const [perQuestionTimes, setPerQuestionTimes] = useState<number[]>([]);
  const [questionType, setQuestionType] = useState('退位减法');
  const [questionLogs, setQuestionLogs] = useState<Array<{
    a: number;
    b: number;
    operation: '+' | '-' | '×' | '÷';
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
    durationSec: number;
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
            const a = Math.floor(Math.random() * 8) + 2; // 2-9
            const b = Math.floor(Math.random() * 8) + 2; // 2-9
            const product = a * b;
            const blankPos = Math.random() < 0.5 ? 'a' : 'b';
            if (blankPos === 'a') {
              question = { 
                a: product, // 被除数
                b: b, // 除数
                operation: '÷', 
                correctAnswer: a, // 商
                displayText: `? ÷ ${b} = ${a}`,
                isFillBlank: true,
                blankPosition: 'a'
              };
            } else {
              question = { 
                a: product, // 被除数
                b: a, // 商
                operation: '÷', 
                correctAnswer: b, // 除数
                displayText: `${product} ÷ ? = ${a}`,
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
    
    setQuestions(newQuestions);
    setLastStartTime(Date.now());
    setPerQuestionTimes([]);
  }, []);
  
  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onFinish]);
  
  // 键盘输入处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setUserAnswer(prev => prev + e.key);
        setIsWrong(false);
      } else if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
        setIsWrong(false);
      } else if (e.key === 'Enter') {
        // 直接在这里处理提交逻辑，避免循环依赖
        if (!userAnswer || questions.length === 0 || !questions[currentQuestion]) return;
        
        const answer = parseInt(userAnswer);
        const isCorrect = answer === questions[currentQuestion].correctAnswer;
        const now = Date.now();
        const durationSec = Math.max(0, Math.round((now - lastStartTime) / 1000));
        const nextAnswered = answeredQuestions + 1;
        const nextTimes = [...perQuestionTimes, durationSec];
        setPerQuestionTimes(nextTimes);
        localStorage.setItem('mp-times', JSON.stringify(nextTimes));
        // 记录本题日志
        const q = questions[currentQuestion];
        setQuestionLogs(prev => [...prev, {
          a: q.a,
          b: q.b,
          operation: q.operation,
          correctAnswer: q.correctAnswer,
          userAnswer: answer,
          isCorrect,
          durationSec
        }]);
        
        if (isCorrect) {
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
              const fullLogs = [...questionLogs, {
                a: q.a, b: q.b, operation: q.operation, correctAnswer: q.correctAnswer,
                userAnswer: answer, isCorrect, durationSec
              }];
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
                wrongDetails,
                slowCorrectDetails
              };
              history.unshift(record);
              localStorage.setItem('mp-history', JSON.stringify(history));
            } catch {}
            onFinish();
          }
        } else {
          // 答错时的效果
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
              const fullLogs = [...questionLogs, {
                a: q.a, b: q.b, operation: q.operation, correctAnswer: q.correctAnswer,
                userAnswer: answer, isCorrect, durationSec
              }];
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
                wrongDetails,
                slowCorrectDetails
              };
              history.unshift(record);
              localStorage.setItem('mp-history', JSON.stringify(history));
            } catch {}
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
  
  const handleSubmit = () => {
    if (!userAnswer || questions.length === 0 || !questions[currentQuestion]) return;
    
    const answer = parseInt(userAnswer);
    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    const now = Date.now();
    const durationSec = Math.max(0, Math.round((now - lastStartTime) / 1000));
    const nextAnswered = answeredQuestions + 1;
    const nextTimes = [...perQuestionTimes, durationSec];
    setPerQuestionTimes(nextTimes);
    localStorage.setItem('mp-times', JSON.stringify(nextTimes));
    
    if (isCorrect) {
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
        setCurrentQuestion(prev => prev + 1);
        setLastStartTime(now);
      } else {
        // 保存最终统计结果
        localStorage.setItem('math-practice-score', (score + 1).toString());
        console.log('保存最终统计(按钮):', { correct: nextCorrect, wrong: wrongCount, answered: nextAnswered });
        onFinish();
      }
    } else {
      // 答错时的效果
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
        setCurrentQuestion(prev => prev + 1);
        setLastStartTime(now);
      } else {
        console.log('保存最终统计(按钮):', { correct: correctCount, wrong: nextWrong, answered: nextAnswered });
        onFinish();
      }
      
      // 1.5秒后清除反馈
      setTimeout(() => {
        setShowFeedback(null);
      }, 1500);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="text-gray-600 hover:text-gray-800 text-2xl font-medium transition-colors"
            >
              ←
            </button>
            <div className="text-lg font-semibold text-gray-800">
              {questionType}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {timeLeft}秒
            </div>
          </div>
          
          <div className="text-gray-600 text-lg font-medium">
            第 {currentQuestion + 1} 题
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* 题目显示（适配窄屏不换行，自动缩放） */}
        <div className="relative mb-12 max-w-full">
          <div className={`text-6xl sm:text-7xl md:text-8xl font-bold text-gray-800 mb-4 transition-all duration-300 whitespace-nowrap ${
            isWrong ? 'animate-pulse' : ''
          }`} style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
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
                    }`} style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
                      {userInput}
                    </span>
                    {parts[1]}
                  </>
                );
              } else {
                // 普通题目：显示题目和用户输入
                return (
                  <>
                    {question?.displayText}
                    <span className={`font-bold ml-2 transition-colors duration-300 align-baseline ${
                      isWrong ? 'text-red-500' : 'text-blue-600'
                    }`} style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
                      {userAnswer || '?'}
                    </span>
                  </>
                );
              }
            })()}
          </div>
          
          {/* 小反馈信息 - 固定在题目上方 */}
          {showFeedback && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-600 bg-red-100 px-4 py-2 rounded-lg shadow-lg">
              {showFeedback.message}
            </div>
          )}
        </div>
        
        {/* 数字键盘：
            第1行: 1 2 3 删除
            第2行: 4 5 6 提交(起始)
            第3行: 7 8 9 提交(同一按钮继续占位)
            第4行:   0   (在第二列)
        */}
        <div className="mt-2">
          <div className="inline-grid grid-cols-4 grid-rows-4 gap-3">
            {/* 第一行 */}
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-1" onClick={() => setUserAnswer(prev => prev + '1')}>1</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-1" onClick={() => setUserAnswer(prev => prev + '2')}>2</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-1" onClick={() => setUserAnswer(prev => prev + '3')}>3</button>
            <button className="w-16 h-16 text-lg font-bold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition shadow col-start-4 row-start-1" onClick={() => setUserAnswer(prev => prev.slice(0, -1))}>删除</button>

            {/* 第二行 */}
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-2" onClick={() => setUserAnswer(prev => prev + '4')}>4</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-2" onClick={() => setUserAnswer(prev => prev + '5')}>5</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-2" onClick={() => setUserAnswer(prev => prev + '6')}>6</button>
            {/* 提交按钮占两行 */}
            <button className="w-16 h-[136px] text-lg font-bold rounded-lg bg-green-500 text-white hover:bg-green-600 transition shadow disabled:bg-gray-400 disabled:cursor-not-allowed col-start-4 row-start-2 row-span-2" onClick={handleSubmit} disabled={!userAnswer}>提交</button>

            {/* 第三行 */}
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-1 row-start-3" onClick={() => setUserAnswer(prev => prev + '7')}>7</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-3" onClick={() => setUserAnswer(prev => prev + '8')}>8</button>
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-3 row-start-3" onClick={() => setUserAnswer(prev => prev + '9')}>9</button>

            {/* 第四行：0 在第二列 */}
            <button className="w-16 h-16 text-2xl font-bold rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition shadow col-start-2 row-start-4" onClick={() => setUserAnswer(prev => prev + '0')}>0</button>
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Timer } from '../components/Timer';

interface Question {
  a: number;
  b: number;
  operation: '+' | '-';
  correctAnswer: number;
  displayText: string;
}

interface PlayProps {
  onFinish: () => void;
  onExit: () => void;
}

// 退位减法题目生成函数
const generateBorrowSubtraction = (range: number, usedQuestions: Set<string>): Question => {
  // 生成需要退位的减法题目
  const questions = [
    { a: 23, b: 7, operation: '-' as const, correctAnswer: 16, displayText: '23 - 7 =' },
    { a: 45, b: 8, operation: '-' as const, correctAnswer: 37, displayText: '45 - 8 =' },
    { a: 67, b: 9, operation: '-' as const, correctAnswer: 58, displayText: '67 - 9 =' },
    { a: 34, b: 6, operation: '-' as const, correctAnswer: 28, displayText: '34 - 6 =' },
    { a: 56, b: 8, operation: '-' as const, correctAnswer: 48, displayText: '56 - 8 =' },
    { a: 78, b: 9, operation: '-' as const, correctAnswer: 69, displayText: '78 - 9 =' },
    { a: 42, b: 7, operation: '-' as const, correctAnswer: 35, displayText: '42 - 7 =' },
    { a: 63, b: 5, operation: '-' as const, correctAnswer: 58, displayText: '63 - 5 =' },
    { a: 89, b: 6, operation: '-' as const, correctAnswer: 83, displayText: '89 - 6 =' },
    { a: 51, b: 8, operation: '-' as const, correctAnswer: 43, displayText: '51 - 8 =' }
  ];
  
  // 随机选择一个题目
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];
  
  // 简化逻辑，直接添加时间戳确保唯一性
  const uniqueQuestion = {
    ...question,
    a: question.a + Date.now() % 1000,
    correctAnswer: question.correctAnswer + Date.now() % 1000,
    displayText: `${question.a + Date.now() % 1000} - ${question.b} =`
  };
  
  usedQuestions.add(uniqueQuestion.displayText);
  return uniqueQuestion;
};

// 进位加法题目生成函数
const generateCarryAddition = (range: number, usedQuestions: Set<string>): Question => {
  // 生成需要进位的加法题目
  const questions = [
    { a: 15, b: 8, operation: '+' as const, correctAnswer: 23, displayText: '15 + 8 =' },
    { a: 27, b: 6, operation: '+' as const, correctAnswer: 33, displayText: '27 + 6 =' },
    { a: 38, b: 9, operation: '+' as const, correctAnswer: 47, displayText: '38 + 9 =' },
    { a: 46, b: 7, operation: '+' as const, correctAnswer: 53, displayText: '46 + 7 =' },
    { a: 59, b: 8, operation: '+' as const, correctAnswer: 67, displayText: '59 + 8 =' },
    { a: 67, b: 9, operation: '+' as const, correctAnswer: 76, displayText: '67 + 9 =' },
    { a: 74, b: 6, operation: '+' as const, correctAnswer: 80, displayText: '74 + 6 =' },
    { a: 83, b: 7, operation: '+' as const, correctAnswer: 90, displayText: '83 + 7 =' },
    { a: 92, b: 8, operation: '+' as const, correctAnswer: 100, displayText: '92 + 8 =' },
    { a: 56, b: 9, operation: '+' as const, correctAnswer: 65, displayText: '56 + 9 =' }
  ];
  
  // 随机选择一个题目
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];
  
  // 简化逻辑，直接添加时间戳确保唯一性
  const uniqueQuestion = {
    ...question,
    a: question.a + Date.now() % 1000,
    correctAnswer: question.correctAnswer + Date.now() % 1000,
    displayText: `${question.a + Date.now() % 1000} + ${question.b} =`
  };
  
  usedQuestions.add(uniqueQuestion.displayText);
  return uniqueQuestion;
};

const generateAddition = (range: number): Question => {
  const a = Math.floor(Math.random() * range) + 1;
  const b = Math.floor(Math.random() * range) + 1;
  const correctAnswer = a + b;
  
  return {
    a,
    b,
    operation: '+',
    correctAnswer,
    displayText: `${a} + ${b} =`
  };
};

export const Play: React.FC<PlayProps> = ({ onFinish, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [userAnswer, setUserAnswer] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalTime, setTotalTime] = useState(60);
  const [showFeedback, setShowFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  
  // 生成题目
  useEffect(() => {
    console.log('开始生成题目...');
    const newQuestions: Question[] = [];
    const usedQuestions = new Set<string>(); // 用于去重
    const questionType = localStorage.getItem('questionType') || 'borrow';
    const range = parseInt(localStorage.getItem('range') || '20');
    const questionCount = parseInt(localStorage.getItem('questionCount') || '10');
    const timeLimit = parseInt(localStorage.getItem('timeLimit') || '60');
    
    console.log('配置:', { questionType, range, questionCount, timeLimit });
    
    setTotalQuestions(questionCount);
    setTimeLeft(timeLimit);
    setTotalTime(timeLimit);
    
    if (questionType === 'borrow') {
      // 全部退位减法
      for (let i = 0; i < questionCount; i++) {
        const question = generateBorrowSubtraction(range, usedQuestions);
        newQuestions.push(question);
        console.log(`生成退位减法题目 ${i+1}:`, question);
      }
    } else if (questionType === 'carry') {
      // 全部进位加法
      for (let i = 0; i < questionCount; i++) {
        const question = generateCarryAddition(range, usedQuestions);
        newQuestions.push(question);
        console.log(`生成进位加法题目 ${i+1}:`, question);
      }
    } else {
      // 混合练习
      const borrowCount = Math.floor(questionCount * 0.5);
      for (let i = 0; i < borrowCount; i++) {
        const question = generateBorrowSubtraction(range, usedQuestions);
        newQuestions.push(question);
        console.log(`生成混合退位减法题目 ${i+1}:`, question);
      }
      for (let i = borrowCount; i < questionCount; i++) {
        const question = generateCarryAddition(range, usedQuestions);
        newQuestions.push(question);
        console.log(`生成混合进位加法题目 ${i+1}:`, question);
      }
    }
    
    console.log('题目生成完成，共', newQuestions.length, '题');
    setQuestions(newQuestions);
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

  // 自动聚焦到输入区域
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setUserAnswer(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        // 直接调用提交逻辑
        if (currentQuestion && userAnswer) {
          const answer = parseInt(userAnswer);
          const isCorrect = answer === currentQuestion.correctAnswer;
          
          if (isCorrect) {
            setScore(prev => prev + 1);
            setUserAnswer('');
            
            if (currentQuestionIndex < totalQuestions - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
            } else {
              localStorage.setItem('math-practice-score', score.toString());
              onFinish();
            }
          } else {
            setShowFeedback({
              isCorrect: false,
              message: '❌ 答错了'
            });
            
            setTimeout(() => {
              setShowFeedback(null);
              setUserAnswer('');
            }, 1500);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, userAnswer, currentQuestionIndex, totalQuestions, score, onFinish]);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleSubmit = () => {
    if (!currentQuestion || userAnswer === '') return;
    
    const answer = parseInt(userAnswer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      // 答对了直接进入下一题，不显示提示
      setUserAnswer('');
      
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // 保存成绩到localStorage
        localStorage.setItem('math-practice-score', score.toString());
        onFinish();
      }
    } else {
      // 答错了只显示小反馈，不给答案，自动清空答案
      setShowFeedback({
        isCorrect: false,
        message: '❌ 答错了'
      });
      
      setTimeout(() => {
        setShowFeedback(null);
        setUserAnswer(''); // 自动清空答案
      }, 1500);
    }
  };

  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-4">加载中...</div>
          <div className="text-sm text-gray-600">题目数量: {questions.length}</div>
          <div className="text-sm text-gray-600">当前题目索引: {currentQuestionIndex}</div>
          <div className="text-sm text-gray-600">总题目数: {totalQuestions}</div>
          {questions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-600">第一题: {questions[0]?.displayText}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">
            进度: {currentQuestionIndex + 1} / {totalQuestions}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-lg font-medium text-gray-700">
              得分: {score} / {currentQuestionIndex}
            </div>
            <Timer timeLeft={timeLeft} totalTime={totalTime} onTimeUp={onFinish} />
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              终止练习
            </button>
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* 题目显示 - 直接显示在背景上 */}
        <div className="text-center mb-8 relative">
          <div className="text-8xl font-bold text-gray-800 mb-4">
            {currentQuestion.displayText}
            <span className="text-8xl font-bold text-blue-600 ml-2">
              {userAnswer || '?'}
            </span>
          </div>
          
          {/* 小反馈信息 - 固定在题目上方 */}
          {showFeedback && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-600 bg-red-100 px-4 py-2 rounded-lg shadow-lg">
              {showFeedback.message}
            </div>
          )}
        </div>
        
        {/* 数字键盘 */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
            <button
              key={num}
              onClick={() => setUserAnswer(prev => prev + num.toString())}
              className="w-16 h-16 text-2xl font-bold rounded-lg bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {num}
            </button>
          ))}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => setUserAnswer('')}
            className="bg-red-500 text-white text-lg font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            清除 (Backspace)
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!userAnswer || showFeedback !== null}
            className="bg-green-500 text-white text-lg font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            提交 (Enter)
          </button>
        </div>
        
        {/* 键盘提示 */}
        <div className="mt-4 text-center text-gray-600 text-sm">
          💡 提示：可以直接使用键盘输入数字，按回车提交答案
        </div>
        
        {/* 提示信息 */}
        <div className="mt-8 text-center text-gray-600">
          {currentQuestion.operation === '-' && currentQuestion.a % 10 < currentQuestion.b % 10 && (
            <p className="text-sm text-orange-600">
              💡 这道题需要退位，个位不够减时要向十位借1
            </p>
          )}
          {currentQuestion.operation === '+' && (currentQuestion.a % 10) + (currentQuestion.b % 10) >= 10 && (
            <p className="text-sm text-orange-600">
              💡 这道题需要进位，个位相加满10要向十位进1
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

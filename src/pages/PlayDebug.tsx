import { useState, useEffect } from 'react';
import { DebugPanel } from '../components/DebugPanel';

interface Question {
  a: number;
  b: number;
  operation: '+' | '-';
  correctAnswer: number;
  displayText: string;
}

interface PlayDebugProps {
  onFinish: () => void;
  onExit: () => void;
}

export const PlayDebug: React.FC<PlayDebugProps> = ({ onFinish, onExit }) => {
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // 添加调试信息
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };
  
  // 生成题目
  useEffect(() => {
    addDebugInfo('开始生成题目...');
    
    try {
      const newQuestions: Question[] = [];
      const questionType = localStorage.getItem('questionType') || 'borrow';
      const range = parseInt(localStorage.getItem('range') || '20');
      const questionCount = parseInt(localStorage.getItem('questionCount') || '10');
      const timeLimit = parseInt(localStorage.getItem('timeLimit') || '60');
      
      addDebugInfo(`配置: ${questionType}, 范围: ${range}, 题目数: ${questionCount}, 时间: ${timeLimit}`);
      
      setTotalQuestions(questionCount);
      setTimeLeft(timeLimit);
      setTotalTime(timeLimit);
      
      // 生成简单的测试题目
      for (let i = 0; i < questionCount; i++) {
        const question: Question = {
          a: 10 + i,
          b: 5,
          operation: '-',
          correctAnswer: 5 + i,
          displayText: `${10 + i} - 5 =`
        };
        newQuestions.push(question);
        addDebugInfo(`生成题目 ${i + 1}: ${question.displayText}`);
      }
      
      addDebugInfo(`题目生成完成，共 ${newQuestions.length} 题`);
      setQuestions(newQuestions);
    } catch (error) {
      addDebugInfo(`生成题目出错: ${error}`);
      console.error('生成题目时出错:', error);
    }
  }, []);
  
  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          addDebugInfo('时间到，结束练习');
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onFinish]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setUserAnswer(prev => prev + e.key);
        addDebugInfo(`输入数字: ${e.key}`);
      } else if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
        addDebugInfo('删除字符');
      } else if (e.key === 'Enter') {
        addDebugInfo('按回车提交');
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer]);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleSubmit = () => {
    if (!currentQuestion || userAnswer === '') {
      addDebugInfo('无法提交：无题目或答案为空');
      return;
    }

    const answer = parseInt(userAnswer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    addDebugInfo(`提交答案: ${answer}, 正确答案: ${currentQuestion.correctAnswer}, 结果: ${isCorrect ? '正确' : '错误'}`);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setUserAnswer('');
      
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        addDebugInfo(`进入下一题: ${currentQuestionIndex + 2}`);
      } else {
        addDebugInfo('所有题目完成');
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
        addDebugInfo('清空错误答案');
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
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 调试面板 */}
      <DebugPanel
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        userAnswer={userAnswer}
        score={score}
        timeLeft={timeLeft}
        showFeedback={showFeedback}
        questionType={localStorage.getItem('questionType') || 'borrow'}
        range={parseInt(localStorage.getItem('range') || '20')}
        questionCount={parseInt(localStorage.getItem('questionCount') || '10')}
        timeLimit={parseInt(localStorage.getItem('timeLimit') || '60')}
      />
      
      {/* 调试日志 */}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-40 overflow-y-auto">
        <h3 className="font-bold mb-2">📝 调试日志</h3>
        {debugInfo.map((info, i) => (
          <div key={i} className="text-xs">{info}</div>
        ))}
      </div>
      
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
            <div className="text-lg font-medium text-gray-700">
              时间: {timeLeft}s
            </div>
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
        {/* 题目显示 */}
        <div className="text-center mb-8 relative">
          <div className="text-8xl font-bold text-gray-800 mb-4">
            {currentQuestion.displayText}
            <span className="text-8xl font-bold text-blue-600 ml-2">
              {userAnswer || '?'}
            </span>
          </div>
          
          {/* 反馈信息 */}
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
              onClick={() => {
                setUserAnswer(prev => prev + num.toString());
                addDebugInfo(`点击数字: ${num}`);
              }}
              className="w-16 h-16 text-2xl font-bold rounded-lg bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {num}
            </button>
          ))}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setUserAnswer('');
              addDebugInfo('清除答案');
            }}
            className="bg-red-500 text-white text-lg font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            清除
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!userAnswer || showFeedback !== null}
            className="bg-green-500 text-white text-lg font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
};



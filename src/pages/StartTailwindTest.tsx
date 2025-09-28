import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StartTailwindTestProps {
  onStart: () => void;
  onTest: () => void;
  onHistory: () => void;
  onWrongQuestions: () => void;
}

export const StartTailwindTest: React.FC<StartTailwindTestProps> = ({ onStart, onTest, onHistory, onWrongQuestions }) => {
  const { theme } = useTheme();
  
  const [config, setConfig] = useState({
    questionType: 'borrow' as 'borrow' | 'carry' | 'mixed' | 'multiply' | 'divide' | 'multiply_divide' | 'all_four' | 'fill_add_subtract' | 'fill_multiply_divide',
    range: 20,
    questionCount: 10,
    timeLimit: 5
  });
  
  const [hasWrongSet, setHasWrongSet] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const savedQuestionType = localStorage.getItem('questionType');
    const savedRange = localStorage.getItem('range');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedTestMode = localStorage.getItem('isTestMode');

    if (savedQuestionType) {
      setConfig(prev => ({ ...prev, questionType: savedQuestionType as any }));
    }
    if (savedRange) {
      setConfig(prev => ({ ...prev, range: parseInt(savedRange) }));
    }
    if (savedQuestionCount) {
      setConfig(prev => ({ ...prev, questionCount: parseInt(savedQuestionCount) }));
    }
    if (savedTimeLimit) {
      setConfig(prev => ({ ...prev, timeLimit: parseInt(savedTimeLimit) }));
    }
    if (savedTestMode) {
      setIsTestMode(savedTestMode === 'true');
    }

    const wrongQuestions = JSON.parse(localStorage.getItem('mp-wrong-questions') || '[]');
    setHasWrongSet(wrongQuestions.length > 0);
  }, []);

  useEffect(() => {
    localStorage.setItem('questionType', config.questionType);
    localStorage.setItem('range', config.range.toString());
    localStorage.setItem('questionCount', config.questionCount.toString());
    localStorage.setItem('timeLimit', config.timeLimit.toString());
    localStorage.setItem('isTestMode', isTestMode.toString());
  }, [config, isTestMode]);

  const handleStartClick = () => {
    localStorage.setItem('mp-start-with-wrong-set', '0');
    localStorage.setItem('questionCount', String(config.questionCount));
    localStorage.setItem('timeLimit', String(config.timeLimit));
    onStart();
  };

  const handleWrongPracticeClick = () => {
    localStorage.setItem('mp-start-with-wrong-set', '1');
    localStorage.setItem('questionCount', String(config.questionCount));
    localStorage.setItem('timeLimit', String(config.timeLimit));
    onStart();
  };

  const handleConfigChange = (key: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}
    >
      {/* 顶部按钮栏 */}
      <div className="flex justify-end items-center mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onWrongQuestions}
            className="text-2xl hover:text-gray-600 dark:text-gray-400 transition-colors"
            title="错题管理"
          >
            📚
          </button>
          <button
            onClick={onHistory}
            className="text-2xl hover:text-gray-600 dark:text-gray-400 transition-colors"
            title="历史记录"
          >
            ⏰
          </button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex justify-center">
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full"
          style={{
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '32px',
            maxWidth: '448px',
            width: '100%'
          }}
        >
          {/* 测试模式开关 */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🧪</div>
                <div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">测试模式</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">开启后成绩和错题不会记录到正式池中</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          {/* 题目数量 */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">题目数量</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.questionCount}
                  onChange={(e) => handleConfigChange('questionCount', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">题</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3">
              {[5, 10, 20, 30, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => handleConfigChange('questionCount', count)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    config.questionCount === count
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* 单题时间 */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">单题时间（秒）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.timeLimit}
                  onChange={(e) => handleConfigChange('timeLimit', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">秒</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3">
              {[2, 3, 5, 10, 0.87].map((time) => (
                <button
                  key={time}
                  onClick={() => handleConfigChange('timeLimit', time)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    config.timeLimit === time
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {time === 0.87 ? '0.87秒 (纪录)' : `${time}秒`}
                </button>
              ))}
            </div>
          </div>

          {/* 题型选择 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">题型选择</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'borrow', name: '退位减法' },
                { type: 'carry', name: '进位加法' },
                { type: 'mixed', name: '加减混合' },
                { type: 'fill_add_subtract', name: '加减法填空' },
                { type: 'multiply', name: '乘法' },
                { type: 'divide', name: '除法' },
                { type: 'multiply_divide', name: '乘除混合' },
                { type: 'fill_multiply_divide', name: '乘除法填空' },
              ].map((qType) => (
                <button
                  key={qType.type}
                  onClick={() => handleConfigChange('questionType', qType.type)}
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                    config.questionType === qType.type
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {qType.name}
                </button>
              ))}
              <button
                onClick={() => handleConfigChange('questionType', 'all_four')}
                className={`col-span-2 px-4 py-2 rounded-lg text-base font-medium transition-all ${
                  config.questionType === 'all_four'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                四则混合
              </button>
            </div>
          </div>

          {/* 运算范围 */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">运算范围</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.range}
                  onChange={(e) => handleConfigChange('range', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">以内</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[20, 50, 100, 1000].map((r) => (
                <button
                  key={r}
                  onClick={() => handleConfigChange('range', r)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    config.range === r
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              指每个加数、减数、被减数等的最大值
            </p>
          </div>

          {/* 开始练习按钮 */}
          <button
            onClick={handleStartClick}
            className="w-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mb-4"
          >
            🚀 开始练习
          </button>

          {/* 错题练习按钮 */}
          {hasWrongSet && (
            <button
              onClick={handleWrongPracticeClick}
              className="w-full bg-red-500/80 hover:bg-red-600/80 text-white text-lg font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              错题练习
            </button>
          )}

        </div>
      </div>

      {/* 清除记录按钮 */}
      <button
        onClick={() => {
          const input = window.prompt('输入 "清除" 确认清除所有本地统计与纪录数据：');
          if (input === '清除') {
            const keys = [
              'math-practice-correct',
              'math-practice-wrong',
              'math-practice-answered',
              'questionCount',
              'mp-times',
              'mp-best-avg'
            ];
            keys.forEach(k => localStorage.removeItem(k));
            alert('已清除本地统计与纪录数据');
          } else if (input !== null) {
            alert('输入不匹配，未执行清除');
          }
        }}
        className="fixed bottom-3 right-3 text-black hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-normal px-2 py-1 rounded transition-colors"
        title="清除本地统计与纪录数据（弱提示）"
      >
        清除记录
      </button>
    </div>
  );
};

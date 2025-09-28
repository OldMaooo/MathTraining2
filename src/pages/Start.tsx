import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StartProps {
  onStart: () => void;
  onTest: () => void;
  onHistory: () => void;
  onWrongQuestions: () => void;
}

export const Start: React.FC<StartProps> = ({ onStart, onTest, onHistory, onWrongQuestions }) => {
  console.log('[StartTest] component function called');
  const { theme } = useTheme();
  console.log('[StartTest] theme:', theme);
  
  const [config, setConfig] = useState({
    questionType: 'borrow',
    range: 20,
    questionCount: 10,
    timeLimit: 5
  });
  
  const [isTestMode, setIsTestMode] = useState(false);
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}
    >
      {/* 深色模式测试条 */}
      <div className="mb-4 p-2 bg-yellow-300 dark:bg-cyan-300 text-black rounded text-center text-sm font-bold">
        🌈 深色模式测试：黄色=浅色模式，青色=深色模式 | 当前主题: {theme}
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          {/* 深色模式测试条 */}
          <div className="mb-4 p-3 bg-orange-500 dark:bg-pink-500 text-white rounded-lg text-center">
            <div className="font-bold">🎨 深色模式测试条</div>
            <div className="text-sm">橙色=浅色模式，粉色=深色模式</div>
          </div>
          
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
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
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
                  value={config.questionCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 10 }))}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="1"
                  max="100"
                />
                <span className="text-gray-600 dark:text-gray-400">题</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {[5, 10, 20, 30, 50].map(num => (
                <button
                  key={num}
                  onClick={() => setConfig(prev => ({ ...prev, questionCount: num }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    config.questionCount === num
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          {/* 开始练习按钮 */}
          <button
            onClick={() => {
              localStorage.setItem('questionType', config.questionType);
              localStorage.setItem('range', config.range.toString());
              localStorage.setItem('questionCount', config.questionCount.toString());
              localStorage.setItem('timeLimit', config.timeLimit.toString());
              localStorage.setItem('isTestMode', isTestMode.toString());
              onStart();
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white text-lg font-bold py-3 rounded-xl hover:from-purple-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🚀 开始练习
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';

interface StartProps {
  onStart: () => void;
  onTest: () => void;
  onHistory: () => void;
  onWrongQuestions: () => void;
}

export const Start: React.FC<StartProps> = ({ onStart, onTest, onHistory, onWrongQuestions }) => {
  const [config, setConfig] = useState({
    questionType: 'borrow', // 'borrow' | 'carry' | 'mixed' | 'multiply' | 'divide' | 'multiply_divide' | 'all_four' | 'fill_add_subtract' | 'fill_multiply_divide'
    range: 20,
    questionCount: 10,
    timeLimit: 5 // 默认5秒单题时间
  });
  const [hasWrongSet, setHasWrongSet] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // 从localStorage加载上次的设置
  useEffect(() => {
    const savedQuestionType = localStorage.getItem('questionType');
    const savedRange = localStorage.getItem('range');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedTestMode = localStorage.getItem('isTestMode');

    if (savedQuestionType) {
      setConfig(prev => ({ ...prev, questionType: savedQuestionType as 'borrow' | 'carry' | 'mixed' | 'multiply' | 'divide' | 'multiply_divide' | 'all_four' | 'fill_add_subtract' | 'fill_multiply_divide' }));
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
    // 检查是否存在最新错题题集
    try {
      const latest = localStorage.getItem('mp-latest-wrong-set');
      if (latest) {
        const arr = JSON.parse(latest);
        setHasWrongSet(Array.isArray(arr) && arr.length > 0);
      }
    } catch {
      setHasWrongSet(false);
    }
  }, []);

  const handleStart = () => {
    // 保存配置到localStorage
    localStorage.setItem('questionType', config.questionType);
    localStorage.setItem('range', config.range.toString());
    localStorage.setItem('questionCount', config.questionCount.toString());
    localStorage.setItem('timeLimit', config.timeLimit.toString());
    localStorage.setItem('isTestMode', isTestMode.toString());
    
    onStart();
  };

  const handleConfigChange = (key: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  // const lastSession = sessionHistory[0];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          🧮 计算挑战赛
          </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={onWrongQuestions}
            className="text-2xl hover:text-gray-600 transition-colors"
            title="错题管理"
          >
            📚
          </button>
          <button
            onClick={onHistory}
            className="text-2xl hover:text-gray-600 transition-colors"
            title="历史记录"
          >
            ⏰
          </button>
        </div>
        </div>
      
      {/* 主要内容区域 */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        
        {/* 个人最佳成绩 - 暂时隐藏 */}
        {/* <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🏆 个人最佳</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">0%</div>
              <div className="text-sm text-gray-600">准确率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">0s</div>
              <div className="text-sm text-gray-600">平均用时</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">最长连击</div>
            </div>
          </div>
        </div> */}
        
        {/* 测试模式开关 */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🧪</div>
              <div>
                <div className="text-lg font-semibold text-gray-800">测试模式</div>
                <div className="text-sm text-gray-600">开启后成绩和错题不会记录到正式池中</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        {/* 练习设置 */}
        <div className="space-y-6 mb-8">
          
          {/* 题目数量 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800">题目数量</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.questionCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleConfigChange('questionCount', '');
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 0) {
                        handleConfigChange('questionCount', num);
                      }
                    }
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-lg font-semibold text-center"
                  placeholder="10"
                  min="1"
                  max="100"
                />
                <span className="text-sm text-gray-600">题</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 30, 50].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    handleConfigChange('questionCount', count);
                    // 立即恢复按钮状态
                    setTimeout(() => {
                      const button = document.querySelector(`[data-count="${count}"]`) as HTMLButtonElement;
                      if (button) {
                        button.blur();
                      }
                    }, 100);
                  }}
                  data-count={count}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-blue-100 active:text-blue-700"
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          {/* 单题时间 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800">单题时间（秒）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.timeLimit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleConfigChange('timeLimit', '');
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 0) {
                        handleConfigChange('timeLimit', num);
                      }
                    }
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-lg font-semibold text-center"
                  placeholder="5"
                  min="1"
                  max="60"
                />
                <span className="text-sm text-gray-600">秒</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 5, 10].map(time => (
                <button
                  key={time}
                  onClick={() => {
                    handleConfigChange('timeLimit', time);
                    // 立即恢复按钮状态
                    setTimeout(() => {
                      const button = document.querySelector(`[data-time="${time}"]`) as HTMLButtonElement;
                      if (button) {
                        button.blur();
                      }
                    }, 100);
                  }}
                  data-time={time}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-blue-100 active:text-blue-700"
                >
                  {time}秒
                </button>
              ))}
              {/* 当前题型最高记录作为选项按钮 */}
              {(() => {
                try {
                  const historyRaw = localStorage.getItem('mp-history');
                  if (historyRaw) {
                    const history = JSON.parse(historyRaw);
                    const currentTypeRecords = history.filter((record: any) => 
                      record.type === config.questionType
                    );
                    if (currentTypeRecords.length > 0) {
                      const bestRecord = currentTypeRecords.reduce((min: any, record: any) => 
                        record.avgTime < min.avgTime ? record : min
                      );
                      return (
                        <button
                          onClick={() => {
                            handleConfigChange('timeLimit', Math.round(bestRecord.avgTime));
                            // 立即恢复按钮状态
                            setTimeout(() => {
                              const button = document.querySelector(`[data-record]`) as HTMLButtonElement;
                              if (button) {
                                button.blur();
                              }
                            }, 100);
                          }}
                          data-record
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-blue-100 active:text-blue-700"
                        >
                          {bestRecord.avgTime.toFixed(2)}秒（纪录）
                        </button>
                      );
                    }
                  }
                  return null;
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
          
          {/* 题型选择 */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-gray-800">题型选择</label>
            <div className="grid grid-cols-2 gap-2">
              {/* 加减相关 */}
              <button
                onClick={() => handleConfigChange('questionType', 'borrow')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'borrow'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                退位减法
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'carry')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'carry'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                进位加法
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'mixed')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'mixed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                加减混合
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'fill_add_subtract')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'fill_add_subtract'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                加减法填空
              </button>
              {/* 乘除相关 */}
              <button
                onClick={() => handleConfigChange('questionType', 'multiply')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'multiply'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                乘法
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'divide')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'divide'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                除法
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'multiply_divide')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'multiply_divide'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                乘除混合
              </button>
              <button
                onClick={() => handleConfigChange('questionType', 'fill_multiply_divide')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.questionType === 'fill_multiply_divide'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                乘除法填空
              </button>
              {/* 四则混合 */}
              <button
                onClick={() => handleConfigChange('questionType', 'all_four')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all col-span-2 ${
                  config.questionType === 'all_four'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                四则混合
              </button>
            </div>
          </div>
          
          {/* 运算范围 - 乘除相关题型时隐藏 */}
          {!['multiply', 'divide', 'multiply_divide', 'fill_multiply_divide'].includes(config.questionType) && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-800">运算范围</label>
              <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.range}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleConfigChange('range', '');
                  } else {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                      handleConfigChange('range', num);
                    }
                  }
                }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-lg font-semibold text-center"
                  placeholder="20"
                min="1"
                max="1000"
              />
              <span className="text-sm text-gray-600">以内</span>
            </div>
          </div>
            <div className="flex gap-2 flex-wrap">
              {[20, 50, 100, 1000].map(range => (
                <button
                  key={range}
                  onClick={() => {
                    handleConfigChange('range', range);
                    // 立即恢复按钮状态
                    setTimeout(() => {
                      const button = document.querySelector(`[data-range="${range}"]`) as HTMLButtonElement;
                      if (button) {
                        button.blur();
                      }
                    }, 100);
                  }}
                  data-range={range}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-blue-100 active:text-blue-700"
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              指每个加数、减数、被减数等的最大值
            </div>
          </div>
          )}
        </div>
        
        {/* 底部按钮区域 */}
        <div className="space-y-4 mt-8">
               <button
                 onClick={handleStart}
                 className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
               >
                 🚀 开始练习
               </button>
               {hasWrongSet && (
                 <button
                   onClick={() => {
                // 弹出错题练习配置
                const wrongSetCount = (() => {
                     try {
                       const latest = localStorage.getItem('mp-latest-wrong-set');
                       const arr = latest ? JSON.parse(latest) : [];
                    return Array.isArray(arr) ? arr.length : 0;
                  } catch {
                    return 0;
                  }
                })();
                
                const questionCount = window.prompt(`错题练习题目数量 (最多${wrongSetCount}题):`, String(wrongSetCount));
                if (questionCount === null) return; // 用户取消
                
                const count = parseInt(questionCount);
                if (isNaN(count) || count <= 0) {
                  alert('请输入有效的题目数量');
                  return;
                }
                if (count > wrongSetCount) {
                  alert(`题目数量不能超过${wrongSetCount}题`);
                  return;
                }
                
                const timeLimit = window.prompt('单题时间（秒）:', '5');
                if (timeLimit === null) return; // 用户取消
                
                const time = parseInt(timeLimit);
                if (isNaN(time) || time <= 0) {
                  alert('请输入有效的单题时间');
                  return;
                }
                
                // 保存配置
                localStorage.setItem('mp-start-with-wrong-set', '1');
                localStorage.setItem('questionCount', String(count));
                localStorage.setItem('timeLimit', String(time));
                     onStart();
                   }}
                   className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-lg font-bold py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                 >
              错题练习
                 </button>
               )}
        </div>
             </div>
      </div>
      
      <button
        onClick={() => {
          const input = window.prompt('为了防止误操作，请输入 "清除记录" 以确认删除统计与纪录数据：');
          if (input === '清除记录') {
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
        className="fixed bottom-3 right-3 text-black hover:text-gray-900 text-xs font-normal px-2 py-1 rounded transition-colors"
        title="清除本地统计与纪录数据（弱提示）"
      >
        清除记录
      </button>
    </div>
  );
};

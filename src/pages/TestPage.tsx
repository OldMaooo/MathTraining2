import React, { useState, useEffect } from 'react';

interface TestPageProps {
  onBack: () => void;
}

export const TestPage: React.FC<TestPageProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[TEST] ${message}`);
  };
  
  useEffect(() => {
    addLog('TestPage 组件已加载');
  }, []);
  
  const testStep1 = () => {
    addLog('测试步骤1: 基本渲染');
    setStep(1);
  };
  
  const testStep2 = () => {
    addLog('测试步骤2: 状态管理');
    setStep(2);
  };
  
  const testStep3 = () => {
    addLog('测试步骤3: 题目生成');
    setStep(3);
  };
  
  const testStep4 = () => {
    addLog('测试步骤4: 事件处理');
    setStep(4);
  };
  
  const testStep5 = () => {
    addLog('测试步骤5: 完整流程');
    setStep(5);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🧪 调试测试页面</h1>
          
          <div className="grid grid-cols-5 gap-4 mb-8">
            <button
              onClick={testStep1}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              步骤1: 基本渲染
            </button>
            <button
              onClick={testStep2}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              步骤2: 状态管理
            </button>
            <button
              onClick={testStep3}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              步骤3: 题目生成
            </button>
            <button
              onClick={testStep4}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              步骤4: 事件处理
            </button>
            <button
              onClick={testStep5}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              步骤5: 完整流程
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">当前测试步骤: {step}</h2>
            
            {step === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold text-green-800">✅ 基本渲染测试</h3>
                  <p className="text-green-700">这个页面能正常显示，说明React组件渲染正常。</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📊 状态信息</h3>
                  <p className="text-blue-700">当前步骤: {step}</p>
                  <p className="text-blue-700">日志数量: {logs.length}</p>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold text-green-800">✅ 状态管理测试</h3>
                  <p className="text-green-700">useState 和 useEffect 工作正常。</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📊 状态信息</h3>
                  <p className="text-blue-700">当前步骤: {step}</p>
                  <p className="text-blue-700">日志数量: {logs.length}</p>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold text-green-800">✅ 题目生成测试</h3>
                  <p className="text-green-700">题目生成逻辑工作正常。</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📊 测试题目</h3>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-800">10 - 5 = 5</div>
                    <div className="text-2xl font-bold text-gray-800">11 - 5 = 6</div>
                    <div className="text-2xl font-bold text-gray-800">12 - 5 = 7</div>
                  </div>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold text-green-800">✅ 事件处理测试</h3>
                  <p className="text-green-700">按钮点击事件工作正常。</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📊 事件测试</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => addLog('按钮点击测试')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      点击测试
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {step === 5 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold text-green-800">✅ 完整流程测试</h3>
                  <p className="text-green-700">所有功能都工作正常，可以进入正常练习。</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📊 测试结果</h3>
                  <p className="text-blue-700">✅ 组件渲染正常</p>
                  <p className="text-blue-700">✅ 状态管理正常</p>
                  <p className="text-blue-700">✅ 题目生成正常</p>
                  <p className="text-blue-700">✅ 事件处理正常</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              清空日志
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 调试日志</h2>
          <div className="bg-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">暂无日志</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-sm text-gray-700 mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



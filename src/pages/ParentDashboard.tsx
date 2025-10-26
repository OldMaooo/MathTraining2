import React, { useState, useEffect } from 'react';

interface ParentDashboardProps {
  onBack: () => void;
}

interface LevelConfig {
  id: string;
  name: string;
  questionCount: number;
  timeLimit: number;
  range: number;
  questionType: string;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'settings'>('rewards');
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  // 加载关卡配置
  useEffect(() => {
    const loadLevelConfigs = () => {
      // 从localStorage加载关卡配置，如果没有则使用默认值
      const savedConfigs = localStorage.getItem('mp-level-configs');
      if (savedConfigs) {
        setLevelConfigs(JSON.parse(savedConfigs));
      } else {
        // 默认配置
        const defaultConfigs: LevelConfig[] = [
          {
            id: 'level-0-basic-number-sense',
            name: '基础数感 (1-9)',
            questionCount: 20,
            timeLimit: 60,
            range: 9,
            questionType: 'mixed'
          },
          {
            id: 'level-1-make-ten',
            name: '凑十基础',
            questionCount: 20,
            timeLimit: 120,
            range: 18,
            questionType: 'carry'
          },
          {
            id: 'level-2-single-digit-no-carry',
            name: '一位数运算(无进位)',
            questionCount: 20,
            timeLimit: 180,
            range: 99,
            questionType: 'mixed'
          },
          {
            id: 'level-3-single-digit-with-carry',
            name: '一位数运算(有进位)',
            questionCount: 20,
            timeLimit: 180,
            range: 99,
            questionType: 'mixed'
          }
        ];
        setLevelConfigs(defaultConfigs);
        localStorage.setItem('mp-level-configs', JSON.stringify(defaultConfigs));
      }
    };

    loadLevelConfigs();
  }, []);

  // 保存配置
  const saveConfigs = (configs: LevelConfig[]) => {
    setLevelConfigs(configs);
    localStorage.setItem('mp-level-configs', JSON.stringify(configs));
  };

  // 更新关卡配置
  const updateLevelConfig = (levelId: string, updates: Partial<LevelConfig>) => {
    const newConfigs = levelConfigs.map(config => 
      config.id === levelId ? { ...config, ...updates } : config
    );
    saveConfigs(newConfigs);
  };

  // 重置为默认配置
  const resetToDefaults = () => {
    if (confirm('确定要重置所有关卡配置为默认值吗？')) {
      localStorage.removeItem('mp-level-configs');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span>返回</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-800">家长监控面板</h1>
          <div></div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'rewards'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              奖励设置
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              关卡参数调节
            </button>
          </div>
        </div>

        {/* 奖励设置标签页 */}
        {activeTab === 'rewards' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">奖励设置</h2>
            <p className="text-gray-600 mb-6">这里可以设置关卡奖励，激励孩子学习</p>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">功能说明</h3>
                <p className="text-blue-700 text-sm">
                  家长可以为每个关卡设置不同星级的奖励，当孩子达到相应星级时就能获得奖励。
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">星级标准</h3>
                <div className="text-green-700 text-sm space-y-1">
                  <div>🥉 铜星：准确率 ≥ 60%</div>
                  <div>🥈 银星：准确率 ≥ 80% 且用时 ≤ 30秒</div>
                  <div>🥇 金星：准确率 ≥ 90% 且用时 ≤ 20秒</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 关卡参数调节标签页 */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">关卡参数调节</h2>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                重置为默认值
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levelConfigs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-gray-800 mb-4">{config.name}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        题目数量
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={config.questionCount}
                        onChange={(e) => updateLevelConfig(config.id, { questionCount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        时间限制（秒）
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="600"
                        value={config.timeLimit}
                        onChange={(e) => updateLevelConfig(config.id, { timeLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数值范围
                      </label>
                      <input
                        type="number"
                        min="9"
                        max="999"
                        value={config.range}
                        onChange={(e) => updateLevelConfig(config.id, { range: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        题型
                      </label>
                      <select
                        value={config.questionType}
                        onChange={(e) => updateLevelConfig(config.id, { questionType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="mixed">加减混合</option>
                        <option value="carry">进位加法</option>
                        <option value="borrow">退位减法</option>
                        <option value="multiply">乘法</option>
                        <option value="divide">除法</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ 注意事项</h3>
              <p className="text-yellow-700 text-sm">
                修改关卡参数会影响孩子的学习体验。建议在了解孩子当前水平的基础上进行适当调整。
                参数修改后会在下次进入该关卡时生效。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;









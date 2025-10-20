import React from 'react';

interface ParentDashboardProps {
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onBack }) => {

  // 精简版：仅奖励设置

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
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">家长监控面板</h2>
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
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回学习路径
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;









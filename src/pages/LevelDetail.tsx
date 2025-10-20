import React, { useState, useEffect } from 'react';
import { LearningPathService } from '../services/learningPathService';
import { LevelConfig, LevelProgress, UnlockStatus, ParentReward } from '../types/learningPath';

interface LevelDetailProps {
  levelId: string;
  onBack: () => void;
  onStart: (levelId: string) => void;
}

const LevelDetail: React.FC<LevelDetailProps> = ({ levelId, onBack, onStart }) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [parentReward, setParentReward] = useState<ParentReward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardTexts, setRewardTexts] = useState({ bronze: '', silver: '', gold: '' });

  const learningPathService = LearningPathService.getInstance();

  useEffect(() => {
    loadLevelData();
  }, [levelId]);

  const loadLevelData = () => {
    // 获取关卡配置
    const chapters = learningPathService.getChapters();
    let foundLevel: LevelConfig | null = null;
    
    for (const chapter of chapters) {
      const level = chapter.levels.find(l => l.id === levelId);
      if (level) {
        foundLevel = level;
        break;
      }
    }
    
    if (foundLevel) {
      setLevelConfig(foundLevel);
      
      // 获取关卡进度
      const progress = learningPathService.getLevelProgress(levelId);
      setLevelProgress(progress);
      
      // 获取解锁状态
      const unlock = learningPathService.checkUnlockStatus(levelId);
      setUnlockStatus(unlock);
      
      // 获取家长奖励
      const reward = learningPathService.getParentReward(levelId);
      if (reward) {
        setParentReward({ levelId, rewards: reward });
        setRewardTexts(reward);
      } else {
        setRewardTexts({ bronze: '', silver: '', gold: '' });
      }
    }
  };

  const handleSaveRewards = () => {
    learningPathService.setParentReward(levelId, rewardTexts);
    setParentReward({ levelId, rewards: rewardTexts });
    setShowRewardModal(false);
  };

  const getStarDisplay = () => {
    if (!levelProgress) return '☆☆☆';
    
    const { bronze, silver, gold } = levelProgress.stars;
    return `${gold ? '★' : '☆'}${silver ? '★' : '☆'}${bronze ? '★' : '☆'}`;
  };

  const getStarColor = (star: boolean) => {
    return star ? 'text-yellow-500' : 'text-gray-300';
  };

  if (!levelConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">关卡不存在</div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span>返回</span>
          </button>
          <div className="text-2xl font-bold text-gray-800">{levelConfig.name}</div>
          <div className="text-4xl">{getStarDisplay()}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：关卡信息 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">关卡信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">关卡ID:</span>
                  <span className="font-medium">{levelConfig.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">内容描述:</span>
                  <span className="font-medium">{levelConfig.content}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">题目数量:</span>
                  <span className="font-medium">{levelConfig.questionCount}题</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">难度范围:</span>
                  <span className="font-medium">{levelConfig.difficulty.range}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运算类型:</span>
                  <span className="font-medium">{levelConfig.difficulty.operations.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* 星级要求 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">星级要求</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥉</span>
                    <span className="font-medium">铜星</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    个人进步 ≥ {levelConfig.requirements.bronze.value}%
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥈</span>
                    <span className="font-medium">银星</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    ≤ {levelConfig.requirements.silver.time}s 且 ≥ {levelConfig.requirements.silver.accuracy}%
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥇</span>
                    <span className="font-medium">金星</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    ≤ {levelConfig.requirements.gold.time}s 且 ≥ {levelConfig.requirements.gold.accuracy}%
                  </div>
                </div>
              </div>
            </div>

            {/* 解锁条件 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">解锁条件</h3>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  {unlockStatus?.reason || '未知'}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：进度和奖励 */}
          <div className="space-y-6">
            {/* 当前进度 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">当前进度</h3>
              {levelProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">尝试次数:</span>
                    <span className="font-medium">{levelProgress.attempts}次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最佳用时:</span>
                    <span className="font-medium">{levelProgress.bestTime.toFixed(1)}秒</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最佳准确率:</span>
                    <span className="font-medium">{levelProgress.bestAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最后游玩:</span>
                    <span className="font-medium text-sm">
                      {new Date(levelProgress.lastPlayed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  尚未开始此关卡
                </div>
              )}
            </div>

            {/* 家长奖励 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">家长奖励</h3>
                <button
                  onClick={() => setShowRewardModal(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  设置奖励
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥉</span>
                    <span className="font-medium">铜星奖励</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {parentReward?.rewards.bronze || '未设置'}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥈</span>
                    <span className="font-medium">银星奖励</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {parentReward?.rewards.silver || '未设置'}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥇</span>
                    <span className="font-medium">金星奖励</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {parentReward?.rewards.gold || '未设置'}
                  </div>
                </div>
              </div>
            </div>

            {/* 开始按钮 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={() => onStart(levelId)}
                disabled={!unlockStatus?.isUnlocked}
                className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
                  unlockStatus?.isUnlocked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {unlockStatus?.isUnlocked ? '开始挑战' : '关卡未解锁'}
              </button>
              {!unlockStatus?.isUnlocked && (
                <div className="mt-2 text-sm text-red-500 text-center">
                  {unlockStatus?.reason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 奖励设置弹窗 */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">设置家长奖励</h3>
              <button
                onClick={() => setShowRewardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  铜星奖励
                </label>
                <input
                  type="text"
                  value={rewardTexts.bronze}
                  onChange={(e) => setRewardTexts({...rewardTexts, bronze: e.target.value})}
                  placeholder="例如：完成基础练习"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  银星奖励
                </label>
                <input
                  type="text"
                  value={rewardTexts.silver}
                  onChange={(e) => setRewardTexts({...rewardTexts, silver: e.target.value})}
                  placeholder="例如：获得'减法小能手'徽章"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金星奖励
                </label>
                <input
                  type="text"
                  value={rewardTexts.gold}
                  onChange={(e) => setRewardTexts({...rewardTexts, gold: e.target.value})}
                  placeholder="例如：去公园玩一次"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveRewards}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowRewardModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelDetail;

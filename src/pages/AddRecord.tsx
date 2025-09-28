import { useState } from 'react';
import { colors } from '../styles/colors';

interface AddRecordProps {
  onBack: () => void;
}

export const AddRecord: React.FC<AddRecordProps> = ({ onBack }) => {
  const [speed, setSpeed] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('borrow');
  const [timeLimit, setTimeLimit] = useState<string>('5');

  const questionTypes = [
    { value: 'borrow', label: '退位减法' },
    { value: 'carry', label: '进位加法' },
    { value: 'mixed', label: '加减混合' },
    { value: 'multiply', label: '乘法' },
    { value: 'divide', label: '除法' },
    { value: 'multiply_divide', label: '乘除混合' },
    { value: 'all_four', label: '四则混合' },
    { value: 'fill_add_subtract', label: '加减法填空' },
    { value: 'fill_multiply_divide', label: '乘除法填空' }
  ];

  const handleSubmit = () => {
    const speedValue = parseFloat(speed);
    const timeLimitValue = parseInt(timeLimit);

    if (isNaN(speedValue) || speedValue <= 0) {
      alert('请输入有效的速度值');
      return;
    }

    if (isNaN(timeLimitValue) || timeLimitValue <= 0) {
      alert('请输入有效的单题时间');
      return;
    }

    try {
      // 获取现有历史记录
      const existingHistory = localStorage.getItem('mp-history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      // 添加新记录
      const newRecord = {
        avgTime: speedValue,
        ts: Date.now(),
        type: questionType,
        timeLimit: timeLimitValue,
        isManual: true // 标记为手动添加
      };

      history.push(newRecord);
      localStorage.setItem('mp-history', JSON.stringify(history));

      // 更新最佳纪录
      const typeRecords = history.filter((record: any) => record.type === questionType);
      if (typeRecords.length > 0) {
        const bestTime = Math.min(...typeRecords.map((record: any) => record.avgTime));
        localStorage.setItem('mp-best-avg', bestTime.toString());
      }

      alert('纪录添加成功！');
      onBack();
    } catch (error) {
      console.error('添加纪录失败:', error);
      alert('添加纪录失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 text-2xl font-medium transition-colors"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">手动添加纪录</h1>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* 题型选择 */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">题型</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className={`w-full px-4 py-3 ${colors.form.select} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value} className={colors.form.option}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 速度输入 */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">平均速度（秒）</label>
              <input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="例如：2.5"
                step="0.1"
                min="0.1"
                className={`w-full px-4 py-3 ${colors.form.input} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
              />
            </div>

            {/* 单题时间 */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">单题时间（秒）</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="例如：5"
                min="1"
                className={`w-full px-4 py-3 ${colors.form.input} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
              />
            </div>

            {/* 说明文字 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-2">💡 说明：</div>
                <ul className="space-y-1 text-xs">
                  <li>• 速度值越小表示答题越快</li>
                  <li>• 添加的纪录会与历史最佳纪录进行比较</li>
                  <li>• 如果新纪录更好，会自动更新最佳纪录</li>
                </ul>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                添加纪录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

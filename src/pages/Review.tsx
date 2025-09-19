import { useState, useEffect } from 'react';

interface ReviewProps {
  onRestart: () => void;
}

// 饼图组件（绿色=正确，红色=错误，总和=已答）
const PieChart: React.FC<{ correct: number; wrong: number; total: number }> = ({ correct, wrong, total }) => {
  // 对齐 Figma 视觉：更大半径与更粗线宽
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const correctLen = total > 0 ? (correct / total) * circumference : 0;
  const wrongLen = total > 0 ? (wrong / total) * circumference : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
          {/* 背景环 */}
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
          {/* 正确（绿色）段 */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="22"
            strokeDasharray={`${correctLen} ${circumference - correctLen}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
          {/* 错误（红色）段，紧随绿色之后 */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="22"
            strokeDasharray={`${wrongLen} ${circumference - wrongLen}`}
            strokeDashoffset={circumference - correctLen}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
          {/* 中心文字（显示正确率）*/}
          <text
            x="110"
            y="110"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-3xl font-extrabold text-gray-800"
            style={{ transform: 'rotate(90deg)', transformOrigin: '110px 110px' }}
          >
            {total > 0 ? Math.round((correct / total) * 100) : 0}%
          </text>
        </svg>
      </div>
    </div>
  );
};

// 速度对比条状图组件
const SpeedChart: React.FC<{ 
  currentSpeed: number; 
  bestSpeed: number | null; 
  brokeRecord: boolean; 
}> = ({ currentSpeed, bestSpeed, brokeRecord }) => {
  const maxSpeed = Math.max(currentSpeed, bestSpeed || 0);
  const currentWidth = maxSpeed > 0 ? (currentSpeed / maxSpeed) * 100 : 0;
  const bestWidth = maxSpeed > 0 && bestSpeed ? (bestSpeed / maxSpeed) * 100 : 0;

  return (
    <div className="w-full max-w-md">
      
      {/* 历史最佳速度 - 始终显示，即使没有历史记录也显示占位 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">历史最佳</span>
          <span className="text-sm font-medium text-green-600">
            {bestSpeed !== null ? `${bestSpeed.toFixed(2)}s` : '暂无记录'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3.5">
          <div 
            className="bg-green-500 h-3.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${bestWidth}%` }}
          />
        </div>
      </div>
      
      {/* 本次速度 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">本次速度</span>
          <span className={`text-sm font-medium ${brokeRecord ? 'text-green-600' : 'text-gray-600'}`}>
            {currentSpeed.toFixed(2)}s
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3.5">
          <div 
            className={`h-3.5 rounded-full transition-all duration-700 ease-out ${
              brokeRecord 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gray-400'
            }`}
            style={{ width: `${currentWidth}%` }}
          />
        </div>
        {brokeRecord && bestSpeed !== null && (
          <div className="text-center mt-2">
            <span className="text-xs text-green-600 font-medium">🎉 破纪录！</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const Review: React.FC<ReviewProps> = ({ onRestart }) => {
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeUsed, setTimeUsed] = useState(0);
  const [questionType, setQuestionType] = useState('退位减法');
  const [localStorageData, setLocalStorageData] = useState<Record<string, string | null>>({});
  const [avgTime, setAvgTime] = useState<number>(0);
  const [bestAvgTime, setBestAvgTime] = useState<number | null>(null);
  const [brokeRecord, setBrokeRecord] = useState(false);
  const [improveSeconds, setImproveSeconds] = useState<number>(0);
  const [improvePercent, setImprovePercent] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  
  useEffect(() => {
    // 从localStorage获取成绩和配置
    const savedCorrectCount = localStorage.getItem('math-practice-correct');
    const savedWrongCount = localStorage.getItem('math-practice-wrong');
    const savedAnsweredQuestions = localStorage.getItem('math-practice-answered');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedQuestionType = localStorage.getItem('questionType');
    
    if (savedCorrectCount) {
      setCorrectCount(parseInt(savedCorrectCount));
    }
    if (savedWrongCount) {
      setWrongCount(parseInt(savedWrongCount));
    }
    if (savedAnsweredQuestions) {
      setAnsweredQuestions(parseInt(savedAnsweredQuestions));
    }
    if (savedQuestionCount) {
      setTotalQuestions(parseInt(savedQuestionCount));
    }
    if (savedTimeLimit) {
      setTimeUsed(parseInt(savedTimeLimit));
    } else {
      setTimeUsed(5); // 默认5秒
    }
    if (savedQuestionType) {
      const typeMap: Record<string, string> = {
        'borrow': '退位减法',
        'carry': '进位加法',
        'mixed': '加减混合',
        'multiply': '乘法',
        'divide': '除法',
        'multiply_divide': '乘除混合',
        'all_four': '四则混合',
        'fill_add_subtract': '加减法填空',
        'fill_multiply_divide': '乘除法填空'
      };
      setQuestionType(typeMap[savedQuestionType] || '退位减法');
    }

    // 保存localStorage原始数据用于调试
    setLocalStorageData({
      'questionType': localStorage.getItem('questionType'),
      'range': localStorage.getItem('range'),
      'questionCount': localStorage.getItem('questionCount'),
      'timeLimit': localStorage.getItem('timeLimit'),
      'math-practice-correct': localStorage.getItem('math-practice-correct'),
      'math-practice-wrong': localStorage.getItem('math-practice-wrong'),
      'math-practice-answered': localStorage.getItem('math-practice-answered'),
    });

    // 读取本轮每题用时并计算平均
    const timesRaw = localStorage.getItem('mp-times');
    if (timesRaw) {
      try {
        const arr: number[] = JSON.parse(timesRaw) || [];
        if (arr.length > 0) {
          const sum = arr.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
          const avg = sum / arr.length;
          setAvgTime(avg);
          setTotalTime(sum); // 设置总用时
          // 历史最佳对比（越小越好），改为从 mp-history 计算最小 avgTime
          try {
            const hRaw = localStorage.getItem('mp-history');
            const list: Array<{ avgTime: number; ts?: number; type?: string; timeLimit?: number }> = hRaw ? JSON.parse(hRaw) : [];
            const minHistory = list.length > 0 ? Math.min(...list.map(x => x.avgTime)) : null;
            setBestAvgTime(minHistory);

            // 没有历史时，不显示“破纪录”，只展示本次速度
            if (minHistory == null) {
              setBrokeRecord(false);
              setImproveSeconds(0);
              setImprovePercent(0);
            } else if (Number.isFinite(avg) && avg < minHistory) {
              setBrokeRecord(true);
              const improveSec = Math.max(0, minHistory - avg);
              setImproveSeconds(improveSec);
              const improvePct = minHistory > 0 ? (improveSec / minHistory) * 100 : 0;
              setImprovePercent(improvePct);
            } else {
              setBrokeRecord(false);
              setImproveSeconds(0);
              setImprovePercent(0);
            }

            // 记录当前成绩到历史（确保线上首次访问也能建立历史）
            list.push({ avgTime: avg, ts: Date.now(), type: localStorage.getItem('questionType') || undefined, timeLimit: Number(localStorage.getItem('timeLimit') || 0) || undefined });
            localStorage.setItem('mp-history', JSON.stringify(list));

            // 同步 mp-best-avg 以兼容旧口径读取位置
            const newBest = list.length > 0 ? Math.min(...list.map(x => x.avgTime)) : avg;
            localStorage.setItem('mp-best-avg', String(newBest));
          } catch {
            // 失败则保持现状
          }
        }
      } catch {
        // ignore JSON errors
      }
    }
  }, []);
  
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const computedWrong = Math.max(0, totalQuestions - correctCount);
  
  const getPerformanceLevel = (acc: number) => {
    if (acc >= 90) return { level: '优秀', color: 'text-green-600', emoji: '🏆' };
    if (acc >= 80) return { level: '良好', color: 'text-blue-600', emoji: '🥈' };
    if (acc >= 70) return { level: '及格', color: 'text-yellow-600', emoji: '🥉' };
    return { level: '需要练习', color: 'text-red-600', emoji: '📚' };
  };
  
  const performance = getPerformanceLevel(accuracy);
  
  const getEncouragement = (acc: number) => {
    if (acc >= 90) return '🎉 太棒了！继续保持这个水平！';
    if (acc >= 80) return '👍 不错！再练习几次就能更好了！';
    if (acc >= 70) return '💪 加油！多练习就能提高！';
    return '📚 不要灰心，多练习退位减法，一定能进步的！';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-start pt-8 p-6">
      {/* 顶部右侧：历史记录按钮 */}
      <div className="w-full max-w-6xl flex justify-end mb-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('go-history'))}
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white/70 hover:bg-white transition shadow-sm"
        >
          历史记录
        </button>
      </div>
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">练习完成</h1>
      </div>
      
      {/* 主要内容区域 - 左右两组布局 */}
      {/* 等宽卡片容器，整体约80%宽 */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 mb-10 items-stretch justify-center" style={{ maxWidth: '80%' }}>
        {/* 左卡：正确率 */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-4">正确率</div>
          <div className="flex flex-col items-center">
            <PieChart correct={correctCount} wrong={computedWrong} total={totalQuestions} />
            <div className="grid grid-cols-2 gap-8 mt-2 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
                <div className="text-gray-600">答对题数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 mb-1">{computedWrong}</div>
                <div className="text-gray-600">答错题数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 右卡：答题速度 + 本轮总用时 */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-4">答题速度</div>
          <div className="flex flex-col items-center">
            <SpeedChart currentSpeed={avgTime} bestSpeed={bestAvgTime} brokeRecord={brokeRecord} />
            <div className="w-full mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">{totalTime.toFixed(2)}s</div>
                <div className="text-gray-600 text-sm">本轮总用时</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 破纪录提示 */}
      {brokeRecord && avgTime > 0 && (
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 text-center">
          <div className="text-lg font-semibold text-green-700">恭喜！刷新了历史最佳记录 🎉</div>
          <div className="text-sm text-gray-700 mt-1">比之前快了 {improveSeconds.toFixed(2)} 秒（{improvePercent.toFixed(1)}%）</div>
          {/* 简易撒花效果 */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center">
            <div className="animate-ping w-24 h-24 rounded-full bg-green-300/40"></div>
          </div>
        </div>
      )}

      {/* 统计调试信息（默认隐藏，按需开启） */}
      {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">📊 统计调试</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {totalQuestions}
            </div>
            <div className="text-gray-600">总题数 (设置)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {answeredQuestions}
            </div>
            <div className="text-gray-600">已答题数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {correctCount}
            </div>
            <div className="text-gray-600">答对数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {wrongCount}
            </div>
            <div className="text-gray-600">答错数量</div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-lg text-gray-700">
            <strong>未答数量:</strong> {totalQuestions - answeredQuestions}
          </div>
          <div className="text-lg text-gray-700">
            <strong>正确率计算:</strong> (答对数量 / 总题数) × 100% = ({correctCount} / {totalQuestions}) × 100% = {accuracy}%
          </div>
        </div>

        <div className="text-center mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>数据验证:</strong> 答对 ({correctCount}) + 答错 ({wrongCount}) = 已答 ({correctCount + wrongCount})
          </div>
          <div className={`text-sm font-bold ${correctCount + wrongCount === answeredQuestions ? 'text-green-600' : 'text-red-600'}`}>
            验证结果: {correctCount + wrongCount === answeredQuestions ? '✅ 匹配' : '❌ 不匹配'}
          </div>
        </div>

        <details className="text-center">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            查看 localStorage 原始数据
          </summary>
          <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto text-left">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </details>
      </div> */}
      
      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 px-10 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          再来一局
        </button>
      </div>
    </div>
  );
};

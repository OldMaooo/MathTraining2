import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LevelResultProps {
  levelId: string;
  time: number;
  accuracy: number;
  onBack: () => void;
  onRestart: () => void;
  onNext: () => void;
}

const LevelResult: React.FC<LevelResultProps> = ({ 
  levelId, 
  time, 
  accuracy, 
  onBack, 
  onRestart, 
  onNext 
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [baselineTime, setBaselineTime] = useState<number | null>(null);

  useEffect(() => {
    // 检查深色模式 - 从全局状态获取
    const checkDarkMode = () => {
      const darkMode = localStorage.getItem('mp-dark-mode') === 'true' || 
                      document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    };
    
    checkDarkMode();
    
    // 监听深色模式变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    // 获取基准时间
    const savedBaseline = localStorage.getItem(`mp-baseline-${levelId}`);
    if (savedBaseline) {
      setBaselineTime(parseFloat(savedBaseline));
    }
    
    // 立即显示动画和播放音效
    console.log('🎊 开始播放成功效果');
    setShowConfetti(true);
    playSuccessSound();
    
    // 备用定时器，防止动画事件没有触发
    const timer = setTimeout(() => {
      console.log('⏰ 备用定时器触发，停止动画');
      setShowConfetti(false);
    }, 8000); // 8秒后强制停止
    
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [levelId]);

  const playSuccessSound = () => {
    try {
      const audio = new Audio('/sfx/success.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // 忽略音频播放错误
      });
    } catch (error) {
      // 忽略音频错误
    }
  };

  // 简化的星级评定
  const getStarRating = () => {
    let stars = 0;
    if (accuracy >= 60) stars = 1; // 铜星
    if (accuracy >= 80 && time <= 30) stars = 2; // 银星
    if (accuracy >= 90 && time <= 20) stars = 3; // 金星
    return stars;
  };

  const getStarDisplay = () => {
    const stars = getStarRating();
    return (
      <div className="flex justify-center space-x-2">
        {[1, 2, 3].map((starNum) => (
          <svg
            key={starNum}
            width="60"
            height="60"
            viewBox="0 0 24 24"
            className={`transition-all duration-300 ${
              starNum <= stars ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={starNum <= stars ? 'currentColor' : 'none'}
              stroke={starNum <= stars ? 'currentColor' : 'currentColor'}
              strokeWidth="1.5"
              strokeLinejoin="round"
              className={starNum <= stars ? 'drop-shadow-lg' : ''}
            />
            {starNum <= stars && (
              <defs>
                <linearGradient id={`starGradient${starNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            )}
            {starNum <= stars && (
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={`url(#starGradient${starNum})`}
                className="drop-shadow-lg"
              />
            )}
          </svg>
        ))}
      </div>
    );
  };

  const getLevelName = (levelId: string) => {
    const levelNames: Record<string, string> = {
      '1-1': '10以内加法基础',
      '1-2': '10以内减法基础',
      '1-3': '10以内混合运算',
      '2-1': '20以内加法进阶',
      '2-2': '20以内减法进阶',
      '2-3': '20以内混合运算',
      '3-1': '50以内加法挑战',
      '3-2': '50以内减法挑战',
      '3-3': '50以内混合运算',
      '4-1': '100以内加法精通',
      '4-2': '100以内减法精通',
      '4-3': '100以内混合运算',
      '5-1': '乘法基础入门',
      '5-2': '乘法进阶练习',
      '5-3': '乘法混合运算',
      '6-1': '除法基础入门',
      '6-2': '除法进阶练习',
      '6-3': '除法混合运算',
      '7-1': '200以内加法大师',
      '7-2': '200以内减法大师',
      '7-3': '200以内混合大师',
      '8-1': '1000以内加法专家',
      '8-2': '1000以内减法专家',
      '8-3': '1000以内混合专家',
      // 添加更多可能的关卡ID格式
      'add-within-10': '10以内加法基础',
      'sub-within-10': '10以内减法基础',
      'mix-within-10': '10以内混合运算',
      'add-within-20': '20以内加法进阶',
      'sub-within-20': '20以内减法进阶',
      'mix-within-20': '20以内混合运算',
      'add-within-50': '50以内加法挑战',
      'sub-within-50': '50以内减法挑战',
      'mix-within-50': '50以内混合运算',
      'add-within-100': '100以内加法精通',
      'sub-within-100': '100以内减法精通',
      'mix-within-100': '100以内混合运算',
      'multiply-basic': '乘法基础入门',
      'multiply-advanced': '乘法进阶练习',
      'multiply-mixed': '乘法混合运算',
      'divide-basic': '除法基础入门',
      'divide-advanced': '除法进阶练习',
      'divide-mixed': '除法混合运算',
      'add-within-200': '200以内加法大师',
      'sub-within-200': '200以内减法大师',
      'mix-within-200': '200以内混合大师',
      'add-within-1000': '1000以内加法专家',
      'sub-within-1000': '1000以内减法专家',
      'mix-within-1000': '1000以内混合专家'
    };
    return levelNames[levelId] || `关卡 ${levelId}`;
  };

  const getSpeedPerQuestion = () => {
    const questionCount = 10; // 假设每轮10题
    return (time / questionCount).toFixed(1);
  };

  const getSpeedComparison = () => {
    const currentSpeed = parseFloat(getSpeedPerQuestion());
    if (baselineTime === null) {
      // 第一次，保存为基准
      localStorage.setItem(`mp-baseline-${levelId}`, currentSpeed.toString());
      setBaselineTime(currentSpeed);
      return { text: '首次完成，已设为基准速度', isImprovement: null };
    }
    
    const improvement = ((baselineTime - currentSpeed) / baselineTime * 100);
    if (improvement > 0) {
      return { text: `比基准快 ${improvement.toFixed(1)}%`, isImprovement: true };
    } else if (improvement < 0) {
      return { text: `比基准慢 ${Math.abs(improvement).toFixed(1)}%`, isImprovement: false };
    } else {
      return { text: '与基准速度相同', isImprovement: null };
    }
  };

  const getPerformanceMessage = () => {
    const stars = getStarRating();
    if (stars >= 3) return '完美表现！你超越了所有标准！';
    if (stars >= 2) return '优秀表现！你达到了熟练标准！';
    if (stars >= 1) return '不错的表现！你取得了个人进步！';
    return '继续努力，下次会更好！';
  };

  const canGoNext = getStarRating() >= 2; // 至少银星才能进入下一关

  const showToast = (msg: string) => {
    alert(msg);
  };

  const speedComparison = getSpeedComparison();

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      {/* 撒花动画 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/8894b22b-66c2-4503-ae74-e454a2d97e6c/VTvwp8ejnv.lottie"
            loop={false}
            autoplay={true}
            onLoad={() => {
              console.log('🎬 Lottie动画开始加载');
            }}
            onPlay={() => {
              console.log('▶️ Lottie动画开始播放');
            }}
            onComplete={() => {
              console.log('🎊 Lottie动画播放完成');
              setShowConfetti(false);
            }}
            style={{ 
              width: '100vw', 
              height: '100vh',
              minWidth: '300px',
              minHeight: '300px'
            }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            关卡完成！
          </h1>
          <h2 className={`text-2xl ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {getLevelName(levelId)}
          </h2>
        </div>

        {/* 星级评定和成绩表现 */}
        <div className={`rounded-lg shadow-lg p-8 mb-8 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* 星级评定 */}
          <div className="text-center mb-8">
            <h3 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              星级评定
            </h3>
            <div className="text-8xl mb-4">
              {getStarDisplay()}
            </div>
            <div className={`text-lg mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {getPerformanceMessage()}
            </div>
          </div>

          {/* 主要参数 - 一行显示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 速度表现 */}
            <div className={`text-center p-4 rounded-lg ${
              isDarkMode ? 'bg-purple-900' : 'bg-purple-50'
            }`}>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {getSpeedPerQuestion()}秒/题
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-purple-300' : 'text-purple-800'
              }`}>
                速度表现
              </div>
              <div className={`text-xs mt-1 ${
                speedComparison.isImprovement === true
                  ? (isDarkMode ? 'text-green-300' : 'text-green-700')
                  : speedComparison.isImprovement === false
                  ? (isDarkMode ? 'text-red-300' : 'text-red-700')
                  : (isDarkMode ? 'text-gray-300' : 'text-gray-600')
              }`}>
                {speedComparison.text}
              </div>
            </div>

            {/* 准确率 */}
            <div className={`text-center p-4 rounded-lg ${
              isDarkMode ? 'bg-blue-900' : 'bg-blue-50'
            }`}>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {accuracy}%
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                准确率
              </div>
            </div>

            {/* 用时 */}
            <div className={`text-center p-4 rounded-lg ${
              isDarkMode ? 'bg-green-900' : 'bg-green-50'
            }`}>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {time.toFixed(1)}s
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                总用时
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 - 页面底部 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className={`flex-1 max-w-xs py-4 px-6 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            重新挑战
          </button>
          
          <button
            onClick={() => {
              if (!canGoNext) {
                showToast('未达到开启下一关的要求，请先获得至少银星');
                return;
              }
              onNext();
            }}
            disabled={!canGoNext}
            className={`flex-1 max-w-xs py-4 px-6 rounded-lg font-medium transition-colors ${
              canGoNext
                ? (isDarkMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700')
                : (isDarkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed')
            }`}
          >
            下一关
          </button>
          
          <button
            onClick={onBack}
            className={`flex-1 max-w-xs py-4 px-6 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            返回关卡列表
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelResult;









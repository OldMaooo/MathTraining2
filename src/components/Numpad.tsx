import { useState } from 'react';

interface NumpadProps {
  onNumberClick: (num: number) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  className?: string;
}

export const Numpad: React.FC<NumpadProps> = ({
  onNumberClick,
  onDelete,
  onClear,
  onSubmit,
  disabled = false,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);
    onSubmit();
    // 重置提交状态
    setTimeout(() => setIsSubmitting(false), 300);
  };
  
  const buttonClass = `w-16 h-16 text-2xl font-bold rounded-lg transition-all duration-200 flex items-center justify-center ${
    disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
    'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95 shadow-md hover:shadow-lg'
  }`;
  
  const submitButtonClass = `w-16 h-[136px] text-lg font-bold rounded-lg transition-all duration-200 flex items-center justify-center ${
    disabled || isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
    'bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-md hover:shadow-lg'
  }`;
  
  return (
    <div className={`grid grid-cols-4 grid-rows-4 gap-3 max-w-xs mx-auto ${className}`}>
      {/* 第一行：1 2 3 删除 */}
      <button className={buttonClass} onClick={() => onNumberClick(1)} disabled={disabled}>1</button>
      <button className={buttonClass} onClick={() => onNumberClick(2)} disabled={disabled}>2</button>
      <button className={buttonClass} onClick={() => onNumberClick(3)} disabled={disabled}>3</button>
      <button
        className={`w-16 h-16 text-lg font-bold rounded-lg transition-all duration-200 flex items-center justify-center ${
          disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
          'bg-orange-100 text-orange-600 hover:bg-orange-200 active:scale-95 shadow-md hover:shadow-lg'
        }`}
        onClick={onDelete}
        disabled={disabled}
      >
        删除
      </button>

      {/* 第二行：4 5 6 提交(起始) */}
      <button className={buttonClass} onClick={() => onNumberClick(4)} disabled={disabled}>4</button>
      <button className={buttonClass} onClick={() => onNumberClick(5)} disabled={disabled}>5</button>
      <button className={buttonClass} onClick={() => onNumberClick(6)} disabled={disabled}>6</button>
      {/* 提交按钮占两行（第二、三行） */}
      <button className={submitButtonClass} onClick={handleSubmit} disabled={disabled || isSubmitting} style={{ gridRow: '2 / span 2' }}>
        {isSubmitting ? '提交中...' : '提交'}
      </button>

      {/* 第三行：7 8 9 提交(同一按钮继续占位) */}
      <button className={buttonClass} onClick={() => onNumberClick(7)} disabled={disabled}>7</button>
      <button className={buttonClass} onClick={() => onNumberClick(8)} disabled={disabled}>8</button>
      <button className={buttonClass} onClick={() => onNumberClick(9)} disabled={disabled}>9</button>

      {/* 第四行：0 在 8 的正下方（第二列） */}
      <div></div>
      <button className={buttonClass} onClick={() => onNumberClick(0)} disabled={disabled} style={{ gridColumn: 2 }}>0</button>
      <div></div>
      <div></div>
    </div>
  );
};



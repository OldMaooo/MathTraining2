import { useState, useEffect } from 'react';

interface ComboProps {
  count: number;
  className?: string;
}

export const Combo: React.FC<ComboProps> = ({ count, className = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [count]);
  
  if (count === 0) return null;
  
  return (
    <div className={`text-center ${className}`}>
      <div
        className={`inline-block px-4 py-2 rounded-full text-white font-bold text-lg transition-all duration-300 ${
          isAnimating ? 'scale-110 animate-pulse' : 'scale-100'
        } ${
          count >= 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
          count >= 5 ? 'bg-gradient-to-r from-green-400 to-blue-500' :
          'bg-gradient-to-r from-blue-400 to-purple-500'
        }`}
      >
        🔥 {count} 连击！
      </div>
    </div>
  );
};



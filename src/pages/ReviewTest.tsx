import React from 'react';

interface ReviewTestProps {
  onRestart: () => void;
}

export const ReviewTest: React.FC<ReviewTestProps> = ({ onRestart }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          测试页面 - Review组件
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          这是一个简化的Review组件，用于测试是否正常渲染。
        </p>
        <button
          onClick={onRestart}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
        >
          重新开始
        </button>
      </div>
    </div>
  );
};

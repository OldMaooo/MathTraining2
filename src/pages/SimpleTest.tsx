import React from 'react';

export const SimpleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
        🎉 简单测试页面
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        如果你能看到这个页面，说明React应用正常运行！
      </p>
      <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200">
          ✅ React 组件渲染正常<br/>
          ✅ Tailwind CSS 样式正常<br/>
          ✅ 深色模式支持正常
        </p>
      </div>
    </div>
  );
};
















import React from 'react';
import { TopNavigation } from '../components/TopNavigation';

export const HeaderTest: React.FC = () => {
  const handleNavigate = (page: string) => {
    console.log('Navigate to:', page);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TopNavigation onNavigate={handleNavigate} />
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          头部组件测试页面
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          如果你能看到这个页面，说明头部组件加载成功！
        </p>
      </div>
    </div>
  );
};




import React from 'react';

const AppMinimal: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1>AppMinimal - 最简测试</h1>
      <p>如果你能看到这个页面，说明基本React功能正常。</p>
      <p>当前时间: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default AppMinimal;




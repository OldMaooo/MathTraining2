import React, { useState } from 'react';

function AppSimple() {
  const [currentState, setCurrentState] = useState('start');

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <h1>计算挑战赛 - 简化版</h1>
      <p>当前状态: {currentState}</p>
      <button onClick={() => setCurrentState('learning-path')}>
        进入学习路径
      </button>
      {currentState === 'learning-path' && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h2>学习路径页面</h2>
          <p>如果你能看到这个页面，说明路由正常工作。</p>
          <button onClick={() => setCurrentState('start')}>
            返回首页
          </button>
        </div>
      )}
    </div>
  );
}

export default AppSimple;











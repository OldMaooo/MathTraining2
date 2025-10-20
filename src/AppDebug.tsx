import React, { useState } from 'react';
import LearningPathDebug from './pages/LearningPathDebug';

type AppState = 'start' | 'learning-path';

function AppDebug() {
  const [currentState, setCurrentState] = useState<AppState>('start');

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <h1>计算挑战赛 - 调试版</h1>
      <p>当前状态: {currentState}</p>
      <button onClick={() => setCurrentState('learning-path')}>
        进入学习路径
      </button>
      {currentState === 'learning-path' && <LearningPathDebug />}
    </div>
  );
}

export default AppDebug;

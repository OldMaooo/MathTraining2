import { useState, useEffect } from 'react';
import { Start } from './pages/Start';
// import { StartTailwindTest } from './pages/StartTailwindTest';
// import { Play } from './pages/Play';
import { PlaySimple } from './pages/PlaySimple';
import { Review } from './pages/Review';
// import { ReviewTest } from './pages/ReviewTest';
// import { TestComponent } from './pages/TestComponent';
import { History } from './pages/History';
import { WrongQuestions } from './pages/WrongQuestions';
import { AddRecord } from './pages/AddRecord';
import LearningPath from './pages/LearningPath';
// import LevelDetail from './pages/LevelDetail';
import LevelResult from './pages/LevelResult';
import ParentDashboard from './pages/ParentDashboard';
// import { HeaderTest } from './pages/HeaderTest';
// import { SimpleTest } from './pages/SimpleTest';
// import { MinimalTest } from './pages/MinimalTest';
import { TopNavigation } from './components/TopNavigation';
// import { ToastContainer } from './components/ToastContainer';
import { ThemeProvider } from './contexts/ThemeContext';

type AppState = 'start' | 'play' | 'review' | 'test' | 'history' | 'wrong-questions' | 'add-record' | 'learning-path' | 'level-detail' | 'level-result' | 'parent-dashboard' | 'header-test' | 'simple-test' | 'minimal-test';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('start');
  const [levelData, setLevelData] = useState<{
    levelId: string;
    time: number;
    accuracy: number;
  } | null>(null);

  // 监听从挑战页进入关卡详情
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const levelId = e?.detail?.levelId || localStorage.getItem('mp-current-level-id') || '';
        setLevelData({ levelId, time: 0, accuracy: 0 });
        setCurrentState('level-detail');
      } catch {}
    };
    window.addEventListener('go-level-detail' as any, handler);
    return () => window.removeEventListener('go-level-detail' as any, handler);
  }, []);

  const handleStart = () => {
    setCurrentState('play');
  };

  const handleFinish = () => {
    // 从本地读取最近一次成绩以便进入关卡结算页
    try {
      const levelId = localStorage.getItem('mp-current-level-id') || '';
      const lastTime = parseFloat(localStorage.getItem('mp-last-time') || '0');
      const lastAccuracy = parseFloat(localStorage.getItem('mp-last-accuracy') || '0');
      setLevelData({ levelId, time: isFinite(lastTime) ? lastTime : 0, accuracy: isFinite(lastAccuracy) ? lastAccuracy : 0 });
      setCurrentState('level-result');
    } catch {
      setCurrentState('review');
    }
  };

  const handleExit = () => {
    setCurrentState('start');
  };


  const handleRestart = () => {
    // 直接开始新的一轮，保持当前设置
    setCurrentState('play');
  };

  const handleTest = () => {
    setCurrentState('test');
  };

  const handleBack = () => {
    setCurrentState('start');
  };
  const handleHistory = () => {
    setCurrentState('history');
  };

  const handleWrongQuestions = () => {
    setCurrentState('wrong-questions');
  };

  const handleAddRecord = () => {
    setCurrentState('add-record');
  };

  const handleHeaderTest = () => {
    setCurrentState('header-test');
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      setCurrentState('start');
    } else {
      setCurrentState(page as AppState);
    }
  };

  // 允许在任意页面通过事件进入历史页（供Review链接使用）
  window.addEventListener('go-history' as any, () => handleHistory());
  // 允许在任意页面通过事件进入错题管理页
  window.addEventListener('go-wrong-questions' as any, () => handleWrongQuestions());
  // 允许在任意页面通过事件进入添加纪录页
  window.addEventListener('go-add-record' as any, () => handleAddRecord());
  // 允许在任意页面通过事件回到首页
  window.addEventListener('go-home' as any, () => setCurrentState('start'));
  // 直接开始新的一轮练习（保持当前设置）
  window.addEventListener('start-new-round' as any, () => {
    setCurrentState('play');
  });
  // 从历史"汇总"一键生成练习
  window.addEventListener('start-wrong-practice' as any, () => {
    setCurrentState('play');
  });

  
  
  return (
    <ThemeProvider>
      <div className="App">
        <TopNavigation onNavigate={handleNavigate} />
        {currentState === 'start' && <Start onStart={handleStart} />}
        {currentState === 'play' && <PlaySimple onFinish={handleFinish} onExit={handleExit} />}
        {currentState === 'review' && <Review onRestart={handleRestart} />}
        {currentState === 'history' && <History onBack={handleBack} />}
        {currentState === 'wrong-questions' && <WrongQuestions onBack={handleBack} />}
        {currentState === 'add-record' && <AddRecord onBack={handleBack} />}
        {currentState === 'learning-path' && <LearningPath />}
        {/* {currentState === 'level-detail' && levelData && (
          <LevelDetail
            levelId={levelData.levelId}
            onBack={() => setCurrentState('learning-path')}
            onStart={(levelId) => {
              setLevelData({ levelId, time: 0, accuracy: 0 });
              setCurrentState('play');
            }}
          />
        )} */}
        {currentState === 'level-result' && levelData && (
          <LevelResult
            levelId={levelData.levelId}
            time={levelData.time}
            accuracy={levelData.accuracy}
            onBack={() => setCurrentState('learning-path')}
            onRestart={() => {
              setCurrentState('play');
            }}
            onNext={() => {
              setCurrentState('learning-path');
            }}
          />
        )}
        {currentState === 'parent-dashboard' && (
          <ParentDashboard onBack={() => setCurrentState('learning-path')} />
        )}
        {currentState === 'header-test' && <div>Header Test page coming soon...</div>}
        {currentState === 'simple-test' && <div>Simple Test page coming soon...</div>}
        {currentState === 'minimal-test' && <div>Minimal Test page coming soon...</div>}
      </div>
    </ThemeProvider>
  );
}

export default App;
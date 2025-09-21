import { useState } from 'react';
import { Start } from './pages/Start';
import { Play } from './pages/Play';
import { PlaySimple } from './pages/PlaySimple';
import { Review } from './pages/Review';
import { TestComponent } from './pages/TestComponent';
import { History } from './pages/History';
import { WrongQuestions } from './pages/WrongQuestions';
import { AddRecord } from './pages/AddRecord';

type AppState = 'start' | 'play' | 'review' | 'test' | 'history' | 'wrong-questions' | 'add-record';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('start');

  const handleStart = () => {
    setCurrentState('play');
  };

  const handleFinish = () => {
    setCurrentState('review');
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
    <div className="App">
      {currentState === 'start' && <Start onStart={handleStart} onTest={handleTest} onHistory={handleHistory} onWrongQuestions={handleWrongQuestions} />}
      {currentState === 'play' && <PlaySimple onFinish={handleFinish} onExit={handleExit} />}
      {currentState === 'review' && <Review onRestart={handleRestart} />}
      {currentState === 'test' && <TestComponent onBack={handleBack} />}
      {currentState === 'history' && <History onBack={handleBack} />}
      {currentState === 'wrong-questions' && <WrongQuestions onBack={handleBack} />}
      {currentState === 'add-record' && <AddRecord onBack={handleBack} />}
    </div>
  );
}

export default App;
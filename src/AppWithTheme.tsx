import React from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const ThemeTestContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ padding: '20px', backgroundColor: theme === 'light' ? '#f0f0f0' : '#333', color: theme === 'light' ? '#000' : '#fff' }}>
      <h1>AppWithTheme - 测试ThemeProvider</h1>
      <p>当前主题: {theme}</p>
      <button onClick={toggleTheme}>切换主题</button>
      <p>如果你能看到这个页面，说明ThemeProvider正常工作。</p>
    </div>
  );
};

const AppWithTheme: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemeTestContent />
    </ThemeProvider>
  );
};

export default AppWithTheme;
















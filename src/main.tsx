import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('main.tsx loaded');

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>JavaScript 错误</h1>
        <p>错误: ${event.error?.message || 'Unknown error'}</p>
        <p>文件: ${event.filename}:${event.lineno}:${event.colno}</p>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Promise 错误</h1>
        <p>错误: ${event.reason}</p>
      </div>
    `;
  }
});

try {
  console.log('Getting root element...');
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Creating React root...');
  const root = createRoot(rootElement);
  console.log('Root created:', root);
  
  console.log('About to render React app...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error in main.tsx:', error);
  console.error('React 加载失败:', error.message);
  
  // 在页面上显示错误信息
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>React 加载失败</h1>
        <p>错误: ${error.message}</p>
        <p>请检查控制台获取更多信息</p>
      </div>
    `;
  }
}

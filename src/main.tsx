import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('main.tsx loaded');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  console.log('Root created:', root);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('React app rendered');
} catch (error) {
  console.error('Error in main.tsx:', error);
  // 不要覆盖root元素，只在控制台显示错误
  console.error('React 加载失败:', error.message);
}

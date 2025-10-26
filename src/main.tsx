import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

console.log('=== main.tsx 开始加载 ===');

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
  
  console.log('React render completed');
} catch (error) {
  console.error('Error in main.tsx:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ffebee; color: #c62828; font-family: Arial, sans-serif;">
      <h1>React错误</h1>
      <p>${errorMessage}</p>
      <pre>${errorStack}</pre>
    </div>
  `;
}

console.log('=== main.tsx 加载完成 ===');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('main-test.tsx loaded');

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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#333', marginBottom: '1rem' }}>
            🎯 直接渲染测试
          </h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            如果你能看到这个页面，说明React正常工作
          </p>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>
            时间: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </StrictMode>
  );
  
  console.log('Render completed');
} catch (error) {
  console.error('Error in main-test.tsx:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ffebee; color: #c62828; font-family: Arial, sans-serif;">
      <h1>错误</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}



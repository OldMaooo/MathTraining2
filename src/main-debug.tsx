import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

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
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <h1>React 测试</h1>
        <p>如果你能看到这个，说明React正常工作。</p>
        <button onClick={() => alert('按钮点击成功！')}>
          点击测试
        </button>
      </div>
    </StrictMode>
  );
  
  console.log('React app rendered');
} catch (error) {
  console.error('Error in main.tsx:', error);
  document.getElementById('root')!.innerHTML = '<h1 style="color: red;">React 加载失败: ' + error.message + '</h1>';
}

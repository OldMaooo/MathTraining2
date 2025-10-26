console.log('=== main-debug.tsx 开始加载 ===');

// 检查React是否可用
try {
  const React = await import('react');
  console.log('React 导入成功:', React);
} catch (error) {
  console.error('React 导入失败:', error);
}

// 检查ReactDOM是否可用
try {
  const ReactDOM = await import('react-dom/client');
  console.log('ReactDOM 导入成功:', ReactDOM);
} catch (error) {
  console.error('ReactDOM 导入失败:', error);
}

console.log('=== 开始渲染 ===');

// 直接使用React.createElement而不是JSX
const { StrictMode } = await import('react');
const { createRoot } = await import('react-dom/client');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  console.log('Root created:', root);
  
  const element = StrictMode({}, 
    React.createElement('div', {
      style: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }
    }, 
      React.createElement('div', {
        style: {
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }
      },
        React.createElement('h1', { style: { color: '#333', marginBottom: '1rem' } }, '🎯 调试测试页面'),
        React.createElement('p', { style: { color: '#666', marginBottom: '1rem' } }, '如果你能看到这个页面，说明React正常工作'),
        React.createElement('p', { style: { color: '#999', fontSize: '0.9rem' } }, `时间: ${new Date().toLocaleString()}`)
      )
    )
  );
  
  root.render(element);
  console.log('Render completed');
} catch (error) {
  console.error('Error in main-debug.tsx:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ffebee; color: #c62828; font-family: Arial, sans-serif;">
      <h1>错误</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}

console.log('=== main-debug.tsx 加载完成 ===');
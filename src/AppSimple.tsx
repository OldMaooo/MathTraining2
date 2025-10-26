import React from 'react';

const AppSimple: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          🎯 计算挑战赛
        </h1>
        <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
          如果你能看到这个页面，说明React应用正常运行
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => {
              try {
                localStorage.setItem('questionType', 'addition');
                localStorage.setItem('range', '10');
                localStorage.setItem('questionCount', '10');
                localStorage.setItem('timeLimit', '5');
                localStorage.setItem('mp-current-level-id', 'test-level');
                window.dispatchEvent(new Event('start-new-round' as any));
              } catch (error) {
                console.error('Error starting test:', error);
              }
            }}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            开始挑战
          </button>
          <button 
            onClick={() => {
              try {
                window.dispatchEvent(new Event('go-learning-path' as any));
              } catch (error) {
                console.error('Error navigating to learning path:', error);
              }
            }}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            学习路径
          </button>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>
          当前时间: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AppSimple;
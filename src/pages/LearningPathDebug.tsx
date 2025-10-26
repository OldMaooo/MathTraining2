import React from 'react';

const LearningPathDebug: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          🏰 学习路径调试页面
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          如果你能看到这个页面，说明React应用正常运行
        </p>
        <div style={{ marginTop: '2rem' }}>
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
              cursor: 'pointer'
            }}
          >
            测试开始挑战
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPathDebug;
import React from 'react';

const AppMinimal: React.FC = () => {
  return (
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
          🎯 测试页面
        </h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          如果你能看到这个页面，说明React正常工作
        </p>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          时间: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AppMinimal;
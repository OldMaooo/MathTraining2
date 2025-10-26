import React from 'react';

const LearningPathSimple: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          marginBottom: '2rem',
          color: '#2c3e50'
        }}>
          🏰 学习路径
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          fontSize: '1.2rem', 
          color: '#7f8c8d',
          marginBottom: '3rem'
        }}>
          根据题型.md设计的循序渐进学习路径
        </p>

        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '15px 15px 0 0',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
              基础数感训练
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
              Level 0-1: 建立数感基础，掌握凑十法
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0 0 15px 15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div
              onClick={() => {
                try {
                  localStorage.setItem('questionType', 'mixed');
                  localStorage.setItem('range', '9');
                  localStorage.setItem('questionCount', '20');
                  localStorage.setItem('timeLimit', '60');
                  localStorage.setItem('mp-current-level-id', 'level-0-basic-number-sense');
                  window.dispatchEvent(new Event('start-new-round' as any));
                } catch (error) {
                  console.error('Error starting level:', error);
                }
              }}
              style={{
                padding: '1.5rem',
                border: '3px solid #4CAF50',
                borderRadius: '12px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔓</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                基础数感 (1-9)
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d', margin: '0 0 1rem 0' }}>
                1-9的加减能瞬间反应，不思考
              </p>
              <div style={{ fontSize: '1.2rem', color: '#f39c12', fontWeight: 'bold' }}>
                ⭐⭐⭐
              </div>
            </div>
            
            <div style={{
              padding: '1.5rem',
              border: '3px solid #FFC107',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                凑十基础
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d', margin: '0 0 1rem 0' }}>
                掌握凑成10的组合，6-9与任一数
              </p>
              <p style={{ fontSize: '0.8rem', color: '#FFC107', margin: 0 }}>
                需要完成前置关卡
              </p>
            </div>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            🎯 学习目标
          </h3>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
            通过系统化的训练，从基础数感到高级运算技巧，逐步提升计算速度和准确性！
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningPathSimple;
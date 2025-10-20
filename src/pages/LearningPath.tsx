import React from 'react';

const LearningPath: React.FC = () => {
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
          像多邻国一样，一步步掌握数学技能！
        </p>

        {/* 基础运算王国 */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '15px 15px 0 0',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
              基础运算王国
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
              10-20以内的加减法
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
                  localStorage.setItem('questionType', 'carry'); // 进位加法
                  localStorage.setItem('range', '10');
                  localStorage.setItem('questionCount', '10');
                  localStorage.setItem('timeLimit', '5');
                  localStorage.setItem('mp-current-level-id', 'add-within-10');
                  window.dispatchEvent(new Event('start-new-round' as any));
                } catch {}
              }}
              style={{
              padding: '1.5rem',
              border: '3px solid #4CAF50',
              borderRadius: '12px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⭐</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                10以内加法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d', margin: '0 0 1rem 0' }}>
                掌握基础加法
              </p>
              <div style={{ fontSize: '1.2rem', color: '#f39c12', fontWeight: 'bold' }}>
                ⭐⭐⭐
              </div>
            </div>
            
            <div
              onClick={() => {
                try {
                  localStorage.setItem('questionType', 'borrow'); // 退位减法
                  localStorage.setItem('range', '10');
                  localStorage.setItem('questionCount', '10');
                  localStorage.setItem('timeLimit', '5');
                  localStorage.setItem('mp-current-level-id', 'sub-within-10');
                  window.dispatchEvent(new Event('start-new-round' as any));
                } catch {}
              }}
              style={{
              padding: '1.5rem',
              border: '3px solid #4CAF50',
              borderRadius: '12px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⭐</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                10以内减法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d', margin: '0 0 1rem 0' }}>
                掌握基础减法
              </p>
              <div style={{ fontSize: '1.2rem', color: '#f39c12', fontWeight: 'bold' }}>
                ⭐⭐☆
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
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔓</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                20以内加法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d', margin: '0 0 1rem 0' }}>
                进阶加法运算
              </p>
              <button onClick={() => {
                try {
                  localStorage.setItem('questionType', 'carry');
                  localStorage.setItem('range', '20');
                  localStorage.setItem('questionCount', '15');
                  localStorage.setItem('timeLimit', '5');
                  localStorage.setItem('mp-current-level-id', 'add-within-20');
                  window.dispatchEvent(new Event('start-new-round' as any));
                } catch {}
              }} style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '0.8rem 1.5rem',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                开始挑战
              </button>
            </div>
            
            <div style={{
              padding: '1.5rem',
              border: '3px solid #9E9E9E',
              borderRadius: '12px',
              textAlign: 'center',
              opacity: 0.6,
              cursor: 'not-allowed'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#9E9E9E' }}>
                20以内减法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#9E9E9E', margin: '0 0 1rem 0' }}>
                进阶减法运算
              </p>
            </div>
          </div>
        </div>

        {/* 进位退位王国 */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '15px 15px 0 0',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
              进位退位王国
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
              20-50以内的加减法
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
            <div style={{
              padding: '1.5rem',
              border: '3px solid #9E9E9E',
              borderRadius: '12px',
              textAlign: 'center',
              opacity: 0.6,
              cursor: 'not-allowed'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#9E9E9E' }}>
                进位加法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#9E9E9E', margin: '0 0 1rem 0' }}>
                掌握进位技巧
              </p>
            </div>
            
            <div style={{
              padding: '1.5rem',
              border: '3px solid #9E9E9E',
              borderRadius: '12px',
              textAlign: 'center',
              opacity: 0.6,
              cursor: 'not-allowed'
            }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: '#9E9E9E' }}>
                退位减法
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#9E9E9E', margin: '0 0 1rem 0' }}>
                掌握退位技巧
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
            通过系统化的训练，逐步提升计算速度和准确性，成为数学小能手！
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
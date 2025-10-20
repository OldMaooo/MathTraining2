import React from 'react';

function AppTest() {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <h1>计算挑战赛 - 测试版本</h1>
      <p>如果你能看到这个页面，说明 React 应用正常运行。</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>🏰 学习路径</h2>
        <p>像多邻国一样，一步步掌握数学技能！</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #4CAF50' }}>
            <h3>基础运算王国</h3>
            <p>10-20以内的加减法</p>
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', flex: 1 }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>⭐</div>
                  <div style={{ fontSize: '14px', textAlign: 'center' }}>10以内加法</div>
                  <div style={{ fontSize: '12px', textAlign: 'center', color: '#f39c12' }}>⭐⭐⭐</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', flex: 1 }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>⭐</div>
                  <div style={{ fontSize: '14px', textAlign: 'center' }}>10以内减法</div>
                  <div style={{ fontSize: '12px', textAlign: 'center', color: '#f39c12' }}>⭐⭐☆</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>🔓</div>
                  <div style={{ fontSize: '14px', textAlign: 'center' }}>20以内加法</div>
                  <button style={{ width: '100%', padding: '5px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}>
                    开始挑战
                  </button>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', flex: 1, opacity: 0.6 }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>🔒</div>
                  <div style={{ fontSize: '14px', textAlign: 'center', color: '#9E9E9E' }}>20以内减法</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #2196F3' }}>
            <h3>进位退位王国</h3>
            <p>20-50以内的加减法</p>
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', flex: 1, opacity: 0.6 }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>🔒</div>
                  <div style={{ fontSize: '14px', textAlign: 'center', color: '#9E9E9E' }}>进位加法</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', flex: 1, opacity: 0.6 }}>
                  <div style={{ fontSize: '20px', textAlign: 'center' }}>🔒</div>
                  <div style={{ fontSize: '14px', textAlign: 'center', color: '#9E9E9E' }}>退位减法</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppTest;
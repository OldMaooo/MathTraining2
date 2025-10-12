import React from 'react';

export const MinimalTest: React.FC = () => {
  console.log('MinimalTest component rendering');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: '#333' }}>Minimal Test</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
};




import React, { useState, useEffect } from 'react';
import { LearningPathService } from '../services/learningPathService';
import { useTheme } from '../contexts/ThemeContext';

const LearningPath: React.FC = () => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    try {
      const service = LearningPathService.getInstance();
      const chaptersData = service.getChapters();
      console.log('📚 加载的章节数据:', chaptersData);
      console.log('📚 章节数量:', chaptersData?.length || 0);
      setChapters(chaptersData || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load learning path data:', error);
      setChapters([]);
      setLoading(false);
    }
  }, []);

  const handleLevelClick = (level: any) => {
    try {
      console.log('🎯 点击关卡:', level.name, 'operations:', level.difficulty.operations);
      
      // 根据关卡ID确定questionType
      let questionType = 'carry'; // 默认进位加法
      
      if (level.id === 'level-0-basic-number-sense') {
        // Level 0: 基础数感 - 混合运算（加减混合）
        questionType = 'mixed';
      } else if (level.id === 'level-1-make-ten') {
        // Level 1: 凑十基础 - 纯加法（进位加法）
        questionType = 'carry';
      } else if (level.id === 'level-2-single-digit-no-carry') {
        // Level 2: 一位数运算(无进位) - 混合运算
        questionType = 'mixed';
      } else if (level.id === 'level-3-single-digit-with-carry') {
        // Level 3: 一位数运算(有进位) - 混合运算
        questionType = 'mixed';
      } else if (level.id === 'level-4-double-digit-no-carry') {
        // Level 4: 两位数运算(无跨十) - 混合运算
        questionType = 'mixed';
      } else if (level.id === 'level-5-double-digit-single-carry') {
        // Level 5: 两位数运算(单处进位) - 混合运算
        questionType = 'mixed';
      } else if (level.id === 'level-6-double-digit-multiple-carry') {
        // Level 6: 两位数运算(多处进位) - 混合运算
        questionType = 'mixed';
      } else if (level.id === 'level-7-triple-operations') {
        // Level 7: 三数运算/混合步骤 - 真正的加减混合
        questionType = 'mixed';
      }

      console.log('🎯 设置的questionType:', questionType);

      // 检查是否有家长自定义配置
      const savedConfigs = localStorage.getItem('mp-level-configs');
      let customConfig = null;
      if (savedConfigs) {
        const configs = JSON.parse(savedConfigs);
        customConfig = configs.find((config: any) => config.id === level.id);
      }

      // 根据范围设置参数（优先使用家长配置）
      const range = level.difficulty.range;
      let rangeValue = 10;
      if (range.includes('1-9')) rangeValue = 9;
      else if (range.includes('1-18')) rangeValue = 18;
      else if (range.includes('1-99')) rangeValue = 99;
      else if (range.includes('1-199')) rangeValue = 199;

      // 设置localStorage参数（使用家长配置或默认值）
      localStorage.setItem('questionType', customConfig?.questionType || questionType);
      localStorage.setItem('range', (customConfig?.range || rangeValue).toString());
      localStorage.setItem('questionCount', (customConfig?.questionCount || 3).toString()); // 临时改为3题以便测试
      localStorage.setItem('timeLimit', (customConfig?.timeLimit || 300).toString()); // 设置为300秒（5分钟）以便测试
      localStorage.setItem('mp-current-level-id', level.id);
      
      console.log('🎯 localStorage设置完成:', {
        questionType,
        range: rangeValue,
        questionCount: level.questionCount
      });
      
      window.dispatchEvent(new Event('start-new-round' as any));
    } catch (error) {
      console.error('Failed to start level:', error);
    }
  };

  const getLevelStatus = (level: any) => {
    const service = LearningPathService.getInstance();
    const unlockStatus = service.checkUnlockStatus(level.id);
    const progress = service.getLevelProgress(level.id);
    
    if (!unlockStatus.isUnlocked) {
      return { status: 'locked', stars: 0 };
    }
    
    if (!progress) {
      return { status: 'available', stars: 0 };
    }
    
    const stars = (progress.stars.bronze ? 1 : 0) + 
                  (progress.stars.silver ? 1 : 0) + 
                  (progress.stars.gold ? 1 : 0);
    
    return { status: 'completed', stars };
  };

  const getStarDisplay = (stars: number) => {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'locked': return '🔒';
      case 'available': return '🔓';
      case 'completed': return '✅';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked': return '#9E9E9E';
      case 'available': return '#FFC107';
      case 'completed': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#7f8c8d' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
      padding: '20px',
      overflow: 'visible' // 确保内容不被隐藏
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          marginBottom: '2rem',
          color: theme === 'dark' ? '#ffffff' : '#2c3e50'
        }}>
          🏰 学习路径
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          fontSize: '1.2rem', 
          color: theme === 'dark' ? '#b0b0b0' : '#7f8c8d',
          marginBottom: '3rem'
        }}>
          根据题型.md设计的循序渐进学习路径
        </p>

        {console.log('🎯 渲染章节:', chapters.length, '个章节')}
        {chapters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
            <h3>⚠️ 没有找到章节数据</h3>
            <p>请检查控制台错误信息</p>
          </div>
        )}
        {chapters.map((chapter, chapterIndex) => {
          console.log(`📖 章节 ${chapterIndex + 1}:`, chapter.name, '关卡数:', chapter.levels?.length || 0);
          return (
            <div key={chapter.id} style={{ marginBottom: '3rem' }}>
            <div style={{
              backgroundColor: chapterIndex === 0 ? '#4CAF50' : 
                             chapterIndex === 1 ? '#2196F3' : 
                             chapterIndex === 2 ? '#FF9800' : '#9C27B0',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '15px 15px 0 0',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                {chapter.name}
              </h2>
              <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
                {chapter.description}
              </p>
            </div>
            
            <div style={{
              backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white',
              padding: '2rem',
              borderRadius: '0 0 15px 15px',
              boxShadow: theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {chapter.levels.map((level: any) => {
                const levelStatus = getLevelStatus(level);
                const isClickable = levelStatus.status !== 'locked';
                
                return (
                  <div
                    key={level.id}
                    onClick={() => isClickable && handleLevelClick(level)}
                    style={{
                      padding: '1.5rem',
                      border: `3px solid ${getStatusColor(levelStatus.status)}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                      backgroundColor: levelStatus.status === 'locked' 
                        ? (theme === 'dark' ? '#1a1a1a' : '#f5f5f5') 
                        : (theme === 'dark' ? '#3d3d3d' : '#f8f9fa'),
                      cursor: isClickable ? 'pointer' : 'not-allowed',
                      opacity: levelStatus.status === 'locked' ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>
                      {getStatusIcon(levelStatus.status)}
                    </div>
                    <h3 style={{ 
                      fontSize: '1.3rem', 
                      margin: '0 0 0.5rem 0', 
                      color: levelStatus.status === 'locked' 
                        ? '#9E9E9E' 
                        : (theme === 'dark' ? '#ffffff' : '#2c3e50')
                    }}>
                      {level.name}
                    </h3>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: levelStatus.status === 'locked' 
                        ? '#9E9E9E' 
                        : (theme === 'dark' ? '#b0b0b0' : '#7f8c8d'), 
                      margin: '0 0 1rem 0' 
                    }}>
                      {level.content}
                    </p>
                    <div style={{ 
                      fontSize: '1.2rem', 
                      color: '#f39c12', 
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      {getStarDisplay(levelStatus.stars)}
                    </div>
                    {levelStatus.status === 'locked' && (
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#9E9E9E',
                        margin: 0
                      }}>
                        需要完成前置关卡
                      </p>
                    )}
                    {levelStatus.status === 'available' && (
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#FFC107',
                        margin: 0
                      }}>
                        点击开始挑战
                      </p>
                    )}
                    {levelStatus.status === 'completed' && (
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#4CAF50',
                        margin: 0
                      }}>
                        已完成 {levelStatus.stars}/3 星
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
        
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white',
          borderRadius: '15px',
          boxShadow: theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: theme === 'dark' ? '#ffffff' : '#2c3e50', 
            marginBottom: '1rem' 
          }}>
            🎯 学习目标
          </h3>
          <p style={{ 
            color: theme === 'dark' ? '#b0b0b0' : '#7f8c8d', 
            fontSize: '1.1rem' 
          }}>
            通过系统化的训练，从基础数感到高级运算技巧，逐步提升计算速度和准确性！
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
import React, { useState, useEffect } from 'react';
import { AccountService } from '../services/accountService';
import { GamificationService } from '../services/gamificationService';
import { CloudStore } from '../services/cloudStore';

interface CloudSyncDebugInfo {
  timestamp: string;
  accountId: string;
  accountName: string;
  cloudAccountId: string | null;
  localProfile: any;
  cloudProfile: any;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
  localStorageData: any;
}

export const CloudSyncDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<CloudSyncDebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // 捕获控制台日志
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[CloudSync]')) {
        setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${args.join(' ')}`]);
      }
    };
    
    console.error = (...args) => {
      originalError(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[CloudSync]')) {
        setLogs(prev => [...prev.slice(-9), `ERROR ${new Date().toLocaleTimeString()}: ${args.join(' ')}`]);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // 自动调试 - 组件加载时自动收集信息
  useEffect(() => {
    const autoDebug = async () => {
      console.log('[CloudSync] 自动调试开始...');
      await collectDebugInfo();
      console.log('[CloudSync] 自动调试完成');
    };
    
    // 延迟1秒后自动调试，确保页面完全加载
    const timer = setTimeout(autoDebug, 1000);
    return () => clearTimeout(timer);
  }, []);

  const collectDebugInfo = async () => {
    try {
      const accountService = AccountService.getInstance();
      const currentAccount = accountService.getCurrentAccount();
      
      if (!currentAccount) {
        setDebugInfo({
          timestamp: new Date().toISOString(),
          accountId: 'none',
          accountName: 'none',
          cloudAccountId: null,
          localProfile: null,
          cloudProfile: null,
          syncStatus: 'error',
          errorMessage: 'No current account',
          localStorageData: null
        });
        return;
      }

      // 获取本地数据
      const localProfile = JSON.parse(localStorage.getItem(`mp-profile_${currentAccount.id}`) || '{}');
      const questionLogs = JSON.parse(localStorage.getItem('mp-question-logs') || '[]');
      const localStorageData = {
        'mp-cloud-sync': localStorage.getItem('mp-cloud-sync'),
        'mp-accounts': localStorage.getItem('mp-accounts'),
        'mp-current-account': localStorage.getItem('mp-current-account'),
        'mp-profile': localStorage.getItem(`mp-profile_${currentAccount.id}`),
        'mp-wrong-questions': localStorage.getItem('mp-wrong-questions'),
        'mp-question-logs': localStorage.getItem('mp-question-logs')
      };

      console.log('[CloudSync] 调试信息收集 - 本地数据:', {
        accountId: currentAccount.id,
        accountName: currentAccount.name,
        localProfile,
        questionLogsCount: questionLogs.length,
        latestQuestionLog: questionLogs[questionLogs.length - 1],
        cloudSyncEnabled: localStorage.getItem('mp-cloud-sync')
      });

      let cloudAccountId: string | null = null;
      let cloudProfile: any = null;
      let syncStatus: 'success' | 'error' | 'pending' = 'pending';
      let errorMessage: string | undefined;

      try {
        if (localStorage.getItem('mp-cloud-sync') === '1') {
          const cloudStore = CloudStore.getInstance();
          const passwordHash = btoa(encodeURIComponent(currentAccount.name + '_password'));
          cloudAccountId = await cloudStore.ensureAccount(currentAccount.name, passwordHash, currentAccount.type);
          
          const { data: profile, error } = await cloudStore.supabase
            .from('profiles')
            .select('*')
            .eq('account_id', cloudAccountId)
            .limit(1)
            .maybeSingle();
          
          if (error) {
            syncStatus = 'error';
            errorMessage = error.message;
          } else {
            cloudProfile = profile;
            syncStatus = 'success';
          }
        } else {
          syncStatus = 'error';
          errorMessage = 'Cloud sync not enabled';
        }
      } catch (error) {
        syncStatus = 'error';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }

      setDebugInfo({
        timestamp: new Date().toISOString(),
        accountId: currentAccount.id,
        accountName: currentAccount.name,
        cloudAccountId,
        localProfile,
        cloudProfile,
        syncStatus,
        errorMessage,
        localStorageData
      });
    } catch (error) {
      console.error('Failed to collect debug info:', error);
    }
  };

  const testSync = async () => {
    try {
      await GamificationService.getInstance().syncFromCloud();
      await collectDebugInfo();
    } catch (error) {
      console.error('Sync test failed:', error);
    }
  };

  const clearLocalData = () => {
    if (confirm('确定要清除所有本地数据吗？这将删除所有练习记录和设置。')) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mp-')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        WebkitTransform: 'translateX(-50%)', // Safari兼容性
        zIndex: 9999,
        background: '#ff6b6b',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }} onClick={() => setIsVisible(true)}>
        🔧 CloudSync Debug
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      WebkitTransform: 'translate(-50%, -50%)', // Safari兼容性
      width: '500px',
      maxHeight: '80vh',
      background: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🔧 CloudSync Debugger</h3>
        <button onClick={() => setIsVisible(false)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button onClick={collectDebugInfo} style={{ marginRight: '8px', padding: '8px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔍 收集信息
        </button>
        <button onClick={testSync} style={{ marginRight: '8px', padding: '8px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔄 测试同步
        </button>
        <button onClick={clearLocalData} style={{ padding: '8px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🗑️ 清除数据
        </button>
      </div>

      {debugInfo && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>调试信息</h4>
          <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
            <div><strong>时间:</strong> {debugInfo.timestamp}</div>
            <div><strong>账号ID:</strong> {debugInfo.accountId}</div>
            <div><strong>账号名:</strong> {debugInfo.accountName}</div>
            <div><strong>云端账号ID:</strong> {debugInfo.cloudAccountId || 'N/A'}</div>
            <div><strong>同步状态:</strong> 
              <span style={{ 
                color: debugInfo.syncStatus === 'success' ? 'green' : debugInfo.syncStatus === 'error' ? 'red' : 'orange',
                fontWeight: 'bold'
              }}>
                {debugInfo.syncStatus}
              </span>
            </div>
            {debugInfo.errorMessage && (
              <div style={{ color: 'red' }}><strong>错误:</strong> {debugInfo.errorMessage}</div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>本地数据</h4>
        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
          {debugInfo?.localStorageData && Object.entries(debugInfo.localStorageData).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '4px' }}>
              <strong>{key}:</strong> {value ? (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : String(value)) : 'null'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>云端数据</h4>
        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
          {debugInfo?.cloudProfile ? (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(debugInfo.cloudProfile, null, 2)}
            </pre>
          ) : (
            <div style={{ color: '#666' }}>无云端数据</div>
          )}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>同步日志</h4>
        <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>暂无日志</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '2px',
                color: log.includes('ERROR') ? 'red' : '#333'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

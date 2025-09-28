import React from 'react';
import { useToast, Toast, ToastManager } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  // 兜底：允许通过 window 事件触发 toast
  React.useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail) return;
      try {
        const { type, title, message, duration } = e.detail || {};
        ToastManager.getInstance().show({ type, title, message, duration });
      } catch {}
    };
    window.addEventListener('mp-toast', handler as any);
    return () => window.removeEventListener('mp-toast', handler as any);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none flex flex-col gap-2 items-end">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

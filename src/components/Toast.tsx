import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // 自动关闭
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(message.id), 300);
    }, message.duration || 6000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [message.id, message.duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(message.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "fixed top-20 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out";
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0`;
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'info': return 'border-blue-500';
      default: return 'border-blue-500';
    }
  };

  const getIconColor = () => {
    switch (message.type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className={`border-l-4 ${getBorderColor()}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`h-5 w-5 rounded-full ${getIconColor().replace('text-', 'bg-')} flex items-center justify-center`}>
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {message.title}
              </p>
              {message.message && (
                <p className="mt-1 text-sm text-gray-500">
                  {message.message}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleClose}
              >
                <span className="sr-only">关闭</span>
                <span className="h-5 w-5">×</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast 管理器
export class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastMessage[] = [];
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    try { console.log('[ToastManager] notify', { count: this.toasts.length }); } catch {}
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  public show(message: Omit<ToastMessage, 'id'>) {
    const toast: ToastMessage = {
      id: Date.now().toString(),
      duration: 6000,
      ...message
    };
    try { console.log('[ToastManager] show', toast); } catch {}
    this.toasts.push(toast);
    this.notify();
  }

  public remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  public clear() {
    this.toasts = [];
    this.notify();
  }
}

// React Hook for Toast
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const manager = ToastManager.getInstance();

  useEffect(() => {
    const unsubscribe = manager.subscribe(setToasts);
    return unsubscribe;
  }, [manager]);

  const showToast = (message: Omit<ToastMessage, 'id'>) => {
    manager.show(message);
  };

  const removeToast = (id: string) => {
    manager.remove(id);
  };

  return { toasts, showToast, removeToast };
};
